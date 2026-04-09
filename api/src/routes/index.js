import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import moduleRoutes from '../modules/routes.js';
import { registerSwagger } from './swagger.routes.js';

export function registerRoutes(app) {
  registerSwagger(app);

  // All API routes under /api
  app.use('/api', moduleRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // SPA catch-all — serve index.html for non-API routes
  app.get('*', (req, res) => {
    const frontendPath = path.join(__dirname, '../../../web/dist/index.html');
    res.sendFile(frontendPath, (err) => {
      if (err) {
        res.json({ name: 'Ticket Management API', status: 'OK' });
      }
    });
  });
}
