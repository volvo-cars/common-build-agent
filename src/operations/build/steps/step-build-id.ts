export class StepBuildId {
    constructor(public readonly sha: string, public readonly session: string) { }

    fullNodeId(nodeId: string): string { return `${nodeId}_${this.session}` }
    fullId(): string { return `${this.session}` }
}
