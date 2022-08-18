import fs from 'fs'
import { Dictionary } from 'lodash'
export interface SecretsWriter {
    registerSecret(name: string, value: string): void
    getSecretPath(name: string): string
}

const secretsPath = '.cb-secrets'

export class SecretsWriterImpl implements SecretsWriter {

    private secretsByName: Map<string, string> = new Map()

    getSecretPath(name: string): string {
        return `${secretsPath}/secret-${name}`
    }

    registerSecret(name: string, value: string): void {
        this.secretsByName.set(name, value)
    }


    writeSecrets(): Promise<void> {
        if (!fs.existsSync(secretsPath)) {
            fs.mkdirSync(secretsPath, { recursive: true })
        }
        this.secretsByName.forEach((value, name) => {
            console.log(`# Writing secret: ${name}`)
            fs.writeFileSync(this.getSecretPath(name), value, { mode: 0x777 })
        })
        return Promise.resolve()


    }

}