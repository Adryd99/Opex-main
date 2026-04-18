export const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unexpected error while processing the request.';
