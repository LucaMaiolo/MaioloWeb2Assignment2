/** 
 * Error thrown when a database operation fails, including connection issues,
 * failed queries, or when an expected record is not found.
 * Extends the built-in Error class for use with instanceof checks.
 */
class DatabaseError extends Error {}

export { DatabaseError };
