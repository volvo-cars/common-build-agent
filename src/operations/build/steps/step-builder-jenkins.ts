import { BuildConfig } from "../../../domain-model/system-config/build-config";
import { Operations } from "../../operation";
import { StepBuildId } from "./step-build-id";
import { StepBuilder } from "./step-builder";
import { StepCommand } from "./step-command";



export class StepBuilderJenkins implements StepBuilder.Builder {


    constructor(private readonly config: BuildConfig.BuildJenkins.Step) { }

    generateBuild(step: number, id: Operations.Id, visitor: StepBuilder.Visitor): void {
        const cmd = `invokeJenkins --job ${this.config.jobName} --token ${this.config.jobToken} --server ${this.config.jenkinsId}`
        visitor.addToolSnippet(cmd)

    }
    generateTearDown(step: number, id: Operations.Id, visitor: StepBuilder.Visitor): void { }


}

