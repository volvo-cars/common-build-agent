import "reflect-metadata"
import { ClassConstructor, instanceToPlain, plainToInstance } from "class-transformer";

export class Codec {
    private constructor() { }
    static toInstance<T>(data: string | object, cls: ClassConstructor<T>): T {
        if (typeof data === "string") {
            return plainToInstance(cls, <object>JSON.parse(data), { excludeExtraneousValues: true })
        } else {
            return plainToInstance(cls, data, { excludeExtraneousValues: true })
        }
    }
    static toInstances<T>(data: string | object, cls: ClassConstructor<T>): T[] {
        if (typeof data === "string") {
            return plainToInstance(cls, <any[]>JSON.parse(data), { excludeExtraneousValues: true })
        } else {
            return plainToInstance(cls, <any[]>data as [], { excludeExtraneousValues: true })
        }
    }

    static toPlain(instance: object): object {
        return instanceToPlain(instance, { excludeExtraneousValues: true })
    }
    static toJson(instance: object): string {
        return JSON.stringify(this.toPlain(instance), null, 2)
    }
}