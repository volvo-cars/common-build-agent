import _ from "lodash"

export const maskValues = <T>(input: T, values: string[]): T => {

    const perform = (target: any): any => {
        const type = typeof (target)
        if (type === "string") {
            return _.reduce(values, (result: string, secret: string) => {
                return result.replace(secret, `**${secret.length}**`)
            }, <string>target)
        } else if (Array.isArray(target)) {
            return target.map((value: any) => {
                return perform(value)
            })
        } else if (type === "object") {
            return _.mapValues(<object>target, (value: any) => {
                return perform(value)
            })
        } else {
            return target
        }

    }
    return perform(input)

}