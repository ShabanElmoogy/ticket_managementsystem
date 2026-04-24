/**
 * auth.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 */

import * as authService from './auth.service.js';
import { handleError } from '../../errors/index.js';

// ── Tenant slug extraction ────────────────────────────────────────────────────

function getTenantSlug(req) {
  const raw = req.headers['x-tenant-slug'];
  return typeof raw === 'string' ? raw.trim() : '';
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export const register = async (req, res) => {
  try {
    const result = await authService.register(req.body, getTenantSlug(req));
    res.status(201).json(result);
  } catch (e) { handleError(res, e, 'Register'); }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, getTenantSlug(req));
    res.json(result);
  } catch (e) { handleError(res, e, 'Login'); }
};

export const refreshToken = async (req, res) => {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    res.json(result);
  } catch (e) { handleError(res, e, 'Refresh token'); }
};

export const logout = async (req, res) => {
  try {
    res.json(await authService.logout(req.body.refreshToken));
  } catch (e) { handleError(res, e, 'Logout'); }
};

export const devLogin = async (req, res) => {
  try {
    if (!req.body.email) return res.status(400).json({ error: 'email is required' });
    const result = await authService.devLogin(req.body.email, getTenantSlug(req));
    res.json(result);
  } catch (e) { handleError(res, e, 'Dev login'); }
};
