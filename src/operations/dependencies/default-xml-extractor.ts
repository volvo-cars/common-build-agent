import * as cheerio from 'cheerio'
export namespace DefaulXmlExtractor {

    export enum Protocol {
        https = "https",
        ssh = "ssh"
    }

    export class HostExtract {
        constructor(public readonly host: string, public readonly protocol: Protocol) { }
        toString(): string {
            return `${this.protocol}://${this.host}`
        }
    }

    export class Extractor {
        private static URL_MATCHER = /^\s*(ssh|https):\/\/(.*)$/i
        constructor(private readonly defaultXml: string) { }
        extract(): HostExtract[] {
            const $ = cheerio.load(this.defaultXml, {
                xmlMode: true
            })
            const extracts: HostExtract[] = []
            $("remote").each((n, elem) => {
                const item = $(elem)
                const sshUrl = item.attr("fetch")
                if (sshUrl) {
                    const m = sshUrl.match(Extractor.URL_MATCHER)
                    if (m && m.length) {
                        const protocol = Protocol[m[1] as unknown as keyof typeof Protocol]
                        extracts.push(new HostExtract(m[2], protocol))
                    }
                }
            })
            return extracts
        }
    }
}