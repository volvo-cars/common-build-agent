import { GoogleRepoUtils } from "../../google-repo/google-repo-utils";
import { FileReader } from "../../utils/file-reader";
import { VaultService } from "../../vault/vault-service";
import { Operations } from "../operation";
import _ from "lodash";
import { DefaulXmlExtractor } from "../../domain-model/default-xml-extractor";

export class GoogleRepoOperation implements Operations.Operation {
    constructor(private fileReader: FileReader, private vaultService: VaultService) { }

    execute(id: Operations.Id, receiver: Operations.OutputReceiver): Promise<void> {
        return this.fileReader.getFile("default.xml").then(defaultXml => {
            if (defaultXml) {
                console.log(`Processing default.xml`)
                const hostExtractor = DefaulXmlExtractor.Extractor.createFromString(defaultXml.toString())
                const googleRepo = new GoogleRepoUtils(this.vaultService)
                return googleRepo.downloadRepo(_.trimEnd(process.cwd(), " /"), hostExtractor.extract()).then(() => {
                    console.log("Downloaded all dependencies in default.xml")
                })
            } else {
                return Promise.resolve()
            }
        })
    }

}