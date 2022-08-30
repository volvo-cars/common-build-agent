import * as cheerio from 'cheerio'
import _ from 'lodash'
export namespace DefaulXmlExtractor {

    export enum Protocol {
        https = "https",
        ssh = "ssh"
    }

    export class HostExtract {
        constructor(public readonly name: string, public readonly host: string, public readonly protocol: Protocol, public readonly path: string | undefined) { }
        toString(): string {
            return `HostExtract:${this.name}=${this.protocol}://${this.host} (${this.path || "N/A"})`
        }
    }

    export class Extractor {
        private static URL_MATCHER = /^\s*(ssh|https):\/\/([^\/]+)(.*)$/i
        private constructor(private readonly defaultXml: cheerio.Root) { }

        static createFromString(defaultXml: string): Extractor {
            return new Extractor(cheerio.load(defaultXml, {
                xmlMode: true
            }))
        }
        static createFromXml(defaultXml: cheerio.Root): Extractor {
            return new Extractor(defaultXml)
        }


        extract(): HostExtract[] {
            const extracts: HostExtract[] = []
            const $ = this.defaultXml
            $("remote").each((n, elem) => {
                const item = $(elem)
                const name = item.attr("name")
                const url = item.attr("fetch")
                if (url && name) {
                    const m = url.match(Extractor.URL_MATCHER)
                    if (m && m.length) {
                        const protocol = Protocol[m[1] as unknown as keyof typeof Protocol]
                        const path = _.trim(m[3].trim(), " /")
                        extracts.push(new HostExtract(name, m[2], protocol, path ? path : undefined))
                    }
                }
            })
            return extracts
        }
    }
}