import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import moduleRoutes from '../modules/routes.js';
import { registerSwagger } from './swagger.routes.js';

export function registerRoutes(app) {
  // تسجيل Swagger
  registerSwagger(app);

  // إعادة التوجيه من الصفحة الرئيسية إلى Swagger
  app.get('/', (req, res) => {
    res.redirect('/api/docs');
  });

  // جميع مسارات الـ API تحت /api
  app.use('/api', moduleRoutes);

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
    });
  });

  // Catch-all: إعادة توجيه أي مسار غير معروف إلى Swagger
  app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({
        message: 'API route not found',
      });
    }

    res.redirect('/api/docs');
  });
}