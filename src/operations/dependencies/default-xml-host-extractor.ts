import * as cheerio from 'cheerio'

export class DefaultXmlHostExtractor {
    private static SSH_URL_MATCHER = /^\s*ssh:\/\/(.*)$/i
    constructor(private readonly defaultXml: string) { }
    extract(): string[] {
        const $ = cheerio.load(this.defaultXml, {
            xmlMode: true
        })
        const sshHosts: string[] = []
        $("remote").each((n, elem) => {
            const item = $(elem)
            const sshUrl = item.attr("fetch")
            if (sshUrl) {
                const m = sshUrl.match(DefaultXmlHostExtractor.SSH_URL_MATCHER)
                if (m && m.length) {
                    sshHosts.push(m[1])
                }
            }
        })
        return sshHosts
    }
}