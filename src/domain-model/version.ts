import assert from 'assert'
import _ from 'lodash'

export class Version {
    readonly segments: number[]
    private constructor(segments: number[]) {
        assert(segments.length > 1, "A version with zero segments [] is illegal")
        this.segments = segments
    }

    get major(): number {
        return this.segments[0]
    }

    static create(version: string): Version {
        const v = Version.parse(version)
        if (v) {
            return v
        } else {
            throw new Error(`Could not parse ${version} to a valid version`)
        }
    }
    static fromSegments(segments: number[]): Version {
        return new Version(segments)
    }
    static parse(version: string): Version | null {
        try {
            let parts = version.split('.')
            assert(parts.length > 1, "Valid version must have 2+ segments")
            return new Version(_.map(parts, (s: string) => {
                let n = parseInt(s)
                if (isNaN(n)) {
                    throw "Not numeric"
                }
                return n
            }))
        } catch (e) {
            return null
        }
    }

    asString(): string {
        return this.segments.join('.')
    }

    /**
     * Compares this Version to another Version.
     * @param other the other Version to compare
     * @returns positive if this is heigher, negative if this is lower and 0 if they are the same.
     */
    compare(other: Version): number {
        if (other.segments === this.segments) {
            return 0
        } else {
            let minSize = Math.min(this.segments.length, other.segments.length)
            let pos = 0
            while (pos < minSize) {
                let diff = this.segments[pos] - other.segments[pos]
                if (diff === 0) {
                    pos++
                } else {
                    return diff
                }
            }
            return this.segments.length - other.segments.length
        }
    }
    toString(): string {
        return `version:${this.asString()}`
    }
}