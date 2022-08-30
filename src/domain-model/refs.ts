export namespace Refs {

    export enum Type {
        TAG = "tag",
        BRANCH = "branch",
        SHA = "sha"
    }

    export abstract class Ref {
        protected constructor(public readonly type: Type, public readonly name: string) { }
        toString(): string {
            return `${this.type}:${this.name}`
        }
        abstract originRef(): string

    }

    export class BranchRef extends Ref {
        constructor(name: string) {
            super(Type.BRANCH, name)
        }
        static create(ref: string): BranchRef {
            const parsedRef = create(ref)
            if (parsedRef.type === Type.BRANCH) {
                return parsedRef
            } else {
                throw new Error(`Illegal branch ref: ${ref}`)
            }
        }
        override originRef(): string {
            return `origin/${this.name}`
        }
    }
    export class TagRef extends Ref {
        constructor(name: string) {
            super(Type.TAG, name)
        }
        static create(ref: string): TagRef {
            const parsedRef = create(ref)
            if (parsedRef.type === Type.TAG) {
                return parsedRef
            } else {
                throw new Error(`Illegal tag ref: ${ref}`)
            }
        }
        override originRef(): string {
            return this.name
        }

    }
    export class ShaRef extends Ref {
        static regExp = /^[0-9a-f]{40}$/i
        private constructor(public readonly sha: string) {
            super(Type.SHA, sha)

        }
        static create(sha: string): ShaRef {
            if (this.regExp.test(sha)) {
                return new ShaRef(sha)
            } else {
                throw new Error(`Bad sha ref: ${sha}`)
            }
        }
        override originRef(): string {
            return this.name
        }

    }

    export class Branch {
        constructor(public readonly ref: BranchRef, public readonly sha: ShaRef) { }
        static create(ref: string, sha: string): Branch {
            const shaRef = create(sha)
            if (shaRef.type === Type.SHA) {
                return Branch.createWithSha(ref, <ShaRef>shaRef)
            }
            throw new Error(`Bad branch sha-ref: ${sha}`)
        }
        static createWithSha(ref: string, sha: ShaRef): Branch {
            const branchRef = create(ref)
            if (branchRef.type === Type.BRANCH) {
                return new Branch(branchRef, sha)
            }
            throw new Error(`Bad branch-ref: ${ref}`)
        }
    }

    export class Tag {
        constructor(public readonly ref: TagRef, public readonly sha: ShaRef) { }
        static create(ref: string, sha: string): Tag {
            const shaRef = create(sha)
            if (shaRef.type === Type.SHA) {
                return Tag.createWithSha(ref, <ShaRef>shaRef)
            }
            throw new Error(`Bad tag sha-ref: ${sha}`)
        }
        static createWithSha(ref: string, sha: ShaRef): Branch {
            const tagRef = create(ref)
            if (tagRef.type === Type.TAG) {
                return new Branch(tagRef, sha)
            }
            throw new Error(`Bad tag-ref: ${ref}`)
        }
    }

    export const create = (ref: string): Ref => {
        const parts = ref.split('/')
        if (parts.length >= 3) {
            const [r1, r2] = parts
            if (r1 === "refs") {
                if (r2 === "tags") {
                    return new TagRef(parts.splice(2).join("/"))
                } else if (r2 === "remotes") {
                    const nameParts = parts.splice(3)
                    return new BranchRef(nameParts.join("/"))
                } else if (r2 === "heads") {
                    return new BranchRef(parts.splice(2).join("/"))
                } else {
                    return new BranchRef(parts.splice(1).join("/"))
                }
            }
            throw new Error(`Unsupported ref [tags/heads/remotes]: ${ref}`)
        } else if (parts.length === 1 && ref.length === 40) {
            try {
                return ShaRef.create(parts[0])
            } catch (e) { }
        }
        throw new Error(`Bad ref:${ref}.`)
    }

    export const tryCreate = (ref: string): Ref | undefined => {
        try {
            return create(ref)
        } catch (e) {
            return undefined
        }
    }
}