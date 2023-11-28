/**
 * Custom error class for TF errors.
 * @param message - The error message
 * @param url - The optional URL to link to Testing Farm logs
 */
export class TFError extends Error {
    constructor(message, url) {
        super(message);
        this.url = url;
    }
}
//# sourceMappingURL=error.js.map