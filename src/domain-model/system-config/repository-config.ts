import { Expose, Type } from "class-transformer"

export namespace RepositoryConfig {

    export class MajorSerie {
        @Expose()
        public id: string

        @Expose()
        public autoApply: boolean
        constructor(id: string, autoApply: boolean) {
            this.id = id
            this.autoApply = autoApply
        }
    }

    export enum Action {
        Nothing = "nothing",
        Merge = "merge",
        Release = "release"
    }

    export class LabelAction {
        @Expose()
        public id: string

        @Expose()
        public action: Action

        constructor(id: string, action: Action) {
            this.id = id
            this.action = action
        }
    }

    export class BuildAutomation {
        @Expose()
        public default: Action

        @Expose()
        @Type(() => LabelAction)
        public labels: LabelAction[]

        constructor(_default: Action, labels: LabelAction[]) {
            this.default = _default
            this.labels = labels
        }

        findAction(label: string): RepositoryConfig.Action {
            return this.labels.find(l => { return l.id === label })?.action || this.default
        }
    }


    export class Config {
        @Expose()
        version: number = 1

        @Expose()
        @Type(() => MajorSerie)
        public majorSerie?: MajorSerie

        @Expose()
        @Type(() => BuildAutomation)
        public buildAutomation: BuildAutomation

        constructor(buildAutomation: BuildAutomation, majorSerie?: MajorSerie) {
            this.majorSerie = majorSerie
            this.buildAutomation = buildAutomation
        }
    }
}
