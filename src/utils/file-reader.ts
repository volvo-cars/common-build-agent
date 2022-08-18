import fs from 'fs'
export class FileReader {

    getFile(path: string): Promise<Buffer | undefined> {
        try {
            return Promise.resolve(fs.readFileSync(path))
        } catch (e) {
            return Promise.resolve(undefined)
        }
    }

}