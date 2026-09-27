// Single place that knows the backend URL. Set VITE_API_URL in frontend/.env.
const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 20_000;
const ANALYSIS_TIMEOUT_MS = 90_000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'Error', errors = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

const FALLBACK_MESSAGES = {
  0: "We couldn't reach the server. Check your connection and make sure the backend is running.",
  404: "We couldn't find what you were looking for.",
  500: 'Something went wrong on our side. Please try again.',
};

async function request(path, { method = 'GET', body, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('The request took too long. Please try again.', { code: 'Timeout' });
    }
    throw new ApiError(FALLBACK_MESSAGES[0], { code: 'NetworkError' });
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body (e.g. a proxy error page)
  }

  if (!response.ok) {
    const message =
      (typeof data?.detail === 'string' && data.detail) ||
      FALLBACK_MESSAGES[response.status] ||
      "We couldn't complete that request. Please try again.";
    throw new ApiError(message, { status: response.status, code: data?.code, errors: data?.errors });
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  analyze: (payload) => request('/api/analyze', { method: 'POST', body: payload, timeout: ANALYSIS_TIMEOUT_MS }),
  listSessions: () => request('/api/sessions'),
  getSession: (id) => request(`/api/sessions/${encodeURIComponent(id)}`),
  deleteSession: (id) => request(`/api/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  dashboard: () => request('/api/dashboard'),
  patterns: () => request('/api/patterns', { method: 'POST', timeout: ANALYSIS_TIMEOUT_MS }),
};
