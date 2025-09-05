/**
 * Utility method to sleep for a specified number of milliseconds.
 * @param ms - The number of milliseconds to sleep.
 * @returns A promise that resolves after the specified delay.
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines if an HTTP status code indicates a resource unavailable error.
 * @param statusCode - The HTTP status code to check.
 * @returns True if the status code indicates a resource unavailable error.
 */
export function isResourceUnavailableStatus(statusCode: number): boolean {
  return statusCode >= 500 || statusCode === 429 || statusCode === 408;
}
