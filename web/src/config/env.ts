const isProd = import.meta.env.PROD;

// In dev: Vite proxy rewrites /api → backend, so base URL is /api/v1
// In prod: full backend URL + /api/v1 suffix
export const API_BASE_URL = isProd
  ? `${import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

export const SOCKET_URL = isProd
  ? (import.meta.env.VITE_SOCKET_URL?.replace(/\/+$/, '') || window.location.origin)
  : window.location.origin;
