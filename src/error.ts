/**
 * Custom error class for TF errors.
 * @param message - The error message
 * @param url - The optional URL to link to Testing Farm logs
 */
export class TFError extends Error {
  constructor(
    message: string,
    readonly url?: string
  ) {
    super(message);
  }
}
