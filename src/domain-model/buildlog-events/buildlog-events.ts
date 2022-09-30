import { Expose, Type } from "class-transformer"
import { type } from "os"

export namespace BuildLogEvents {

    export enum Level {
        DEBUG = "debug",
        INFO = "info",
        WARNING = "warning",
        ERROR = "error"
    }

    export class BuildLog {
        @Expose()
        @Type(() => Entry)
        entries: Entry[]

        @Expose()
        metaUrls: Map<string, string>

        constructor(entries: Entry[], metaUrls: Map<string, string>) {
            this.entries = entries
            this.metaUrls = metaUrls
        }
    }

    export class Entry {

        @Expose()
        message: string

        @Expose()
        level: Level

        @Expose()
        @Type(() => Date)
        timestamp: Date

        constructor(message: string, level: Level, timestamp: Date) {
            this.message = message
            this.level = level
            this.timestamp = timestamp
        }
    }

}

