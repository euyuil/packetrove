export function logUnexpectedRequestFailure() {
  try {
    console.error({ event: 'request_failure', error_code: 'INTERNAL_ERROR' });
  } catch {
    // Logging must not replace the original error response.
  }
}
