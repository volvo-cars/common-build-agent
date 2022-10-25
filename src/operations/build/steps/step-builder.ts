import { Operations } from "../../operation";
import { Secrets } from "../../secrets/secrets";

export namespace StepBuilder {
    const TOOL_IMAGE_BASE_ID = "vcc/common-build"
    export const TOOL_IMAGE_EXECUTABLE = "common-build-tool"

    export const imageName = (suffix: string) => { return `${TOOL_IMAGE_BASE_ID}-${suffix}` }

    export interface Builder {
        generateBuild(context: Context, id: Operations.Id, visitor: Visitor): void
        generateTearDown(context: TeardownContext, id: Operations.Id, visitor: Visitor): void
    }

    export interface Visitor {
        addSnippet(bash: string): void
        addToolSnippet(bash: string): void
    }

    export interface Context {
        readonly stepIndex: number
        readonly secrets: Secrets.Service
    }

    export interface TeardownContext {
        readonly stepIndex: number
    }
}



