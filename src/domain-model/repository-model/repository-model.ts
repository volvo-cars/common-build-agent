import { Expose, Type } from "class-transformer"

export namespace RepositoryModel {

    export interface TopContainer {
        major: number,
        minors: MinorContainer[]
        start?: string //Defined by MajorTag
    }
    export class MainBranch {
        @Expose()
        public name: string
        @Expose()
        public sha: string
        constructor(name: string, sha: string) {
            this.name = name
            this.sha = sha
        }
    }
    export class MainContainer implements TopContainer {

        @Expose()
        public major: number
        @Expose()
        @Type(() => MainBranch)
        public main: MainBranch
        @Expose()
        @Type(() => MinorContainer)
        public minors: MinorContainer[]
        @Expose()
        public start: string | undefined //Defined by MajorTag

        constructor(major: number, main: MainBranch, minors: MinorContainer[], start: string | undefined) {
            this.major = major
            this.main = main
            this.minors = minors
            this.start = start
        }

    }

    export class MajorContainer implements TopContainer {

        @Expose()
        public major: number
        @Expose()
        @Type(() => MinorContainer)
        public minors: MinorContainer[]
        @Expose()
        public start: string | undefined //Defined by MajorTag
        @Expose()
        public branch: string | undefined

        constructor(major: number, minors: MinorContainer[], start: string | undefined, branch: string | undefined) {
            this.major = major
            this.minors = minors
            this.start = start
            this.branch = branch
        }
    }

    export class MinorContainer {

        @Expose()
        public minor: number
        @Expose()
        @Type(() => Release)
        public releases: Release[]
        @Expose()
        public branch: string | undefined

        constructor(minor: number, releases: Release[], branch: string | undefined) {
            this.minor = minor
            this.releases = releases
            this.branch = branch
        }
    }

    export class Release {

        @Expose()
        public patch: number
        @Expose()
        public sha: string
        constructor(patch: number, sha: string) {
            this.patch = patch
            this.sha = sha
        }
    }

    export class Root {
        @Expose()
        @Type(() => MainContainer)
        public main: MainContainer
        @Expose()
        @Type(() => MajorContainer)
        public majors: MajorContainer[]
        constructor(main: MainContainer, majors: MajorContainer[]) {
            this.main = main
            this.majors = majors
        }
    }

}