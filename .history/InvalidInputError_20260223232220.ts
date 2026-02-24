/** 
 * Error thrown when user-provided input is missing, empty, or otherwise invalid.
 * Extends the built-in Error class for use with instanceof checks.
 */
class InvalidInputError extends Error {}

export { InvalidInputError };
