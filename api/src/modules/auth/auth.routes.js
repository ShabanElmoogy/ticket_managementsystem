import express from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authRateLimit, refreshRateLimit } from '../../middleware/index.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation.js';

const router = express.Router();

router.post('/register', authRateLimit, validate(registerSchema), authController.register);

router.post('/login', authRateLimit, authController.login);

router.post('/refresh', refreshRateLimit, validate(refreshTokenSchema), authController.refreshToken);

router.post('/logout', authController.logout);

router.post('/dev-login', authController.devLogin);

export default router;