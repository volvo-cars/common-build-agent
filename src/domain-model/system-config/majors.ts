import { Expose } from "class-transformer"
import "reflect-metadata"
export namespace Majors {
    export class Serie {
        @Expose()
        public id: string
        @Expose()
        public values: number[]
        constructor(id: string, values: number[]) {
            this.id = id
            this.values = values
        }
        toString(): string {
            return `MajorSerie:${this.id}:${this.values.join(",")}`
        }
    }
    export class Value {
        @Expose()
        public id: string
        @Expose()
        public value: number
        constructor(id: string, value: number) {
            this.id = id
            this.value = value
        }
        toString(): string {
            return `MajorValue:${this.id}:${this.value}`
        }
    }
}