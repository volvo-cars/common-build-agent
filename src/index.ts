import 'reflect-metadata'
import YAML from "yaml"
import yargs from "yargs"
import { BuildConfig } from './domain-model/system-config/build-config'
import { Codec } from './domain-model/system-config/codec'
import { PublicationConfig } from './domain-model/system-config/publication-config'
import { BuildOperation } from './operations/build/build-operation'
import { SecretsImpl } from './operations/secrets/secrets-impl'
import { StepCommand } from './operations/build/steps/step-command'
import { CommonBuildDependenciesOperations } from './operations/dependencies/common-build-dependencies-operation'
import { GoogleRepoOperation } from './operations/dependencies/google-repo-operation'
import { MultiOperation, Operations } from './operations/operation'
import { PublishArtifactsOperation } from './operations/publish/publish-artifacts-operation'
import { FileReader } from './utils/file-reader'
import { Waiter } from "./utils/waiter"
import { VaultOptions, VaultService, VaultServiceImpl } from './vault/vault-service'

const scriptTimeOut = 1 * 24 * 60 * 60 * 1000

const createUid = () => {
  return `${new Date().getTime()}_${Math.floor(Math.random() * 100000)}`
}

const execute = (opCreate: Promise<Operations.Operation | string>, id: Operations.Id): Promise<void> => {
  const waiter = Waiter.create(scriptTimeOut)
  return opCreate.then(async op => {
    if (op instanceof Operations.Operation) {
      const receiver = (s: string) => {
        console.log(s)
      }
      return op.execute(id, receiver)
        .catch(e => {
          console.log(`Error in command execution: ${e}`)
          return Promise.reject(e)
        })
    } else {
      console.log(op)
      return Promise.resolve()
    }
  }).finally(() => {
    waiter.okToQuit()
  })
}

const createVaultService = (): VaultService => {
  const vaultToken = process.env.VAULT_TOKEN
  if (!vaultToken) {
    throw new Error("Env VAULT_TOKEN is missing")
  }
  return new VaultServiceImpl(new VaultOptions(
    "v1",
    "https://winterfell.csp-dev.net",
    vaultToken,
  ))
}

yargs
  .command(
    "dependencies",
    "Downloads dependencies",
    (yargs) => {
      return yargs
        .option("session", { type: "string", demandOption: true })
    },
    (args) => {
      const id = new Operations.Id(args.session)
      const fileReader = new FileReader()
      const vaultService = createVaultService()
      execute(Promise.resolve(new MultiOperation([new GoogleRepoOperation(fileReader, vaultService), new CommonBuildDependenciesOperations(fileReader, vaultService)])), id)
    }
  )
  .command(
    "publishArtifacts",
    "Publishes artifacts defined in .common-build/publish.yml",
    (yargs) => {
      return yargs
        .option("dryRun", {
          default: false,
        })
        .option("session", { type: "string", demandOption: true })
    },
    (args) => {
      const fileReader = new FileReader()
      const id = new Operations.Id(args.session)
      const vaultService = createVaultService()
      execute(fileReader.getFile(PublicationConfig.FILE_PATH).then(content => {
        if (content) {
          const publicationContent = content.toString()
          const publicationConfig = Codec.toInstance(YAML.parse(publicationContent), PublicationConfig.Config)
          if (publicationConfig.artifacts) {
            return new PublishArtifactsOperation(publicationConfig.artifacts, vaultService)
          } else {
            return `Missing artifacts section in ${PublicationConfig.FILE_PATH}.`
          }
        } else {
          return `No publications. No ${PublicationConfig.FILE_PATH} file found. `
        }
      }), id)
    }
  )
  .command(
    "generate",
    "Outputs build execution script.",
    (yargs) => {
      return yargs
        .option("phase", { type: "array", choices: ["pre", "build", "post"] })
        .option("toolImage", { type: "string", demandOption: true, description: "The complete docker-image:version of the running tool (for self-reference)" })
        .option("secretsPaths", { type: "string", demandOption: true, description: "Format: external:internal. The path where secrets should be stored on the file system." })
    }, (args) => {
      const fileReader = new FileReader()
      const id = new Operations.Id(createUid())
      const [externalPath, internalPath] = args.secretsPaths.split(":")
      const secrets = new SecretsImpl(externalPath)
      const vaultService = createVaultService()
      execute(fileReader.getFile(BuildConfig.FILE_PATH).then(content => {
        if (content) {
          const buildContent = content.toString()
          const buildConfig = Codec.toInstance(YAML.parse(buildContent), BuildConfig.Config)
          if (externalPath && internalPath) {
            return new BuildOperation(buildConfig, <StepCommand.Phase[]>args.phase || [], fileReader, secrets, args.toolImage)
          } else {
            return Promise.reject(new Error(`Bad format for secretsPaths: ${args.secretsPaths}`))
          }
        } else {
          return `No Common-Build. No ${BuildConfig.FILE_PATH} file found. `
        }
      }), id).then(() => {
        return secrets.writeSecrets(vaultService, internalPath)
      })
    })
  .demandCommand()
  .help()
  .parse()
