import { Operations } from "../../operation";

export namespace StepBuilder {
    const TOOL_IMAGE_BASE_ID = "vcc/common-build"
    export const TOOL_IMAGE_EXECUTABLE = "common-build-tool"

    export const imageName = (suffix: string) => { return `${TOOL_IMAGE_BASE_ID}-${suffix}` }

    export interface Builder {

        generateBuild(step: number, id: Operations.Id, visitor: Visitor): void
        generateTearDown(step: number, id: Operations.Id, visitor: Visitor): void
    }

    export interface Visitor {
        addSnippet(bash: string): void
        addToolSnippet(bash: string): void
    }
}



