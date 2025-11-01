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
    console.error('Error occurred:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    });
    res.status(500).json({ 
      error: 'Something went wrong!',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  });
}