import { DependencyRef } from "./system-config/dependency-ref";
import { ServiceConfig } from "./system-config/service-config";
import { Version } from "./version";

export namespace ImageVersionUtil {
    export class ImageVersion {
        constructor(public readonly registry: ServiceConfig.DockerRegistryStorage, public readonly repository: DependencyRef.ImageRepository, public readonly version: Version) { }

        private static readonly IMAGE_REGEXP = /^(.+?)\/(.+?):(.+?)$/i

        asRegistryHostString(): string {
            return `${this.registry.host}/${this.repository}:${this.version.asString()}`
        }
        asRegistryIdString(): string {
            return `${this.registry.id}/${this.repository}:${this.version.asString()}`
        }
        withVersion(version: Version): ImageVersion {
            return new ImageVersion(this.registry, this.repository, version)
        }

        static parse(raw: string, registries: ServiceConfig.DockerRegistryStorage[]): ImageVersion | undefined {
            const m = raw.match(ImageVersion.IMAGE_REGEXP)
            if (m) {
                const registry = registries.find(r => { return r.host === m[0] || r.id === m[0] })
                const version = Version.parse(m[2])
                return (registry && version) ? new ImageVersion(registry, m[1], version) : undefined
            } else {
                return undefined
            }
        }

    }
}

