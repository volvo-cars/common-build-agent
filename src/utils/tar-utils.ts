import { ReadStream } from "fs";
import { Readable, Stream, Writable } from "stream";
import tar from "tar";
export namespace TarUtils {
    export const pipe = async (relativeFiles: string[], baseDir: string | undefined, out: Writable): Promise<void> => {
        const fixedFiles = relativeFiles.map(f => {
            return f[0] === '@' ? "./" + f : f
        })
        return new Promise<void>((resolve, reject) => {
            const tarStream = tar.c({
                gzip: true,
                cwd: baseDir
            },
                fixedFiles
            )
            tarStream.on('finish', resolve)
            tarStream.on('error', reject)
            out.on('error', reject)
            tarStream.pipe(out)
        })
    }

    export const readStream = (relativeFiles: string[], baseDir: string | undefined): Readable => {
        const fixedFiles = relativeFiles.map(f => {
            return f[0] === '@' ? "./" + f : f
        })
        return tar.c({
            gzip: true,
            cwd: baseDir
        },
            fixedFiles
        )
    }

    export const saveFiles = (tarStream: Readable, destDir: string): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            tarStream.pipe(tar.x({
                cwd: destDir
            }))
                .on('finish', resolve)
                .on('error', reject)
        })
    }

}