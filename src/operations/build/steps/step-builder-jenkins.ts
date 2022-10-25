import { BuildConfig } from "../../../domain-model/system-config/build-config";
import { Operations } from "../../operation";
import { StepBuilder } from "./step-builder";



export class StepBuilderJenkins implements StepBuilder.Builder {


    constructor(private readonly config: BuildConfig.BuildJenkins.Step) { }

    generateBuild(context: StepBuilder.Context, id: Operations.Id, visitor: StepBuilder.Visitor): void {
        const cmd = `# Not implemented: invokeJenkins --job ${this.config.jobName} --token ${this.config.jobToken} --server ${this.config.jenkinsId}`
        visitor.addToolSnippet(cmd)

    }
    generateTearDown(context: StepBuilder.TeardownContext, id: Operations.Id, visitor: StepBuilder.Visitor): void { }


}

