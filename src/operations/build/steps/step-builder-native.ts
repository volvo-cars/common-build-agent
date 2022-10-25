import { BuildConfig } from "../../../domain-model/system-config/build-config";
import { Operations } from "../../operation";
import { StepBuilder } from "./step-builder";

export class StepBuilderNative implements StepBuilder.Builder {

    constructor(private readonly config: BuildConfig.BuildNative.Step) { }
    generateBuild(context: StepBuilder.Context, id: Operations.Id, visitor: StepBuilder.Visitor): void {
        visitor.addSnippet(this.config.cmd)
    }
    generateTearDown(context: StepBuilder.TeardownContext, id: Operations.Id, visitor: StepBuilder.Visitor): void { }
}

