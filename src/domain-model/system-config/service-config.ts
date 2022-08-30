import { Expose, Type } from "class-transformer"

export namespace ServiceConfig {


    export abstract class Service {
        @Expose()
        id: string
        constructor(id: string) {
            this.id = id
        }
    }

    export abstract class SourceService extends Service {
        constructor(id: string) {
            super(id)
        }
        abstract toString(): string
    }

    export class GerritSourceService extends SourceService {

        @Expose()
        ssh: string

        @Expose()
        https: string

        @Expose()
        cynosure: string | undefined
        constructor(id: string, ssh: string, https: string, cynosure: string | undefined) {
            super(id)
            this.ssh = ssh
            this.https = https
            this.cynosure = cynosure
        }
        toString(): string {
            return `GerritSource[${this.id}] ssh=${this.ssh} https=${this.https} cynosure=${this.cynosure || "Na"}`
        }
    }

    export class GitlabSourceService extends SourceService {

        @Expose()
        https: string

        constructor(id: string, https: string) {
            super(id)
            this.https = https
        }
        toString(): string {
            return `GitlabSource[${this.id}] https=${this.https}`
        }

    }

    export abstract class DockerRegistry {
        @Expose()
        host: string
        constructor(host: string) {
            this.host = host
        }
    }

    export class ArtifactoryDockerRegistry extends DockerRegistry {

        @Expose()
        artifactoryHost: string
        @Expose()
        registryRepository: string //internal artifactory repository!
        constructor(host: string, artifactoryHost: string, registryRepository: string) {
            super(host)
            this.artifactoryHost = artifactoryHost
            this.registryRepository = registryRepository
        }
        toString(): string {
            return `ArtifactoryDockerRegistry: ${this.host} => ${this.artifactoryHost}/${this.registryRepository}`
        }
    }

    export class Services {
        @Expose()
        @Type(() => SourceService, {
            discriminator: {
                property: 'type',
                subTypes: [
                    { value: ServiceConfig.GerritSourceService, name: 'gerrit' },
                    { value: ServiceConfig.GitlabSourceService, name: 'gitlab' },
                ],
            }
        })
        sources: SourceService[]

        @Expose()
        @Type(() => DockerRegistry, {
            discriminator: {
                property: 'type',
                subTypes: [
                    { value: ServiceConfig.ArtifactoryDockerRegistry, name: 'artifactory' }
                ],
            }
        }) dockerRegistries: DockerRegistry[]
        constructor(sources: SourceService[], dockerRegistries: DockerRegistry[]) {
            this.sources = sources
            this.dockerRegistries = dockerRegistries
        }

    }
}