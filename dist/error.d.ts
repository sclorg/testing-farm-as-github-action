/**
 * Custom error class for TF errors.
 * @param message - The error message
 * @param url - The optional URL to link to Testing Farm logs
 */
export declare class TFError extends Error {
    readonly url?: string | undefined;
    constructor(message: string, url?: string | undefined);
}
