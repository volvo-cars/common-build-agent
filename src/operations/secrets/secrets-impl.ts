import fs from 'fs'
import { VaultService } from '../../vault/vault-service'
import { VaultUtils } from '../../vault/vault-utils'
import { Secrets } from './secrets'



class SecretImpl implements Secrets.Secret {
    constructor(private fileName: string, private externalPath: string) { }
    get path(): string {
        return `${this.externalPath}/${this.fileName}`
    }

}


export class ResolvedSecret {
    constructor(public readonly fileName: string, public readonly value: string) { }
}

interface Entry {
    getFileSecrets(vaultService: VaultService): Promise<ResolvedSecret[]>
}
class SecretEntry implements Entry {
    constructor(private readonly fileName: string, private readonly vaultPath: string) { }
    getFileSecrets(vaultService: VaultService): Promise<ResolvedSecret[]> {
        return vaultService.getSecret(this.vaultPath).then(secret => {
            return [new ResolvedSecret(this.fileName, secret)]
        })
    }
}

class AuthEntry implements Entry {
    constructor(private baseFileName: string, private readonly vaultPath: string) { }

    get userFilename(): string {
        return `${this.baseFileName}_user`
    }
    get secretFilename(): string {
        return `${this.baseFileName}_secret`
    }

    getFileSecrets(vaultService: VaultService): Promise<ResolvedSecret[]> {
        return vaultService.getSecret(this.vaultPath).then(secret => {
            const [userValue, secretValue] = VaultUtils.splitUserSecret(secret)
            return [new ResolvedSecret(this.userFilename, userValue), new ResolvedSecret(this.secretFilename, secretValue)]
        })
    }
}

export class SecretsImpl implements Secrets.Service {

    private registeredSecrets = new Map<string, string>()

    constructor(private externalPath: string) { }

    private registerSecret(vaultPath: string): string {
        const existing = this.registeredSecrets.get(vaultPath)
        if (existing) {
            return existing
        }
        const existingFileNames = Array.from(this.registeredSecrets.values())
        const baseFileName = vaultPath.replace(/[\/\s]/gi, "_")
        let resolvedFilename = baseFileName
        let counter = 0
        while (existingFileNames.indexOf(resolvedFilename) >= 0) {
            counter++
            resolvedFilename = `${baseFileName}_${counter}`
        }
        this.registeredSecrets.set(vaultPath, resolvedFilename)
        return resolvedFilename
    }

    private entries: Entry[] = []

    mountSecret(vaultPath: string): Secrets.Secret {
        const fileName = this.registerSecret(vaultPath)
        const entry = new SecretEntry(fileName, vaultPath)
        this.entries.push(entry)
        return new SecretImpl(fileName, this.externalPath)
    }

    mountAuth(vaultPath: string): [Secrets.Secret, Secrets.Secret] {

        const baseFileName = this.registerSecret(vaultPath)
        const entry = new AuthEntry(baseFileName, vaultPath)
        this.entries.push(entry)
        return [new SecretImpl(entry.userFilename, this.externalPath), new SecretImpl(entry.secretFilename, this.externalPath)]
    }

    resolvedSecrets(vaultService: VaultService): Promise<ResolvedSecret[]> {
        return Promise.all(this.entries.map(e => {
            return e.getFileSecrets(vaultService)
        })).then(resolved => {
            return resolved.flat()
        })
    }

    writeSecrets(vaultService: VaultService, internalPath: string): Promise<void> {
        return this.resolvedSecrets(vaultService).then(resolvedSecrets => {
            if (!fs.existsSync(internalPath)) {
                fs.mkdirSync(internalPath, { recursive: true })
            }
            resolvedSecrets.forEach(resolvedSecret => {
                fs.writeFileSync(`${internalPath}/${resolvedSecret.fileName}`, resolvedSecret.value)
            })
        })
    }

}

