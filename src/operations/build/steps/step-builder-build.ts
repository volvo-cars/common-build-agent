import { BuildConfig } from "../../../domain-model/system-config/build-config";
import { Operations } from "../../operation";
import { StepBuilder } from "./step-builder";
import fs from 'fs'


export class StepBuilderBuild implements StepBuilder.Builder {

    constructor(private readonly config: BuildConfig.BuildDockerBuild.Step) { }

    generateBuild(context: StepBuilder.Context, id: Operations.Id, visitor: StepBuilder.Visitor): void {
        const secretsDeclaration = Array.from((this.config.secrets || new Map<string, string>()).entries()).reduce((lines: string[], [name, vaultPath]) => {
            const mountedSecret = context.secrets.mountSecret(vaultPath)
            lines.push(`--secret id=${name},src=${mountedSecret.path}`)
            return lines
        }, []).join(" ")

        //Idea: To auto-add RUN --mount=type=secret... 
        visitor.addSnippet(`docker build ${secretsDeclaration} . -f ${this.config.file} ${this.config.target ? `--target ${this.config.target}` : ""} -t ${this.config.name}:${id.session}`)
    }
    generateTearDown(context: StepBuilder.TeardownContext, id: Operations.Id, visitor: StepBuilder.Visitor): void {
        visitor.addSnippet(`docker rmi --force ${this.config.name}:${id.session}`)
    }
}



