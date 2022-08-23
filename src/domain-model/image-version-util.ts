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
            const m = raw.match(ImageVersion.IMAGE_REGEXP)
            if (m) {
                const version = Version.parse(m[3])
                return version ? new ImageVersion(m[1], m[2], version) : undefined
            } else {
                return undefined
            }
        }

    }
}

