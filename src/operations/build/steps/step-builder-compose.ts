import _ from "lodash";
import Yaml from 'yaml';
import { ImageVersionUtil } from "../../../domain-model/image-version-util";
import { BuildConfig } from "../../../domain-model/system-config/build-config";
import { Operations } from "../../operation";
import { StepBuilder } from "./step-builder";

export class StepBuilderCompose implements StepBuilder.Builder {


    constructor(private readonly config: BuildConfig.BuildCompose.Step) { }

    generateBuild(context: StepBuilder.Context, id: Operations.Id, visitor: StepBuilder.Visitor): void {

        const nodes = this.config.nodes
        const commands = this.config.commands
        const secrets = this.config.secrets || new Map<string, string>()

        if (this.config.nodes.size < 1) {
            throw new Error(`A compose build step must a least contain one node.`)
        }

        const versionSection = {
            version: "3"
        }
        const servicesSection = {
            services: Array.from(nodes.entries()).reduce((acc, [nodeId, config]) => {
                acc[nodeId] = this.createDockerComposeService(id, nodeId, config, commands, Array.from(secrets.keys()))
                return acc
            }, <Record<string, object>>{})
        }

        const secretsSection = secrets ? {
            secrets: Array.from(secrets.entries()).reduce((acc, [name, vaultPath]) => {
                const mountedSecret = context.secrets.mountSecret(vaultPath)
                acc[name] = { file: mountedSecret.path }
                return acc
            }, <Record<string, object>>{})
        } : {}

        let snippets: string[] = [`
echo docker compose up...
        `]
        const dockerCompose = Yaml.stringify(_.merge({}, versionSection, servicesSection, secretsSection))
        snippets.push(`
set +e # read returns 1 on success
read -r -d '' dockerComposeYml${context.stepIndex} << 'EOF'
${dockerCompose}
EOF
set -e
    `)

        snippets.push(`
shutdown${context.stepIndex} () {
    echo "docker compose down..."
    echo "$dockerComposeYml${context.stepIndex}" | docker compose -f - -p cb-${id.session} down
}
on_error${context.stepIndex} () {
    echo "Error: $1 on line $2" >& 2
    shutdown${context.stepIndex}
    exit $1
}
trap 'on_error${context.stepIndex} $? $LINENO' ERR
    `)
        snippets.push(`echo "$dockerComposeYml${context.stepIndex}" | docker compose -f - -p cb-${id.session} up --detach`)
        snippets.push("echo containers started:")
        snippets.push(`echo "$dockerComposeYml${context.stepIndex}" | docker compose -f - -p cb-${id.session} ps`)
        commands.forEach(command => {
            const getSingleNodeId = (): string => {
                if (this.config.nodes.size === 1) {
                    return Array.from(this.config.nodes.keys())[0]
                } else {
                    throw new Error(`Must define image when multiple images are in process.`)
                }
            }
            const nodeId = command.node || getSingleNodeId()
            const cmd = `docker exec -t -w /work $(docker ps -aqf "name=${id.namedSessionKey(nodeId)}") bash -c '${command.cmd}'`
            snippets.push(cmd)
        })
        snippets.push(`trap - ERR`)
        snippets.push(`shutdown${context.stepIndex} `)
        visitor.addSnippet(snippets.join("\n"))
    }

    generateTearDown(context: StepBuilder.TeardownContext, id: Operations.Id, visitor: StepBuilder.Visitor): void { }

    private createDockerComposeService(id: Operations.Id, nodeId: string, node: BuildConfig.BuildCompose.Node, commands: BuildConfig.BuildCompose.NodeCommand[], secretNames: string[]): object {
        const commandNode = node.entryPoint ? {
            command: node.entryPoint
        } : (commands.find(c => { return c.node === nodeId || !c.node }) ? { command: "/bin/bash -c 'trap exit INT TERM; while true; do sleep 1 & wait; done;'" } : {})
        const imageVersion = ImageVersionUtil.ImageVersion.parse(node.image)
        let [image, maybeVersion] = node.image.split(":")
        let realImageVersion = imageVersion ? imageVersion.asString() : `${image}:${maybeVersion || id.session}`
        const secretsSection = secretNames.length ? { secrets: secretNames } : {}
        return _.merge(
            {},
            {
                image: realImageVersion,
                volumes:
                    [
                        "${PWD}:/work"
                    ],
                environment: {
                    "VAULT_TOKEN": "${VAULT_TOKEN}"
                },
                container_name: id.namedSessionKey(nodeId)
            },
            commandNode,
            secretsSection,
            (node.dependsOn && node.dependsOn.length) ?
                {
                    links: node.dependsOn,
                    depends_on: node.dependsOn
                }
                : {},
            (node.internalPorts && node.internalPorts.length) ? {
                expose: node.internalPorts
            } : {}
        )
    }
}

