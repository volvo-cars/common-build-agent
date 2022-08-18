import { PromotedVersion } from "../../domain-model/promoted-version";
import { GoogleRepoUtils } from "../../google-repo/google-repo-utils";
import { FileReader } from "../../utils/file-reader";
import { VaultService } from "../../vault/vault-service";
import { Operations } from "../operation";

export class GoogleRepoOperation implements Operations.Operation {
    constructor(private fileReader: FileReader) { }
    execute(id: Operations.Id, receiver: Operations.OutputReceiver, vaultService: VaultService): Promise<void> {
        return this.fileReader.getFile("default.xml").then(defaultXml => {
            if (defaultXml) {
                console.log(`Processing default.xml`)
                const googleRepo = new GoogleRepoUtils(vaultService)
                return googleRepo.downloadRepo(process.cwd()).then(() => {
                    console.log("Downloaded all dependencies in default.xml")
                })
            } else {
                return Promise.resolve()
            }
        })
    }

}