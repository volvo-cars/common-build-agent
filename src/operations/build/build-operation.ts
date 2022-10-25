import _ from "lodash";
import YAML from 'yaml';
import { BuildConfig } from "../../domain-model/system-config/build-config";
import { Codec } from "../../domain-model/system-config/codec";
import { PublicationConfig } from "../../domain-model/system-config/publication-config";
import { FileReader } from "../../utils/file-reader";
import { GitUtils } from "../../utils/git-utils";
import { Operations } from "../operation";
import { Secrets } from "../secrets/secrets";
import { StepBuilderVisitor } from "./step-builder-visitor";
import { StepBuilder } from "./steps/step-builder";
import { StepBuilderBuild } from "./steps/step-builder-build";
import { StepBuilderCompose } from "./steps/step-builder-compose";
import { StepBuilderJenkins } from "./steps/step-builder-jenkins";
import { StepBuilderNative } from "./steps/step-builder-native";
import { StepCommand } from "./steps/step-command";
export class BuildOperation extends Operations.Operation {
    constructor(private config: BuildConfig.Config, private phases: StepCommand.Phase[], private fileReader: FileReader, private secrets: Secrets.Service, private toolImage: string | undefined) {
        super()
    }

    async execute(id: Operations.Id, receiver: Operations.OutputReceiver): Promise<void> {
        const isJenkinsOnlyBuild = _.every(this.config.build.steps, (s => { return s instanceof BuildConfig.BuildJenkins.Step }))
        const phases: StepCommand.Phase[] = this.phases.length ? this.phases : isJenkinsOnlyBuild ? [StepCommand.Phase.BUILD] : [StepCommand.Phase.PRE, StepCommand.Phase.BUILD, StepCommand.Phase.POST]
        const stepBuilders: StepBuilder.Builder[] = this.config.build.steps.map(step => {
            if (step instanceof BuildConfig.BuildCompose.Step) {
                return new StepBuilderCompose(step)
            } else if (step instanceof BuildConfig.BuildNative.Step) {
                return new StepBuilderNative(step)
            } else if (step instanceof BuildConfig.BuildDockerBuild.Step) {
                return new StepBuilderBuild(step)
            } else if (step instanceof BuildConfig.BuildJenkins.Step) {
                return new StepBuilderJenkins(step)
            } else {
                throw new Error(`Unknown step type: ${typeof (step)}`)
            }
        })
        const toolImage = this.toolImage || `${StepBuilder.imageName("agent")}:${id.session}` //Special case when building tool-image itself.
        const visitor = new StepBuilderVisitor(id, toolImage)
        if (!this.toolImage) {
            visitor.addSnippet(`echo "Warning: parameter --toolImage is undefined which will not work if the tool-image ${StepBuilder.imageName("agent")} is not built in this build."`)
        }
        visitor.addSnippet("set -e")
        visitor.addSnippet("export DOCKER_BUILDKIT=1")
        if (_.includes(phases, StepCommand.Phase.PRE)) {
            await this.addPreCommands(id, visitor)
            //visitor.addToolSnippet(`dependencies`)
        }
        if (_.includes(phases, StepCommand.Phase.BUILD)) {
            visitor.addSnippet("# Build-commands")
            stepBuilders.forEach((builder, step) => {
                const context = new BuildStepContextImpl(step, this.secrets)
                builder.generateBuild(context, id, visitor)
            })
        }
        if (_.includes(phases, StepCommand.Phase.POST)) {
            await this.addPostCommands(id, visitor)
        }
        visitor.addSnippet("# Clean-up operations")
        _.reverse(_.clone(stepBuilders)).forEach((builder, step) => {
            const context = new BuildStepTeardownContextImpl(step)
            builder.generateTearDown(context, id, visitor)
        })
        visitor.addSnippet("set +e")
        receiver(visitor.getScript())
    }

    private async addPreCommands(id: Operations.Id, visitor: StepBuilder.Visitor): Promise<void> {
        visitor.addSnippet("# Pre-commands")
        visitor.addToolSnippet("dependencies")
        return Promise.resolve()
    }

    private async addPostCommands(id: Operations.Id, visitor: StepBuilder.Visitor): Promise<void> {
        visitor.addSnippet("# Post-commands")
        return Promise.all([GitUtils.getSha(), this.fileReader.getFile(PublicationConfig.FILE_PATH)]).then(([gitSha, publishConfig]) => {
            if (publishConfig) {
                const parsedConfig = Codec.toInstance(YAML.parse(publishConfig.toString()), PublicationConfig.Config)

                if (parsedConfig.artifacts) {
                    visitor.addSnippet(`# Publishing artifacts (${parsedConfig.artifacts.items?.length || 0}).`)
                    visitor.addToolSnippet("publishArtifacts")
                }

                const processImages = (): Promise<void> => {
                    if (parsedConfig.images) {
                        const images = parsedConfig.images
                        const publicationsByRemote = _.groupBy(parsedConfig.images.items, (item: PublicationConfig.Image) => {
                            return item.remote || images.remote
                        })
                        visitor.addSnippet(`# Publishing images (${parsedConfig.images.items?.length || 0}) (remotes = ${Object.keys(publicationsByRemote).join(",")}).`)
                        return Promise.all(Object.keys(publicationsByRemote).map(async remote => {
                            const items = publicationsByRemote[remote]
                            const [remoteUser, remoteSecret] = this.secrets.mountAuth(`csp/common-build/https-${remote}`)

                            visitor.addSnippet(`cat ${remoteSecret.path} | docker login -u $(cat ${remoteUser.path}) --password-stdin ${remote}`)
                            items.forEach(item => {
                                const remoteName = `${remote}/${item.name}:${gitSha.sha}`
                                visitor.addSnippet(`docker image tag ${item.name}:${id.session} ${remoteName} && docker image push ${remoteName} && docker rmi --force ${remoteName}`)
                            });
                            return Promise.resolve()
                        })).then(() => { })
                    } else {
                        return Promise.resolve()
                    }
                }
                return processImages()
            } else {
                return Promise.resolve()
            }
        })
    }
}

class BuildStepContextImpl implements StepBuilder.Context {
    constructor(readonly stepIndex: number, readonly secrets: Secrets.Service) { }
}
class BuildStepTeardownContextImpl implements StepBuilder.TeardownContext {
    constructor(readonly stepIndex: number) { }
}