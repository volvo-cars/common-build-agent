import { Codec } from "../../domain-model/system-config/codec"
import { DependenciesConfig } from "../../domain-model/system-config/dependencies-config"
import { FileReader } from "../../utils/file-reader"
import { VaultService } from "../../vault/vault-service"
import { Operations } from "../operation"
import Yaml from 'yaml'
import { ServiceConfig } from "../../domain-model/system-config/service-config"
import { ArtifactoryService, ArtifactRef } from "../publish/artifactory-service"
import { PassThrough, Writable } from "stream"
import { TarUtils } from "../../utils/tar-utils"
import fs from 'fs'
export class CommonBuildDependenciesOperations implements Operations.Operation {
    constructor(private fileReader: FileReader, private storages: ServiceConfig.ArtifactoryStorage[]) { }
    execute(id: Operations.Id, receiver: Operations.OutputReceiver, vaultService: VaultService): Promise<void> {
        return this.fileReader.getFile(DependenciesConfig.FILE_PATH).then(config => {
            if (config) {
                console.log(`Processing ${DependenciesConfig.FILE_PATH}`)
                return this.process(Codec.toInstance(Yaml.parse(config.toString()), DependenciesConfig.Config), id, vaultService)
            }
        })
    }

    process(config: DependenciesConfig.Config, id: Operations.Id, vaultService: VaultService): Promise<void> {
        console.log(`Executing download dependencies...`)
        const artifactsConfig = config.artifacts
        if (artifactsConfig) {
            const artifactoryService = new ArtifactoryService(this.storages, vaultService)
            return Promise.all(artifactsConfig.items.map(artifact => {
                return Promise.all(artifact.files.map(file => {
                    const ref = new ArtifactRef(artifact.path, artifact.remote || artifactsConfig.remote, artifact.repository || artifactsConfig.repository, `${artifact.revision}/${file.name}`)
                    const pathSegments = [artifactsConfig.toDir, artifact.toDir].filter(s => { return s })
                    const tarGzSuffix = "tar.gz"

                    if (file.name.endsWith(tarGzSuffix)) {
                        pathSegments.push(file.rename || file.name.substring(0, file.name.length - (tarGzSuffix.length + 1)))
                    }
                    const path = pathSegments.join("/")
                    try {
                        fs.mkdirSync(path, { recursive: true })
                    } catch (e) { } // Silent due to possible parallellism class
                    if (file.name.endsWith(tarGzSuffix)) {
                        const stream = new PassThrough()
                        TarUtils.saveFiles(stream, path)
                        return artifactoryService.download(ref, stream).then(() => {
                            console.log(`Downloaded and extracted tar-file: ${file.name} into ${path}`)
                        })
                    } else {
                        const targetFile = `${path}/${file.rename || file.name}`
                        const stream = fs.createWriteStream(targetFile)
                        return artifactoryService.download(ref, stream).then(() => {
                            console.log(`Downloaded file ${file.name} to ${targetFile}`)
                        })
                    }
                })).then(() => { })
            })).then(() => { })
        } else {
            return Promise.resolve()
        }
    }
}
