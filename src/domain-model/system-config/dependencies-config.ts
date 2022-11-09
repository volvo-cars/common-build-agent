import { Expose, Type } from "class-transformer"
import { DependencyRef } from "./dependency-ref"
import { DomainFiles } from "./domain-files"

export namespace DependenciesConfig {

    export class ArtfifactFile {
        @Expose()
        name: string
        @Expose()
        rename: string | undefined
        @Expose()
        toDir: string | undefined
        constructor(name: string, rename: string | undefined, toDir: string | undefined) {
            this.name = name
            this.rename = rename // Renames this file/directory when saving.
            this.toDir = toDir
        }
    }

    export class Artifact {
        @Expose()
        remote: DependencyRef.ArtifactRemote | undefined
        @Expose()
        repository: DependencyRef.ArtifactRepository | undefined
        @Expose()
        path: DependencyRef.ArtifactPath
        @Expose()
        revision: string
        @Expose()
        toDir: string | undefined
        @Expose()
        labels: string | undefined

        @Expose()
        @Type(() => ArtfifactFile)
        files: ArtfifactFile[]

        constructor(remote: DependencyRef.ArtifactRemote | undefined, repository: DependencyRef.ArtifactRepository | undefined, path: DependencyRef.ArtifactPath, revision: string, files: ArtfifactFile[], toDir: string | undefined, labels: string | undefined) {
            this.remote = remote
            this.repository = repository
            this.path = path
            this.revision = revision
            this.toDir = toDir
            this.labels = labels
            this.files = files
        }
    }



    export class Artifacts {

        @Expose()
        remote: DependencyRef.ArtifactRemote

        @Expose()
        repository: DependencyRef.ArtifactRepository

        @Expose()
        @Type(() => Artifact)
        items: Artifact[]

        @Expose()
        toDir: string | undefined

        @Expose()
        logFile: string | undefined


        constructor(remote: DependencyRef.ArtifactRemote, repository: DependencyRef.ArtifactRepository, items: Artifact[], toDir: string | undefined, logFile: string | undefined) {
            this.remote = remote
            this.repository = repository
            this.items = items
            this.toDir = toDir
            this.logFile = logFile
        }
    }



    export class Image {
        @Expose()
        repository: DependencyRef.ImageRepository
        @Expose()
        revision: string
        @Expose()
        remote: DependencyRef.ImageRemote | undefined
        @Expose()
        labels: string | undefined

        constructor(repository: DependencyRef.ImageRepository, revision: string, remote: DependencyRef.ImageRemote | undefined, labels: string | undefined) {
            this.repository = repository
            this.revision = revision
            this.remote = remote
            this.labels = labels
        }
    }

    export class Images {
        @Expose()
        remote: DependencyRef.ImageRemote
        @Expose()
        @Type(() => Image)
        images: Image[]
        constructor(remote: DependencyRef.ImageRemote, images: Image[]) {
            this.remote = remote
            this.images = images
        }
    }


    export class Config {

        @Expose()
        public version: number

        @Expose()
        public artifacts: Artifacts | undefined

        @Expose()
        public images: Images | undefined

        constructor(version: number, artifacts: Artifacts | undefined, images: Images | undefined) {
            this.version = version
            this.artifacts = artifacts
            this.images = images
        }
    }

    export const FILE_PATH: string = DomainFiles.systemFilePath("dependencies.yml")
}