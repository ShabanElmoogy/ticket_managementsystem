import jwt from 'jsonwebtoken';

// JWT middleware
export const authenticateToken = (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE START ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Extracted token:', token ? 'Token present' : 'No token');

  if (!token) {
    console.log('No token provided, returning 401');
    return res.status(401).json({ error: 'Access token required' });
  }

  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.log('Token verified successfully, user:', user);
    req.user = user;
    next();
  });
};

// Admin middleware
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};