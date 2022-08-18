import { VaultService } from "../vault/vault-service";

export class MockVaultService implements VaultService {
    constructor(private secrets: Record<string, string>) { }
    clear(): void {

    }
    getSecret(path: string): Promise<string> {
        const secret = this.secrets[path]
        if (secret) {
            return Promise.resolve(secret)
        } else {
            return Promise.reject(new Error(`Could not find secret: ${path}`))
        }
    }
    mask<T>(input: T): T {
        return input
    }


}