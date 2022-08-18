import { BuildConfig } from "../../domain-model/system-config/build-config";
import { Operations } from "../operation";
import { StepBuilder } from "./steps/step-builder";
import { StepCommand } from "./steps/step-command";

export class StepBuilderVisitor implements StepBuilder.Visitor {

    private snippets: string[] = []

    constructor(private readonly id: Operations.Id, private readonly toolImage: string) { }

    addToolSnippet(bash: string): void {
        this.addSnippet(`docker run -v $PWD:/work -w /work -e VAULT_TOKEN=$VAULT_TOKEN ${this.toolImage} sh -c "common-build-tool ${bash} --session ${this.id.session}"`)
    }

    addSnippet(bash: string): void {
        this.snippets.push(bash)
    }

    getScript(): string {
        return this.snippets.join("\n")
    }

}

