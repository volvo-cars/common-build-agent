import { Expose, Type } from "class-transformer"
import { RepositoryModel } from "../repository-model/repository-model"
import { RepositorySource } from "../repository-model/repository-source"
import { Majors } from "../system-config/majors"
import { RepositoryConfig } from "../system-config/repository-config"

export namespace ApiRepository {

    export class MessageResponse {
        @Expose()
        message: string

        constructor(message: string) {
            this.message = message
        }
    }

    export class SourceRequest {
        @Expose()
        @Type(() => RepositorySource)
        public source: RepositorySource

        constructor(source: RepositorySource) {
            this.source = source
        }

    }

    export class ReleaseRequest {
        @Expose()
        @Type(() => RepositorySource)
        public source: RepositorySource
        @Expose()
        public major: number

        @Expose()
        public sha?: string

        constructor(source: RepositorySource, major: number, sha?: string) {
            this.source = source
            this.major = major
            this.sha = sha
        }

    }

    export class ReleaseResponse extends MessageResponse {
        @Expose()
        @Type(() => RepositoryModel.Root)
        public model: RepositoryModel.Root

        constructor(model: RepositoryModel.Root, message: string) {
            super(message)
            this.model = model
        }
    }

    export class CreatePatchBranchRequest {
        @Expose()
        @Type(() => RepositorySource)
        public source: RepositorySource
        @Expose()
        public major: number

        @Expose()
        public sha?: string

        constructor(source: RepositorySource, major: number, sha?: string) {
            this.source = source
            this.major = major
            this.sha = sha
        }

    }

    export class CreatePatchBranchResponse extends MessageResponse {
        @Expose()
        @Type(() => RepositoryModel.Root)
        public model: RepositoryModel.Root

        constructor(model: RepositoryModel.Root, message: string) {
            super(message)
            this.model = model
        }
    }



    export class ModelResponse {
        @Expose()
        @Type(() => RepositoryModel.Root)
        public model: RepositoryModel.Root

        constructor(model: RepositoryModel.Root) {
            this.model = model
        }
    }

    export class ConfigResponse {
        @Expose()
        @Type(() => RepositoryConfig.Config)
        public config: RepositoryConfig.Config

        constructor(config: RepositoryConfig.Config) {
            this.config = config
        }
    }

    export class SaveConfigRequest {

        @Expose()
        public source: RepositorySource

        @Expose()
        @Type(() => RepositoryConfig.Config)
        public config: RepositoryConfig.Config


        constructor(source: RepositorySource, config: RepositoryConfig.Config) {
            this.source = source
            this.config = config
        }
    }

    export class MajorSeriesResponse {
        @Expose()
        @Type(() => Majors.Serie)
        public series: Majors.Serie[]
        constructor(series: Majors.Serie[]) {
            this.series = series
        }
    }

    export class MajorSerieAddValueRequest {
        @Expose()
        @Type(() => Majors.Value)
        public value: Majors.Value
        constructor(value: Majors.Value) {
            this.value = value
        }
    }

    export class MajorSerieAddValueResponse extends MessageResponse {
        @Expose()
        @Type(() => Majors.Serie)
        public serie: Majors.Serie
        constructor(serie: Majors.Serie, message: string) {
            super(message)
            this.serie = serie
        }
    }

}