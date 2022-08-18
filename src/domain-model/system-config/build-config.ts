import { Exclude, Expose, Type } from "class-transformer"
import { DomainFiles } from "./domain-files";


/**
 * Interpolation {env|secret:x} will interpolate
 */

export namespace BuildConfig {

    @Exclude()
    export abstract class BuildStep {
        @Expose()
        protected readonly type: string = "";
    }

    export namespace BuildNative {
        export class Step extends BuildStep {

            @Expose()
            public cmd: string

            constructor(cmd: string) {
                super()
                this.cmd = cmd
            }
        };
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
            constructor(cmd: string, node?: string) { // Only required when 1+ nodes exist
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

            constructor(nodes: Map<string, Node>, commands: NodeCommand[]) {
                super()
                this.nodes = nodes
                this.commands = commands
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

            constructor(name: string, file: string, target: string | undefined, labels: string | undefined) {
                super()
                this.name = name
                this.file = file
                this.target = target
                this.labels = labels
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

    export class Optimizer {

        @Expose()
        public label: string

        @Expose()
        public values: Map<string, string | null>
        constructor(label: string, values: Map<string, string | null>) {
            this.label = label
            this.values = values
        }
    };

    export class Build {
        @Type(() => BuildStep, {
            discriminator: {
                property: 'type',
                subTypes: [
                    { value: BuildCompose.Step, name: 'compose' },
                    { value: BuildDockerBuild.Step, name: 'build' },
                    { value: BuildNative.Step, name: 'native' },
                    { value: BuildJenkins.Step, name: 'jenkins' }
                ],
            }
        })

        @Expose()
        @Type(() => BuildStep)
        public steps: BuildStep[]

        @Expose()
        @Type(() => Optimizer)
        public optimizers: Optimizer[] | undefined
        constructor(steps: BuildStep[], optimizers: Optimizer[] | undefined) {
            this.steps = steps
            this.optimizers = optimizers
        }
    }

    export class Config {
        @Expose()
        @Type(() => Build)
        public build: Build

        @Expose()
        public version?: string

        constructor(build: Build, version?: string) {
            this.build = build
            this.version = version
        }
    }

    export const FILE_PATH: string = DomainFiles.systemFilePath("build.yml")

}

