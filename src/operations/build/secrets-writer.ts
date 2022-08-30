import fs from 'fs'
import { VaultService } from '../../vault/vault-service'
import { VaultUtils } from '../../vault/vault-utils'


export namespace Secrets {

    export interface Service {
        mountSecret(name: string, vaultPath: string): Secret

        /**
         * @returns [UserSecret,AuthSecret]
         */
        mountAuth(name: string, vaultPath: string): [Secret, Secret]
    }

    export interface Secret {
        readonly name: string,
        readonly filePath: string
    }

    export class SecretPaths {
        constructor(public readonly externalPath: string, public readonly internalPath: string) { }
    }
}

export class InternalSecret implements Secrets.Secret {
    public readonly filePath: string
    public readonly internalFilePath: string
    constructor(public readonly name: string, fileName: string, secretPaths: Secrets.SecretPaths) {
        this.filePath = `${secretPaths.externalPath}/${fileName}`
        this.internalFilePath = `${secretPaths.internalPath}/${fileName}`
    }
}


export class Base {
    constructor() { }
    private countsByName = new Map<string, number>()

    getFileName(name: string): string {
        const next = this.countsByName.get(name)
        if (next === undefined) {
            this.countsByName.set(name, 1)
            return name
        } else {
            this.countsByName.set(name, next + 1)
            return `${name}_${next}`
        }
    }
}

class FileSecret {
    constructor(public readonly filePath: string, public readonly value: string) { }
}

interface Entry {
    getFileSecrets(vaultService: VaultService): Promise<FileSecret[]>
}
class SecretEntry implements Entry {
    constructor(private readonly secret: InternalSecret, private readonly vaultPath: string) { }
    getFileSecrets(vaultService: VaultService): Promise<FileSecret[]> {
        return vaultService.getSecret(this.vaultPath).then(secret => {
            return [new FileSecret(this.secret.internalFilePath, secret)]
        })
    }
}

class AuthEntry implements Entry {
    constructor(private readonly userSecret: InternalSecret, private readonly secretSecret: InternalSecret, private readonly vaultPath: string) { }

    getFileSecrets(vaultService: VaultService): Promise<FileSecret[]> {
        return vaultService.getSecret(this.vaultPath).then(secret => {
            const [userValue, secretValue] = VaultUtils.splitUserSecret(secret)
            return [new FileSecret(this.userSecret.internalFilePath, userValue), new FileSecret(this.secretSecret.internalFilePath, secretValue)]
        })
    }
}

export class SecretsWriterImpl implements Secrets.Service {
    constructor(private base: Base, private secretPaths: Secrets.SecretPaths) { }

    private entries: Entry[] = []

    mountSecret(name: string, vaultPath: string): Secrets.Secret {
        const secret = new InternalSecret(name, this.base.getFileName(name), this.secretPaths)
        this.entries.push(new SecretEntry(secret, vaultPath))
        return secret
    }

    mountAuth(name: string, vaultPath: string): [Secrets.Secret, Secrets.Secret] {
        const userSecretName = `${name}_user`
        const secretSecretName = `${name}_secret`
        const userSecret = new InternalSecret(userSecretName, this.base.getFileName(userSecretName), this.secretPaths)
        const secretSecret = new InternalSecret(secretSecretName, this.base.getFileName(secretSecretName), this.secretPaths)
        this.entries.push(new AuthEntry(userSecret, secretSecret, vaultPath))
        return [userSecret, secretSecret]
    }

    writeSecrets(vaultService: VaultService): Promise<void> {
        if (!fs.existsSync(this.secretPaths.internalPath)) {
            fs.mkdirSync(this.secretPaths.internalPath, { recursive: true })
        }
        return Promise.all(this.entries.map(e => {
            return e.getFileSecrets(vaultService).then(fileSecrets => {
                fileSecrets.forEach(fileSecret => {
                    fs.writeFileSync(`${fileSecret.filePath}`, fileSecret.value)
                })
            })
        })).then(_ => { })
    }

}

