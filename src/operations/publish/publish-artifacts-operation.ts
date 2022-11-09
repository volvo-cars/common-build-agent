import { PublicationConfig } from "../../domain-model/system-config/publication-config";
import { GitUtils } from '../../utils/git-utils';
import { VaultService } from '../../vault/vault-service';
import { Operations } from "../operation";
import { ArtifactoryService, ArtifactRef } from './artifactory-service';
import { Artifacts } from './artifacts';
export class PublishArtifactsOperation extends Operations.Operation {
    constructor(private publicationArtifacts: PublicationConfig.Artifacts, private vaultService: VaultService) {
        super()
    }

    execute(id: Operations.Id, receiver: Operations.OutputReceiver): Promise<void> {
        return GitUtils.getSha().then(gitSha => {

            const artifactoryService = new ArtifactoryService(this.vaultService)
            return Artifacts.createArtifactItems(id, this.publicationArtifacts).then(artifactItems => {
                return Promise.all(artifactItems.map(item => {
                    const artifactRef = new ArtifactRef(
                        item.meta.path, item.meta.remote, item.meta.repository, gitSha.sha, item.fileName)
                    console.log(`Publishing artifact: ${artifactRef} (${item.description})`)
                    return artifactoryService.publish(artifactRef, item.stream()
                    ).then((publishedContent) => {
                        console.log(`Published artifact: ${publishedContent.url}`)
                    })
                })).then(() => {
                    console.log("Completed all artifact publications.")
                }).catch(e => {
                    console.log(`Error while publishing artifact: ${e}`)
                    return Promise.reject(e)
                })
            })
        })
    }

}