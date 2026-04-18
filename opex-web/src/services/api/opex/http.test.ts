import { describe, expect, it } from 'vitest';
import {
  ApiHttpError,
  assertOkResponse,
  buildQuery,
  joinBaseAndPath,
  resolveApiErrorMessage
} from './http';

describe('http helpers', () => {
  it('builds query strings while ignoring undefined values', () => {
    expect(buildQuery({ page: 1, size: 20, search: undefined })).toBe('?page=1&size=20');
  });

  it('joins a base URL and path consistently', () => {
    expect(joinBaseAndPath('http://localhost:8080/', '/api/users')).toBe('http://localhost:8080/api/users');
    expect(joinBaseAndPath('http://localhost:8080', 'api/users')).toBe('http://localhost:8080/api/users');
  });

  it('extracts the most useful API error message from validation payloads', () => {
    expect(
      resolveApiErrorMessage(
        {
          errors: [{ field: 'email', message: 'must not be blank' }]
        },
        400
      )
    ).toBe('email: must not be blank');
  });

  it('throws a typed API error for failed JSON responses', async () => {
    const response = new Response(JSON.stringify({ message: 'Forbidden' }), {
      status: 403,
      headers: { 'content-type': 'application/json' }
    });

    await expect(assertOkResponse(response)).rejects.toMatchObject({
      name: 'ApiHttpError',
      status: 403,
      message: 'Forbidden'
    } satisfies Partial<ApiHttpError>);
  });
});
