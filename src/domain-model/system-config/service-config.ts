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
    }


    export class GerritCynosure {
        @Expose()
        host: string
        constructor(host: string) {
            this.host = host
        }
    }

    export class GerritSSH {
        @Expose()
        user: string
        @Expose()
        key: string
        @Expose()
        host: string
        @Expose()
        port: number | undefined
        constructor(user: string, key: string, host: string, port: number | undefined) {
            this.user = user
            this.key = key
            this.host = host
            this.port = port
        }
    }

    export class GerritHttp {
        @Expose()
        user: string
        @Expose()
        password: string
        @Expose()
        host: string
        @Expose()
        protocol: string | undefined
        @Expose()
        port: number | undefined
        constructor(user: string, password: string, host: string, protocol: string | undefined, port: number | undefined) {
            this.user = user
            this.password = password
            this.host = host
            this.protocol = protocol
            this.port = port
        }
    }

    export class GerritSourceService extends SourceService {

        @Expose()
        @Type(() => GerritSSH)
        stream: GerritSSH

        @Expose()
        @Type(() => GerritHttp)
        api: GerritHttp

        @Expose()
        @Type(() => GerritCynosure)
        cynosure: GerritCynosure | undefined
        constructor(id: string, stream: GerritSSH, api: GerritHttp, cynosure: GerritCynosure | undefined) {
            super(id)
            this.stream = stream
            this.api = api
            this.cynosure = cynosure
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