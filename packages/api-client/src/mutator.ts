export type ApiClientConfig = {
  baseUrl: string;
  credentials?: RequestCredentials;
  getHeaders?: () => Record<string, string>;
};

let clientConfig: ApiClientConfig = {
  baseUrl: "http://127.0.0.1:8787",
  credentials: "include",
};

export function configureApiClient(config: Partial<ApiClientConfig>) {
  clientConfig = { ...clientConfig, ...config };
}

export function getApiClientConfig(): ApiClientConfig {
  return clientConfig;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function customFetch<T>(url: string, options: RequestInit): Promise<T> {
  const { baseUrl, credentials, getHeaders } = clientConfig;
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const extraHeaders = getHeaders?.() ?? {};
  for (const [key, value] of Object.entries(extraHeaders)) {
    headers.set(key, value);
  }

  const hasCookieHeader = headers.has("Cookie");

  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    credentials: hasCookieHeader ? "omit" : credentials,
    headers,
  });

  if (!response.ok) {
    let body: unknown;

    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    throw new ApiError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json();

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
}
