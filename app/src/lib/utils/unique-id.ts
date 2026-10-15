export function generateUUID() {
    return globalThis.crypto.randomUUID();
}