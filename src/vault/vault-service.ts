import _ from 'lodash'
import NodeVault from 'node-vault'
import { createLogger } from '../logging/logging-factory'
import { maskValues } from './masker'

export class VaultOptions {
    constructor(public readonly apiVersion: string, public readonly endpoint: string, public readonly token: string, public readonly logging: boolean = false) { }
}

const logger = createLogger("Vault-service")

export interface VaultService {
    clear(): void
    getSecret(path: string): Promise<string>
    mask<T>(input: T): T
}

export class VaultServiceImpl implements VaultService {
    private vault: NodeVault.client
    private cache: Record<string, Promise<string>> = {}
    private resolvedValues: string[] = []
    constructor(private readonly options: VaultOptions) {
        let vault = NodeVault(options)
        /*vault.init({ secret_shares: 1, secret_threshold: 1 })
        .then( (result) => {
            var keys = result.keys;
            // set token for all following requests
            vault.token = result.root_token;
            // unseal vault server
            return vault.unseal({ secret_shares: 1, key: keys[0] })
        })
        */
        this.vault = vault
    }

    clear(): void {
        this.cache = {}
    }

    getSecret(path: string): Promise<string> {
        let existing = this.cache[path]
        if (existing) {
            return existing
        }
        let promise = new Promise<string>((resolve, reject) => {
            let parts = path.split('/')
            const parent = _.initial(parts).join("/")

            let retrievePromise = this.cache[parent]
            if (!retrievePromise) {
                this.options.logging && logger.debug(`Loading secrets from from ${parent}`)
                retrievePromise = this.vault.read(parent)
                this.cache[parent] = retrievePromise
            }
            retrievePromise.then((o) => {
                if (_.isObject(o)) {
                    const key = _.last(parts)
                    if (key) {
                        this.options.logging && logger.debug(`Loading secret from from ${path}`)
                        let value = _.get(o, ["data", key], null)
                        if (value) {
                            this.resolvedValues.push(value)
                            this.resolvedValues = _.uniq(this.resolvedValues)
                            resolve(value)
                        } else {
                            reject(`No secret found: ${path}`)
                        }
                    } else {
                        reject(`Key was not defined in ${path}`)
                    }
                } else {
                    reject("Vault did not return an object")
                }
            })
                .catch(error => {
                    reject(new Error(`Vault error for secret ${path}: ${error}`))
                })
        })
        this.cache[path] = promise
        return promise
    }

    mask<T>(input: T): T {
        return maskValues(input, this.resolvedValues)
    }

}

