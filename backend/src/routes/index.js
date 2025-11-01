import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Modular routes
import moduleRoutes from '../modules/routes.js';

export function registerRoutes(app) {
  // Modular API routes
  app.use('/api', moduleRoutes);
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Serve frontend for all non-API routes
  app.get('*', (req, res) => {
    // If it's an API route, return 404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Serve frontend index.html for all other routes
    const frontendPath = path.join(__dirname, '../../../frontend/dist/index.html');
    res.sendFile(frontendPath, (err) => {
      if (err) {
        res.json({
          name: 'Ticket Management API',
          status: 'OK',
          health: '/api/health',
          note: 'Frontend not built. Run: cd frontend && npm run build'
        });
      }
    });
  });
}