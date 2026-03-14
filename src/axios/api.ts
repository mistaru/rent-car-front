/**
 * Centralized API client
 * Automatically resolves base URL based on the current environment.
 */

// ─── Environment Map ──────────────────────────────────────────────────────────

type Env = 'local' | 'staging' | 'production';

const ENV_MAP: Record<Env, string> = {
  local:      'http://localhost:8081',
  staging:    'https://staging.domain.com',
  production: 'https://api.domain.com',
};

const HOSTNAME_TO_ENV: Array<{ match: string | RegExp; env: Env }> = [
  { match: 'localhost',     env: 'local' },
  { match: '127.0.0.1',    env: 'local' },
  { match: 'staging.',      env: 'staging' },
];

function resolveEnv(): Env {
  const hostname = window.location.hostname;
  const entry = HOSTNAME_TO_ENV.find(({ match }) =>
    typeof match === 'string' ? hostname.includes(match) : match.test(hostname),
  );
  return entry?.env ?? 'production';
}

export const BASE_URL = ENV_MAP[resolveEnv()];

// ─── Request Helpers ──────────────────────────────────────────────────────────

type RequestOptions = Omit<RequestInit, 'body'> & {
  params?: Record<string, string | number | boolean | string[]>;
  body?: unknown;
};

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('Content-Type') ?? '';

  if (!res.ok) {
    const error = contentType.includes('application/json')
      ? await res.json().catch(() => ({}))
      : { message: res.statusText };
    throw new ApiError(res.status, error?.message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204 || res.headers.get('Content-Length') === '0') {
    return undefined as T;
  }

  return contentType.includes('application/json') ? res.json() : (res.text() as Promise<T>);
}

// ─── Error Class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Core Client ─────────────────────────────────────────────────────────────

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, headers, ...rest } = options;

  const res = await fetch(buildUrl(path, params), {
    method,
    // headers: {
    //   'Content-Type': 'application/json',
    //   Accept: 'application/json',
    //   ...headers,
    // },
    // body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...headers,
    },
    body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    ...rest,
  });

  return parseResponse<T>(res);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const api = {
  get:    <T>(path: string, options?: RequestOptions)         => request<T>('GET',    path, options),
  post:   <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST',   path, { ...options, body }),
  put:    <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT',    path, { ...options, body }),
  patch:  <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH',  path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions)         => request<T>('DELETE', path, options),
};

export default api;
