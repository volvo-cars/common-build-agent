export namespace VaultUtils {
    export const splitUserSecret = (s: string): [string, string] => {
        const [head, ...tail] = s.split(":")
        if (head && tail.length > 0) {
            return [head, tail.join(":")]
        } else {
            throw new Error(`Could not parse user:secret from secret: ${s}`)
        }
    }
}
