import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import moduleRoutes from '../modules/routes.js';
import { registerSwagger } from './swagger.routes.js';

export function registerRoutes(app) {
  registerSwagger(app);

  app.use('/', moduleRoutes);

  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Unmatched /api/* → 404 JSON (must come before the SPA catch-all)
  app.use('/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // SPA catch-all — only for non-API routes
  app.get('*', (req, res) => {
    const frontendPath = path.join(__dirname, '../../../web/dist/index.html');
    res.sendFile(frontendPath, (err) => {
      if (err) {
        res.json({
          name: 'Ticket Management API',
          status: 'OK',
          health: '/api/health',
          note: 'Frontend not built. Run: cd frontend && npm run build',
        });
      }
    });
  });
}
