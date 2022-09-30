import _ from "lodash"
import { RepositorySource } from "../repository-model/repository-source"
export namespace DependencyRef {

    export type ArtifactRemote = string
    export type ArtifactRepository = string
    export type ImageRemote = string

    export type ImageRepository = string
    export type ArtifactPath = string

    const delimiter = "::"

    export const deserialize = (serialized: string): Ref => {
        const parts = serialized.split(delimiter)
        const [head, ...tail] = parts
        if (head === ArtifactRef.name) {
            return ArtifactRef.create(tail)
        } else if (head === ImageRef.name) {
            return ImageRef.create(tail)
        } else if (head === GitRef.name) {
            return GitRef.create(tail)
        } else {
            throw new Error(`Uknown ref-type: ${head}.`)
        }
    }

    export abstract class Ref {
        serialize(): string {
            return [this.constructor.name, this.fields()].flat().join(delimiter)
        }
        protected abstract fields(): string[]
        abstract toString(): string
    }

    export class ArtifactRef extends Ref {
        remote: ArtifactRemote
        repository: ArtifactRepository
        path: ArtifactPath

        constructor(remote: ArtifactRemote, repository: ArtifactRepository, path: ArtifactPath) {
            super()
            this.remote = remote
            this.repository = repository
            this.path = path
        }
        protected fields(): string[] {
            return [this.remote, this.repository, this.path]
        }
        static create(fields: string[]): ArtifactRef {
            return new ArtifactRef(fields[0], fields[1], fields[2])
        }
        toString(): string {
            return `Artifact:${this.remote}/${this.repository}/${this.path}`
        }

    }

    export class ImageRef extends Ref {
        remote: ImageRemote
        repository: ImageRepository

        constructor(remote: ImageRemote, repository: ImageRepository) {
            super()
            this.remote = remote
            this.repository = repository
        }
        protected fields(): string[] {
            return [this.remote, this.repository]
        }
        static create(fields: string[]): ImageRef {
            return new ImageRef(fields[0], fields[1])
        }
        toString(): string {
            return `Image:${this.remote}/${this.repository}`
        }

    }

    export class GitRef extends Ref {
        source: RepositorySource
        constructor(source: RepositorySource) {
            super()
            this.source = source
        }
        protected fields(): string[] {
            return [this.source.serialize()]
        }
        static create(fields: string[]): GitRef {
            return new GitRef(RepositorySource.deserialize(fields[0]))
        }
        toString(): string {
            return `Git:${this.source.toString()}`
        }

    }

    export const uniqueRefs = (refs: DependencyRef.Ref[]): DependencyRef.Ref[] => {
        return _.uniq(refs.map(ref => { return ref.serialize() })).map(s => { return deserialize(s) })
    }
}
