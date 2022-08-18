import { Expose, Type } from "class-transformer"
import { RepositorySource } from "../repository-model/repository-source"

export namespace ApiAdmin {

    export class ActiveRepositoriesResponse {
        @Expose()
        @Type(() => RepositorySource)
        public sources: RepositorySource[]

        constructor(sources: RepositorySource[]) {
            this.sources = sources
        }

    }
}