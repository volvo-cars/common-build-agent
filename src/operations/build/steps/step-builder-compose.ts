import _ from "lodash";
import Yaml from 'yaml';
import { ImageVersionUtil } from "../../../domain-model/image-version-util";
import { BuildConfig } from "../../../domain-model/system-config/build-config";
import { ServiceConfig } from "../../../domain-model/system-config/service-config";
import { Operations } from "../../operation";
import { StepBuilder } from "./step-builder";

export class StepBuilderCompose implements StepBuilder.Builder {


    constructor(private readonly config: BuildConfig.BuildCompose.Step, private readonly registries: ServiceConfig.DockerRegistryStorage[]) { }

    generateBuild(step: number, id: Operations.Id, visitor: StepBuilder.Visitor): void {

        const nodes = this.config.nodes
        const commands = this.config.commands
        const dockerComposeFileObject = Array.from(nodes.entries()).reduce((acc, [nodeId, config]) => {
            acc.services.set(nodeId, this.createDockerComposeService(id, nodeId, config, commands))
            return acc
        }, { version: '3', services: new Map() })
        let snippets: string[] = [`
echo docker-compose up...
        `]
        const dockerCompose = Yaml.stringify(dockerComposeFileObject)
        snippets.push(`
set +e # read returns 1 on success
read -r -d '' dockerComposeYml${step} <<'EOF'
${dockerCompose}
EOF
set -e
`)

        snippets.push(`
shutdown${step}() {
    echo "docker compose down..."
    echo "$dockerComposeYml${step}" | docker compose -f - -p cb-${id.session} down
}
on_error${step}() {
    echo "Error: $1 on line $2" >&2
    shutdown${step}
    exit $1
}
trap 'on_error${step} $? $LINENO' ERR
    `)
        snippets.push(`echo "$dockerComposeYml${step}" | docker compose -f - -p cb-${id.session} up --detach`)
        snippets.push("echo Containers started:")
        snippets.push(`echo "$dockerComposeYml${step}" | docker compose -f - -p cb-${id.session} ps`)
        commands.forEach(command => {
            const getSingleNodeId = (): string => {
                if (this.config.nodes.size === 1) {
                    return Array.from(this.config.nodes.keys())[0]
                } else {
                    throw new Error(`Must define image when multiple images are in process.`)
                }
            }
            const nodeId = command.node || getSingleNodeId()
            const cmd = `docker exec -w /work $(docker ps -aqf "name=${id.namedSessionKey(nodeId)}") bash -c '${command.cmd}'`
            snippets.push(cmd)
        })
        snippets.push(`trap - ERR`)
        snippets.push(`shutdown${step}`)
        visitor.addSnippet(snippets.join("\n"))
    }

    generateTearDown(step: number, id: Operations.Id, visitor: StepBuilder.Visitor): void { }

    private createDockerComposeService(id: Operations.Id, nodeId: string, node: BuildConfig.BuildCompose.Node, commands: BuildConfig.BuildCompose.NodeCommand[]): object {
        const commandNode = node.entryPoint ? {
            command: node.entryPoint
        } : (commands.find(c => { return c.node === nodeId || !c.node }) ? { command: "/bin/bash -c 'trap exit INT TERM; while true; do sleep 1 & wait; done;'" } : {})
        const imageVersion = ImageVersionUtil.ImageVersion.parse(node.image, this.registries)
        let [image, maybeVersion] = node.image.split(":")
        let realImageVersion = imageVersion ? imageVersion.asRegistryHostString() : `${image}:${maybeVersion || id.session}`
        return _.merge(
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

