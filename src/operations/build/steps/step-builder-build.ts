import { BuildConfig } from "../../../domain-model/system-config/build-config";
import { Operations } from "../../operation";
import { StepBuilder } from "./step-builder";



export class StepBuilderBuild implements StepBuilder.Builder {

    constructor(private readonly config: BuildConfig.BuildDockerBuild.Step) { }

    generateBuild(step: number, id: Operations.Id, visitor: StepBuilder.Visitor): void {
        visitor.addSnippet(`docker build . --build-arg ${this.config.build_arg} -f ${this.config.file}  ${this.config.target ? `--target ${this.config.target}` : ""} -t ${this.config.name}:${id.session}`)
    }
    generateTearDown(step: number, id: Operations.Id, visitor: StepBuilder.Visitor): void {
        visitor.addSnippet(`docker rmi --force ${this.config.name}:${id.session}`)
    }
}

