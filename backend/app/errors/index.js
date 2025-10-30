export function registerErrorHandlers(app) {
  // 404 handler for API and root JSON
  app.use((req, res, next) => {
    if (req.path === '/' || req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not Found' });
    }
    next();
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });
}