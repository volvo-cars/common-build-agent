import fs from 'fs';
import _ from 'lodash';
import stream from 'stream';
import { PublicationConfig } from '../../domain-model/system-config/publication-config';
import { TarUtils } from "../../utils/tar-utils";
import { Operations } from '../operation';
import * as fg from 'fast-glob';
import { QualifierDecoder } from './qualifier-decoder';

export namespace Artifacts {

    export class ArtifactItemMeta {
        constructor(public readonly repository: string, public readonly remote: string, public readonly path: string) { }
        toString(): string {
            return `artifact-item-meta: ${this.repository}/${this.path}@${this.remote}`
        }
    }

    export abstract class ArtifactItem {
        constructor(public readonly meta: ArtifactItemMeta) { }
        abstract get fileName(): string
        abstract get description(): string
        abstract materialize(out: stream.Writable): Promise<void>
        abstract stream(): stream.Readable
    }

    export class SingleArtifactItem extends ArtifactItem {

        constructor(public readonly meta: ArtifactItemMeta, public path: string, readonly fileName: string) {
            super(meta)
        }

        override get description(): string {
            return `Single file`
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
    }
    export class MultiArtifactItem extends ArtifactItem {


        constructor(public readonly meta: ArtifactItemMeta, private basePath: string, readonly relativePaths: string[], readonly fileName: string) {
            super(meta)
        }

        override get description(): string {
            return `Multi-file containing ${this.relativePaths.length} files`
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
            return artifact.qualifiers.map(qualifier => {
                const decodedQualifier = QualifierDecoder.decode(qualifier)
                const matchedFiles = fg.sync(qualifier.src, { onlyFiles: true, cwd: baseDir })
                if (matchedFiles.length === 0) {
                    throw new Error(`The src attribute '${qualifier.src}' did not match any files.`)
                }
                const meta = new Artifacts.ArtifactItemMeta(
                    artifact.repository || artifacts.repository,
                    artifact.remote || artifacts.remote,
                    artifact.path
                )

                if (decodedQualifier.mode === PublicationConfig.QualifierPackMode.YES) {
                    const dirPath = [baseDir, decodedQualifier.basePath].filter(s => { return s }).join("/")
                    const defaultName = (_.last(decodedQualifier.basePath?.split("/")) || "no-name") + ".tar.gz"
                    const fileName = qualifier.name || defaultName
                    return new Artifacts.MultiArtifactItem(meta, dirPath, matchedFiles.map(m => {
                        return m.substring(decodedQualifier.basePath ? decodedQualifier.basePath.length + 1 : 0)
                    }).sort(), fileName)
                } else if (decodedQualifier.mode === PublicationConfig.QualifierPackMode.NO) {
                    if (matchedFiles.length === 1) {
                        const matchedFile = matchedFiles[0]
                        const defaultFileName = <string>_.last(matchedFile.split("/"))
                        const fileName = qualifier.name || defaultFileName
                        return new Artifacts.SingleArtifactItem(meta, [baseDir, matchedFile].filter(s => { return s }).join("/"), fileName)

                    } else {
                        throw new Error(`Expected a single file match (matched: ${matchedFiles.join(",")})`)
                    }
                } else {
                    throw new Error(`Unexpected pack mode: ${decodedQualifier.mode}`)
                }
            })
        }))
    }
}