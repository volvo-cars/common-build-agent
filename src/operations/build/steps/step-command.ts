import { StepBuildId } from "./step-build-id"
import { StepBuilder } from "./step-builder"

export namespace StepCommand {

    export enum Phase {
        PRE = "pre",
        POST = "post",
        BUILD = "build"
    }

    export interface Command {
    }

    export class ToolCommand implements Command {
        constructor(public readonly cmd: string) { }
    }

    export class NativeStepCommand implements Command {
        constructor(public readonly cmd: string) { }
    }

    export class NodeStepCommand implements Command {
        constructor(public readonly cmd: string, public readonly nodeId: string) { }
    }
}