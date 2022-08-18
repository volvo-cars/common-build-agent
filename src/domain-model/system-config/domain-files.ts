export namespace DomainFiles {
    export const systemFilePath = (name: string): string => { return [".common-build", name].join("/") }
}