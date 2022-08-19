import { GoogleRepoSSHId, GoogleRepoUtils } from "../../google-repo/google-repo-utils";
import { FileReader } from "../../utils/file-reader";
import { VaultService } from "../../vault/vault-service";
import { Operations } from "../operation";
import * as cheerio from 'cheerio'
import _ from "lodash";

export class GoogleRepoOperation implements Operations.Operation {
    constructor(private fileReader: FileReader) { }
    private static SSH_URL_MATCHER = /^\s*ssh:\/\/(.*)$/i
    execute(id: Operations.Id, receiver: Operations.OutputReceiver, vaultService: VaultService): Promise<void> {
        return this.fileReader.getFile("default.xml").then(defaultXml => {
            if (defaultXml) {
                console.log(`Processing default.xml`)
                const $ = cheerio.load(defaultXml, {
                    xmlMode: true
                })
                const sshHosts: string[] = []
                $("remote").each((n, elem) => {
                    const item = $(elem)
                    const sshUrl = item.attr("fetch")
                    if (sshUrl) {
                        const m = sshUrl.match(GoogleRepoOperation.SSH_URL_MATCHER)
                        if (m && m.length) {
                            sshHosts.push(m[1])
                        }
                    }
                })
                const googleRepoIds: GoogleRepoSSHId[] = []
                sshHosts.forEach(host => {
                    const parts = host.split(".")
                    const first = _.first(parts)
                    if (first) {
                        if (!googleRepoIds.find(gc => {
                            return gc.vaultKeyPrefix === first
                        })) {
                            googleRepoIds.push(new GoogleRepoSSHId(first, host))
                        }
                    }
                })

                const googleRepo = new GoogleRepoUtils(vaultService)
                return googleRepo.downloadRepo(process.cwd(), googleRepoIds).then(() => {
                    console.log("Downloaded all dependencies in default.xml")
                })
            } else {
                return Promise.resolve()
            }
        })
    }

}