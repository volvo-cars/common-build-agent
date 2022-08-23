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

    export abstract class StorageService extends Service {
        constructor(id: string) {
            super(id)
        }
    }

    export class ArtifactoryStorage extends StorageService {
        @Expose()
        host: string
        @Expose()
        token: string
        constructor(id: string, host: string, token: string) {
            super(id)
            this.host = host
            this.token = token
        }
    }

    export class DockerRegistryStorage extends StorageService {
        @Expose()
        host: string
        @Expose()
        token: string
        @Expose()
        registryRepository: string //internal artifactory repository!
        constructor(id: string, host: string, token: string, registryRepository: string) {
            super(id)
            this.host = host
            this.token = token
            this.registryRepository = registryRepository
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
        @Type(() => SourceService, {
            discriminator: {
                property: 'type',
                subTypes: [
                    { value: ServiceConfig.DockerRegistryStorage, name: 'docker' },
                    { value: ServiceConfig.ArtifactoryStorage, name: 'artifactory' }
                ],
            }
        })
        storages: StorageService[]
        constructor(sources: SourceService[], storages: StorageService[]) {
            this.sources = sources
            this.storages = storages
        }

    }
}