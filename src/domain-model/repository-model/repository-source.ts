import { Expose } from "class-transformer"

export type RepositoryPath = string
export type RepositoryStoreId = string
export class RepositorySource {
    @Expose()
    public id: RepositoryStoreId
    @Expose()
    public path: RepositoryPath
    constructor(id: RepositoryStoreId, path: RepositoryPath) {
        this.id = id
        this.path = path
    }
    toString(): string {
        return `source:${this.id}/${this.path}`
    }
    asString(): string {
        return `${this.id}/${this.path}`
    }
    serialize(): string {
        return `${this.id}:${this.path}`
    }
    static createFromObject(object: { id: string, path: string }): RepositorySource {
        return new RepositorySource(object.id, object.path)
    }
    static createFromString(str: string): RepositorySource {
        const [id, ...rest] = str.split("/")
        if (id && rest && rest.length) {
            return new RepositorySource(id, rest.join("/"))
        } else {
            throw new Error(`Could not parse ${str} to RepositorySource`)
        }
    }
    static deserialize(serialized: string): RepositorySource {
        const [id, path] = serialized.split(":")
        if (id && path) {
            return new RepositorySource(id, path)
        } else {
            throw new Error(`Could not parse RepositorySource:${serialized}`)
        }
    }
    static unique(sources: RepositorySource[]): RepositorySource[] {
        const serializRepositories = sources.reduce((acc, next) => {
            const serialized = next.serialize()
            if (!acc.has(serialized)) {
                return acc.add(serialized)
            }
            return acc
        }, new Set<string>())
        return Array.from(serializRepositories.values()).map(s => { return RepositorySource.deserialize(s) })
    }
    equals(other: RepositorySource): Boolean {
        return this.id === other.id && this.path === other.path
    }

}