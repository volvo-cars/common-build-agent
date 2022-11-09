import { Expose, Type } from "class-transformer"
import { Codec } from "../../domain-model/system-config/codec";
import { DownloadLog } from "./download-log-builder";
import Yaml from "yaml"
export class DownloadLogImpl implements DownloadLog.Builder {

    private files: DownloadLog.File[] = []

    addFile(file: DownloadLog.File): void {
        this.files.push(file)
    }
    createLogContent(): string {
        const files = new Files(this.files)
        return Yaml.stringify(Codec.toPlain(files))
    }
}

class Files {

    @Expose()
    @Type(() => DownloadLog.File)
    files: DownloadLog.File[]

    constructor(files: DownloadLog.File[]) {
        this.files = files
    }
}