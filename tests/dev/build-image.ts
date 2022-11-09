import yargs from "yargs"
import fs from "fs"
import "jest"
import 'reflect-metadata'
import { BuildConfig } from "../../src/domain-model/system-config/build-config"
import { MockVaultService } from "../helpers/mock-vault-service"
import { BuildOperation } from "../../src/operations/build/build-operation"
import { StepBuilder } from "../../src/operations/build/steps/step-builder"
import { StepCommand } from "../../src/operations/build/steps/step-command"
import { Operations } from "../../src/operations/operation"
import { FileReader } from "../../src/utils/file-reader"
import { Waiter } from "../../src/utils/waiter"
import { SecretsImpl } from "../../src/operations/secrets/secrets-impl"

const args = yargs
    .option("secretsPaths", { type: "string", demandOption: true, describe: "Format: external:internal" })
    .parse()

const steps: BuildConfig.BuildStep[] = []
steps.push(new BuildConfig.BuildCompose.Step(
    new Map([
        ["dev", new BuildConfig.BuildCompose.Node("artcsp-docker.ara-artifactory.volvocars.biz/vcc/common-build-dev:0.7.0", [], [], undefined, undefined)],
    ]),
    [
        new BuildConfig.BuildCompose.NodeCommand("npm install && npm run build", "dev")
    ],
    new Map([
        ["my-local-secret-name", "test/path/1"],
        ["my-local-secret-name2", "test/path/1"]
    ])
))
steps.push(new BuildConfig.BuildDockerBuild.Step(
    StepBuilder.imageName("agent"), "docker/Dockerfile", undefined, undefined
))

const waiter = Waiter.create()

const build = new BuildConfig.Build(steps)
const config = new BuildConfig.Config("dummy", 1, build)
const sessionId = new Date().getTime().toString()
const id = new Operations.Id(sessionId)
const fileReader = new FileReader()
const [externalPath, internalPath] = args.secretsPaths.split(":")
if (!externalPath || !internalPath) {
    throw new Error(`secretsPaths is malformed: ${args.secretsPaths}`)
}

if (fs.existsSync(internalPath)) {
    fs.rmSync(internalPath, { force: true, recursive: true })
}
const secretsService = new SecretsImpl(externalPath)
const operation = new BuildOperation(config, [StepCommand.Phase.BUILD, StepCommand.Phase.POST], fileReader, secretsService, undefined)

const vaultService = new MockVaultService({ "csp/common-build/service": "USER:SECRET", "test/path/1": "test-value-1" })


const commands: string[] = []
const receiver = (bash: string) => {
    commands.push(bash)
}

operation.execute(id, receiver)
    .then(() => {
        console.log(commands.join("\n"))
    }).then(() => {
        return secretsService.writeSecrets(vaultService, internalPath)
    })
    .finally(() => {
        waiter.okToQuit()
    })






