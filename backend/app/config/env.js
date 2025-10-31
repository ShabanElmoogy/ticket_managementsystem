import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3001;
export const HOST = process.env.HOST || '0.0.0.0';
export const USE_HTTPS = process.env.USE_HTTPS === 'true';
export const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ["https://localhost:5173", "http://localhost:5173","https://ticket-managementsystem-2.onrender.com"];