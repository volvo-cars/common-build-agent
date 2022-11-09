import { Exclude, Expose, Type } from "class-transformer"
import { DomainFiles } from "./domain-files";


export namespace BuildConfig {

    @Exclude()
    export abstract class BuildStep { }

    export namespace BuildNative {
        export class Step extends BuildStep {

            @Expose()
            public cmd: string

            constructor(cmd: string) {
                super()
                this.cmd = cmd
            }
        }
    }


    export namespace BuildCompose {

        export class Node {

            @Expose()
            public image: string

            @Expose()
            public dependsOn: string[] | undefined

            @Expose()
            public internalPorts: number[] | undefined

            @Expose()
            public entryPoint: string | undefined

            @Expose()
            public labels: string | undefined

            constructor(image: string, dependsOn: string[] | undefined, internalPorts: number[] | undefined, entryPoint: string | undefined, labels: string | undefined) {
                this.image = image
                this.dependsOn = dependsOn
                this.internalPorts = internalPorts
                this.entryPoint = entryPoint
                this.labels = labels
            }
        }

        export class NodeCommand {

            @Expose()
            public cmd: string

            @Expose()
            public node?: string
            // Only required when 1+ nodes exist

            constructor(cmd: string, node: string | undefined) {
                this.node = node
                this.cmd = cmd
            }
        }


        export class Step extends BuildStep {

            @Expose()
            @Type(() => Node)
            public nodes: Map<string, Node>

            @Expose()
            @Type(() => NodeCommand)
            public commands: NodeCommand[]

            @Expose()
            @Type(() => String)
            public secrets: Map<string, string> = new Map<string, string>() // Bug in transform. Can't define Map<,string,string>|undefined

            constructor(nodes: Map<string, Node>, commands: NodeCommand[], secrets?: Map<string, string>) {
                super()
                this.nodes = nodes
                this.commands = commands
                if (secrets) {
                    this.secrets = secrets
                }
            }
        };
    }

    export namespace BuildDockerBuild {

        export class Step extends BuildStep {

            @Expose()
            public name: string

            @Expose()
            public file: string

            @Expose()
            public target: string | undefined

            @Expose()
            public labels: string | undefined

            @Expose()
            @Type(() => String)
            public secrets: Map<string, string> = new Map<string, string>() // Bug in transform. Can't define Map<,string,string>|undefined

            constructor(name: string, file: string, target: string | undefined, labels: string | undefined, secrets?: Map<string, string>) {
                super()
                this.name = name
                this.file = file
                this.target = target
                this.labels = labels
                if (secrets) {
                    this.secrets = secrets
                }
            }
        };
    }

    export namespace BuildJenkins {

        export class Step extends BuildStep {

            @Expose()
            public jobName: string

            @Expose()
            public jobToken: string

            @Expose()
            public jenkinsId: string

            constructor(jobName: string, jobToken: string, jenkinsId: string) {
                super()
                this.jobName = jobName
                this.jobToken = jobToken
                this.jenkinsId = jenkinsId
            }
        };
    }

    export class Build {
        @Type(() => BuildStep, {
            discriminator: {
                property: 'type',
                subTypes: [
                    { value: BuildCompose.Step, name: 'compose' },
                    { value: BuildDockerBuild.Step, name: 'build' },
                    { value: BuildNative.Step, name: 'native' },
                    { value: BuildJenkins.Step, name: 'jenkins' }
                ]
            },
            keepDiscriminatorProperty: false
        })
        @Expose()
        public steps: BuildStep[]

        constructor(steps: BuildStep[]) {
            this.steps = steps
        }

    }

    export class Config {

        @Expose()
        public toolImage: string

        @Expose()
        public version: number

        @Expose()
        @Type(() => Build)
        public build: Build


        constructor(toolImage: string, version: number, build: Build) {
            this.build = build
            this.toolImage = toolImage
            this.version = version
        }
    }

    export const FILE_PATH: string = DomainFiles.systemFilePath("build.yml")

}

