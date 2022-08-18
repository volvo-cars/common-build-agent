import "jest"
import 'reflect-metadata'
import Yaml from 'yaml'
import { BuildConfig } from "../../../../src/domain-model/system-config/build-config"
import { Codec } from "../../../../src/domain-model/system-config/codec"
import { VaultService } from "../../../../src/vault/vault-service"
import fs from "fs"
import { BuildOperation } from "../../../../src/operations/build/build-operation"
import { Operations } from "../../../../src/operations/operation"
import { StepBuilder } from "../../../../src/operations/build/steps/step-builder"
import { StepCommand } from "../../../../src/operations/build/steps/step-command"
import { FileReader } from "../../../../src/utils/file-reader"
import { SecretsWriterImpl } from "../../../../src/operations/build/secrets-writer"
import { MockVaultService } from "../../../helpers/mock-vault-service"
import { ServiceConfig } from "../../../../src/domain-model/system-config/service-config"
describe("Phase script builder", () => {
    it("Single node", async () => {
        const steps: BuildConfig.BuildStep[] = []
        steps.push(new BuildConfig.BuildDockerBuild.Step(
            StepBuilder.imageName("dev"), "docker/Dockerfile", "dev", undefined
        ))
        steps.push(new BuildConfig.BuildCompose.Step(
            new Map([
                ["dev", new BuildConfig.BuildCompose.Node(StepBuilder.imageName("dev"), ["redis"], [], undefined, undefined)],
                ["redis", new BuildConfig.BuildCompose.Node("redis:6.2-alpine", [], [6379], undefined, undefined)]
            ]),
            [
                new BuildConfig.BuildCompose.NodeCommand("npm install && npm run build", "dev")
            ]
        ))
        steps.push(new BuildConfig.BuildDockerBuild.Step(
            StepBuilder.imageName("agent"), "docker/Dockerfile", "agent", undefined
        ))
        /* steps.push(new BuildConfig.BuildCompose.Step(
             new Map([
                 ["dev", new BuildConfig.BuildCompose.Node("ubuntu:20.04", [], [], undefined)]
             ]),
             [
                 new BuildConfig.BuildCompose.NodeCommand("echo hello2 > test.txt && ls -la")
             ]
         ))
         */

        const build = new BuildConfig.Build(steps, undefined)
        const config = new BuildConfig.Config(build, "latest")
        console.dir(config, { depth: null })
        console.log("TO PLAIN")
        console.dir(Codec.toPlain(config), { depth: null })
        const configYml = Yaml.stringify(Codec.toPlain(config))
        console.log("CONFIG", configYml)

        const sessionId = new Date().getTime().toString()
        const id = new Operations.Id(sessionId)
        const fileReader = new FileReader()
        const secretsWriter = new SecretsWriterImpl()
        const registries = [new ServiceConfig.DockerRegistryStorage("artcsp-docker", "artcsp-docker.ara-artifactory.volvocars.biz", "csp/common-build/artcsp-docker-auth", "")]
        const operation = new BuildOperation(config, [StepCommand.Phase.BUILD, StepCommand.Phase.POST], secretsWriter, fileReader, registries, undefined)

        const commands: string[] = []
        const receiver = (bash: string) => {
            commands.push(bash)
        }
        const vaultService = new MockVaultService({ "csp/common-build/artcsp-docker-auth": Buffer.from("nlindbe2:DUmmy", "ascii").toString("base64") })
        await operation.execute(id, receiver, vaultService)
        const script = commands.join("\n")
        await secretsWriter.writeSecrets()
        console.log(script)

        fs.writeFileSync("test.sh", script || "", { mode: 777 })
    })
})



class VaultServiceMock implements VaultService {
    constructor(private secrets: Record<string, string>) { }
    clear(): void {
        throw new Error("Method not implemented.")
    }
    getSecret(path: string): Promise<string> {
        const secret = this.secrets[path]
        if (!secret) {
            throw new Error(`Secret ${path} not found.`)
        }
        return Promise.resolve(secret)
    }
    mask<T>(input: T): T {
        throw new Error("Method not implemented.")
    }
}
