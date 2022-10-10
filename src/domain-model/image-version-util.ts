import { DependencyRef } from "./system-config/dependency-ref";
import { Version } from "./version";

export namespace ImageVersionUtil {
    export class ImageVersion {
        constructor(public readonly registry: string, public readonly repository: DependencyRef.ImageRepository, public readonly version: Version) { }

        private static readonly IMAGE_REGEXP = /^(.+?)\/(.+?):(.+?)$/i

        asString(): string {
            return `${this.registry}/${this.repository}:${this.version.asString()}`
        }

        withVersion(version: Version): ImageVersion {
            return new ImageVersion(this.registry, this.repository, version)
        }

        static parse(raw: string): ImageVersion | undefined {
            if (raw) {
                const m = raw.match(ImageVersion.IMAGE_REGEXP)
                if (m) {
                    const registry = m[1]
                    const repository = m[2]
                    const version = Version.parse(m[3])
                    return (registry && version) ? new ImageVersion(registry, repository, version) : undefined
                }
            }
        }

    }
}

