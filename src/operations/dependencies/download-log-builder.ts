import { Expose, Type } from "class-transformer"

export namespace DownloadLog {
    export interface Builder {
        addFile(file: File): void
        createLogContent(): string
    }
    export class File {
        @Expose()
        localPath: string

        @Expose()
        sha256: string

        @Expose()
        @Type(() => String)
        properties: Map<string, string>

        constructor(localPath: string, sha256: string, properties: Map<string, string>) {
            this.localPath = localPath
            this.sha256 = sha256
            this.properties = properties
        }
    }
}