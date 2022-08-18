import { exec } from 'child_process'


export namespace GitUtils {

    const execute = (cmd: string): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            const output: string[] = []
            exec(cmd, (error, stdin, stderr) => {
                if (error) {
                    reject(error)
                } else {
                    output.push(stdin)
                }
            }).on('close', () => {
                resolve(output.join("\n"))
            }).on('error', reject)
        })
    }

    export class GitSha {
        constructor(public readonly sha: string) { }
    }

    export const getSha = (): Promise<GitSha> => {
        return execute("git rev-parse HEAD").then(sha => {
            return new GitSha(sha.trim())
        })
    }
}