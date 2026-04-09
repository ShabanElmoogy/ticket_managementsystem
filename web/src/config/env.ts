const isProd = import.meta.env.PROD;

// In dev: Vite proxy rewrites /api → backend, so base URL is /api
// In prod: full backend URL + /api suffix
export const API_BASE_URL = isProd
  ? `${import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '')}/api`
  : '/api';

export const SOCKET_URL = isProd
  ? (import.meta.env.VITE_SOCKET_URL?.replace(/\/+$/, '') || window.location.origin)
  : window.location.origin;
