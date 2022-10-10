import fs from 'fs';
import _ from 'lodash';
import stream from 'stream';
import { PublicationConfig } from '../../../src/domain-model/system-config/publication-config';
import { TarUtils } from "../../utils/tar-utils";
import { Operations } from '../operation';
import * as fg from 'fast-glob';

export namespace Artifacts {

    export class ArtifactItemMeta {
        constructor(public readonly repository: string, public readonly remote: string, public readonly path: string, public readonly name: string, public readonly src: string) { }
        toString(): string {
            return `artifact-item-meta: ${this.repository}/${this.path}@${this.remote}`
        }
    }

    export abstract class ArtifactItem {
        constructor(public readonly meta: ArtifactItemMeta) { }
        abstract materialize(out: stream.Writable): Promise<void>
        abstract fullName(): string
        abstract stats(): [string, number][]
        abstract description(): string
        abstract stream(): stream.Readable
    }

    export class SingleArtifactItem extends ArtifactItem {

        constructor(public readonly meta: ArtifactItemMeta, public path: string) {
            super(meta)
        }
        override stats(): [string, number][] {
            const suffix = _.last(this.meta.name.split(".")) || ""
            return [[suffix, 1]]
        }
        override description(): string {
            return `${this.fullName()} (${this.meta}) (single file) path:${this.path}`
        }

        stream(): stream.Readable {
            return fs.createReadStream(this.path)
        }

        override materialize(out: stream.Writable): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                const instream = this.stream()
                instream.on('error', reject)
                out.on('error', reject)
                instream.on('end', () => {
                    resolve()
                })
                instream.pipe(out)
            })
        }
        override fullName(): string {
            return this.meta.name
        }
    }
    export class MultiArtifactItem extends ArtifactItem {


        constructor(public readonly meta: ArtifactItemMeta, private basePath: string, private readonly relativePaths: string[]) {
            super(meta)
        }

        override fullName(): string {
            return this.meta.name + ".tar.gz"
        }

        override stats(): [string, number][] {
            const counts = _.countBy(this.relativePaths, (s) => {
                const lastDot = s.lastIndexOf(".")
                const lastSlash = s.lastIndexOf("/")
                if (lastDot > lastSlash) {
                    return s.substring(lastDot + 1)
                } else {
                    return ""
                }
            })
            const countTexts: [string, number][] = []
            for (let suffix in counts) {
                let count = counts[suffix]
                countTexts.push([suffix, count])
                // Use `key` and `value`
            }
            return _.sortBy(countTexts, (([suffix, count]) => {
                return count * -1
            }))
        }
        override description(): string {
            return `${this.fullName()} (${this.meta}) (${this.relativePaths.length} files) basePath:${this.basePath}`
        }

        stream(): stream.Readable {
            return TarUtils.readStream(this.relativePaths, this.basePath)
        }

        override materialize(out: stream.Writable): Promise<void> {
            return TarUtils.pipe(this.relativePaths, this.basePath, out)
        }
    }

    export const createArtifactItems = (id: Operations.Id, artifacts: PublicationConfig.Artifacts, baseDir?: string): Promise<Artifacts.ArtifactItem[]> => {
        return Promise.resolve((artifacts.items || []).flatMap(artifact => {
            const items: Artifacts.ArtifactItem[] = artifact.qualifiers.map(qualifier => {
                let pattern = _.trim(qualifier.src, "/ ")
                let parts = pattern.split('/')
                let baseParts = _.takeWhile(parts, part => { return part.indexOf('*') < 0 })
                let name = qualifier.name || qualifier.classifier || _.last(baseParts) || "no-name"
                if (parts.length == baseParts.length) {
                    const filePath = baseDir ? [baseDir, pattern].join("/") : pattern
                    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                        const meta = new Artifacts.ArtifactItemMeta(
                            artifact.repository || artifacts.repository,
                            artifact.remote || artifacts.remote,
                            artifact.path,
                            name,
                            pattern
                        )
                        return new Artifacts.SingleArtifactItem(meta, filePath)
                    } else {
                        pattern = `${pattern}/**/*`
                    }
                }
                const matched = fg.sync(pattern, { onlyFiles: true, cwd: baseDir })
                const basePart = baseParts.join("/")
                const dirPath = baseDir ? [baseDir, basePart].filter(s => { return s }).join("/") : basePart
                const meta = new Artifacts.ArtifactItemMeta(
                    artifact.repository || artifacts.repository,
                    artifact.remote || artifacts.remote,
                    artifact.path,
                    name,
                    pattern
                )
                return new Artifacts.MultiArtifactItem(meta, dirPath, matched.map(m => {
                    return m.substring(basePart.length > 0 ? basePart.length + 1 : 0)
                }).sort())
            })
            return items
        }))
    }
}