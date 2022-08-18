
export function ensureString(input: any, message?: string): string {
    if (typeof input === 'string') return input;
    else throw new Error(message || "Not a string");
}

export function ensureDefined<T>(input: T | null | undefined, message?: string): T {
    if (input != null) return input;
    else throw new Error(message || "Not defined");
}

export function ensureTrue(input: boolean, message?: string): void {
    if (input) return;
    else throw new Error(message || "Not true");
}

