/**
 * cors.js
 * Single source of truth for allowed CORS origins.
 *
 * Production origins must be set via the CORS_ORIGINS env var
 * (comma-separated list). The fallback is localhost-only for local dev.
 * No production URLs are hardcoded here.
 */

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:5173',
  'https://localhost:5174',
];

export const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
  : DEV_ORIGINS;
