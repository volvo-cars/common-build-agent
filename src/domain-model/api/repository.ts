import { Expose, Type } from "class-transformer"
import { BuildLogEvents } from "../buildlog-events/buildlog-events"
import { Refs } from "../refs"
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
        public sha: string

        constructor(source: RepositorySource, major: number, sha: string) {
            this.source = source
            this.major = major
            this.sha = sha
        }

    }

    export class UnreleasedCommitsRequest {
        @Expose()
        @Type(() => RepositorySource)
        public source: RepositorySource
        @Expose()
        public major: number

        constructor(source: RepositorySource, major: number) {
            this.source = source
            this.major = major
        }
    }

    export class Commit {
        @Expose()
        sha: string

        @Expose()
        committer: string

        @Expose()
        timestamp: number

        @Expose()
        message: string

        constructor(sha: string, committer: string, timestamp: number, message: string) {
            this.sha = sha
            this.committer = committer
            this.timestamp = timestamp
            this.message = message
        }
    }

    export class UnreleasedCommitsResponse {
        @Expose()
        @Type(() => Commit)
        public commits: Commit[]

        constructor(commits: Commit[]) {
            this.commits = commits
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

        constructor(source: RepositorySource, major: number) {
            this.source = source
            this.major = major
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

    export class ConfigValuesResponse {
        @Expose()
        @Type(() => Majors.Serie)
        public series: Majors.Serie[]

        @Expose()
        public availableSystems: string[]

        constructor(series: Majors.Serie[], availableSystems: string[]) {
            this.series = series
            this.availableSystems = availableSystems
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

    export class BuildConfigRequest {
        @Expose()
        @Type(() => RepositorySource)
        public source: RepositorySource

        constructor(source: RepositorySource) {
            this.source = source
        }

    }

    export class BuildSystemInfo {
        @Expose()
        public buildSystemUrl: string

        @Expose()
        public buildSystemName: string

        constructor(buildSystemUrl: string, buildSystemName: string) {
            this.buildSystemUrl = buildSystemUrl
            this.buildSystemName = buildSystemName
        }
    }

    export class BuildConfigResponse {
        @Expose()
        @Type(() => BuildSystemInfo)
        public buildSystemInfo: BuildSystemInfo

        constructor(buildSystemInfo: BuildSystemInfo) {
            this.buildSystemInfo = buildSystemInfo
        }
    }

    export class BuildLogRequest {
        @Expose()
        @Type(() => RepositorySource)
        public source: RepositorySource

        @Expose()
        public sha: string
        constructor(source: RepositorySource, sha: string) {
            this.source = source
            this.sha = sha
        }
    }

    export class BuildLogResponse {
        @Expose()
        @Type(() => BuildLogEvents.BuildLog)
        public log: BuildLogEvents.BuildLog

        constructor(log: BuildLogEvents.BuildLog) {
            this.log = log
        }
    }
}