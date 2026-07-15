/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ApiRequestOptions extends RequestInit {
  workspaceId?: string;
}

async function request(url: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { workspaceId, headers = {}, ...rest } = options;

  const finalHeaders = new Headers(headers);

  // Attach workspace ID header
  if (workspaceId) {
    finalHeaders.set('x-workspace-id', workspaceId);
  } else {
    // Default fallback
    finalHeaders.set('x-workspace-id', 'nest-realty-demo');
  }

  // Attach token from localStorage if present
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('shapework_session_token');
    if (token) {
      finalHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  return fetch(url, {
    ...rest,
    headers: finalHeaders,
    credentials: 'include'
  });
}

export const apiClient = {
  get: (url: string, options?: ApiRequestOptions) =>
    request(url, { ...options, method: 'GET' }),

  post: (url: string, body?: any, options?: ApiRequestOptions) =>
    request(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      body: body ? JSON.stringify(body) : undefined
    }),

  put: (url: string, body?: any, options?: ApiRequestOptions) =>
    request(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      body: body ? JSON.stringify(body) : undefined
    }),

  delete: (url: string, options?: ApiRequestOptions) =>
    request(url, { ...options, method: 'DELETE' })
};
