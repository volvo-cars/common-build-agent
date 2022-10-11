import { Expose, Type } from "class-transformer"
import { DependencyRef } from "./dependency-ref"
import { DomainFiles } from "./domain-files"

export namespace PublicationConfig {


  export enum QualifierPackMode {
    ALWAYS = "always",
    AUTO = "auto",
    NEVER = "never"
  }

  /**
   * @param src local file or directory. If directory it will be compressed with tar.gz
   * @param name if not set it will default to src file- or directory name.
   */
  export class Qualifier {
    /*
    pattern: 
      no-name: last segment before pattern. If first => "default.tar.gz"
      name: name.tar.gz
    file: (no-pattern):
      no-name: file name 
      name: name
    directory: (no-pattern)
      no-name: directory.tar.gz
      name: name.tar.gz  


    */

    @Expose()
    src: string

    @Expose()
    name: string | undefined

    @Expose()
    pack: QualifierPackMode | undefined

    constructor(src: string, name: string | undefined, pack: QualifierPackMode | undefined) {
      this.src = src
      this.name = name
      this.pack = pack
    }
  }
  export class Artifact {
    @Expose()
    path: DependencyRef.ArtifactPath
    @Expose()
    @Type(() => Qualifier)
    qualifiers: Qualifier[]
    @Expose()
    remote?: DependencyRef.ArtifactRemote
    @Expose()
    repository?: DependencyRef.ArtifactRepository
    constructor(
      path: DependencyRef.ArtifactPath,
      qualifiers: Qualifier[],
      remote?: DependencyRef.ArtifactRemote,
      repository?: DependencyRef.ArtifactRepository,
    ) {
      this.path = path
      this.qualifiers = qualifiers
      this.remote = remote
      this.repository = repository
    }
  }


  export class Artifacts {
    @Expose()
    @Type(() => Artifact)
    items: Artifact[]
    @Expose()
    remote: string
    @Expose()
    repository: string
    constructor(items: Artifact[],
      remote: string, repository: string) {
      this.items = items
      this.remote = remote
      this.repository = repository
    }
  }

  export class Images {
    @Type(() => Image)
    @Expose()
    items: Image[]
    @Expose()
    remote: string
    constructor(
      items: Image[],
      remote: string) {
      this.items = items
      this.remote = remote
    }
  }

  export class Image {
    @Expose()
    remote?: DependencyRef.ImageRemote
    @Expose()
    name: DependencyRef.ImageRepository
    constructor(
      name: DependencyRef.ImageRepository,
      remote?: DependencyRef.ImageRemote,
    ) {
      this.name = name
      this.remote = remote
    }
  }

  export class Config {
    @Type(() => Artifacts)
    @Expose()
    artifacts: Artifacts | undefined

    @Type(() => Images)
    @Expose()
    images: Images | undefined
    constructor(artifacts: Artifacts | undefined, images: Images | undefined) {
      this.artifacts = artifacts
      this.images = images
    }
  }

  export const FILE_PATH: string = DomainFiles.systemFilePath("publish.yml")
}



