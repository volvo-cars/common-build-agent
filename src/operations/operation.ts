import { VaultService } from "../vault/vault-service"

export namespace Operations {

    export type OutputReceiver = (output: string) => void

    export class Id {
        constructor(public readonly session: string) { }

        namedSessionKey(key: string): string {
            return `${key}-${this.session}`
        }
    }

    export abstract class Operation {

        protected constructor() { }

        abstract execute(id: Id, receiver: OutputReceiver): Promise<void>
    }
}

export class MultiOperation extends Operations.Operation {
    constructor(private operations: Operations.Operation[]) {
        super()
    }
    execute(id: Operations.Id, receiver: Operations.OutputReceiver): Promise<void> {
        return Promise.all(this.operations.map(o => { return o.execute(id, receiver) })).then(() => { })
    }

}