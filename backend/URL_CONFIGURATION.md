# Backend URL Configuration

## Environment Variables Setup

The backend now uses comprehensive URL configuration through environment variables in the `.env` file.

## Development Configuration (.env)

```env
# Environment Configuration
NODE_ENV=development

# Server Configuration
PORT=3001
HOST=localhost

# URL Configuration
BACKEND_URL=http://localhost:3001
FRONTEND_URL=https://localhost:5173
API_BASE_URL=http://localhost:3001/api

# HTTPS Configuration (optional)
USE_HTTPS=false
HTTPS_PORT=3443

# CORS Origins (comma-separated)
CORS_ORIGINS=https://localhost:5173,http://localhost:5173,http://localhost:3000

# MySQL Database Configuration
DATABASE_URL="mysql://root:P@ssword123@localhost:3306/ticket_management"

# JWT Configuration
JWT_SECRET="ghjghghghghjghjghj"
JWT_EXPIRES_IN=24h

# Socket.IO Configuration
SOCKET_CORS_ORIGIN=https://localhost:5173,http://localhost:5173
```

## Production Configuration (.env.production)

```env
# Environment Configuration
NODE_ENV=production

# Server Configuration
PORT=3001
HOST=0.0.0.0

# URL Configuration
BACKEND_URL=https://your-domain.com
FRONTEND_URL=https://your-frontend-domain.com
API_BASE_URL=https://your-domain.com/api

# HTTPS Configuration
USE_HTTPS=true
HTTPS_PORT=443

# CORS Origins
CORS_ORIGINS=https://your-frontend-domain.com

# Database Configuration
DATABASE_URL="mysql://username:password@your-db-host:3306/ticket_management"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_EXPIRES_IN=24h
```

## Environment Variables Explained

### Server Configuration
- **NODE_ENV**: Environment mode (development/production)
- **PORT**: Server port (default: 3001)
- **HOST**: Server host (localhost for dev, 0.0.0.0 for production)

### URL Configuration
- **BACKEND_URL**: Full backend URL
- **FRONTEND_URL**: Full frontend URL
- **API_BASE_URL**: API base URL for external references

### HTTPS Configuration
- **USE_HTTPS**: Enable/disable HTTPS (true/false)
- **HTTPS_PORT**: HTTPS port (default: 443)

### CORS Configuration
- **CORS_ORIGINS**: Comma-separated list of allowed origins
- **SOCKET_CORS_ORIGIN**: Socket.IO CORS origins

### Database Configuration
- **DATABASE_URL**: MySQL connection string

### JWT Configuration
- **JWT_SECRET**: Secret key for JWT tokens
- **JWT_EXPIRES_IN**: Token expiration time

## Server Startup Information

When the server starts, it will display:

```
Database connected successfully
Server running on http://localhost:3001
API Base URL: http://localhost:3001/api
Environment: development
CORS Origins: https://localhost:5173, http://localhost:5173, http://localhost:3000
```

## Usage Examples

### Development Setup
1. Copy `.env.example` to `.env`
2. Update database credentials
3. Run `npm run dev`

### Production Setup
1. Copy `.env.production` to `.env`
2. Update all URLs with your actual domains
3. Update database credentials
4. Generate strong JWT secret
5. Run `npm start`

## CORS Configuration

The server automatically configures CORS based on the `CORS_ORIGINS` environment variable:

```javascript
// Automatically splits comma-separated origins
const CORS_ORIGINS = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',') : 
  ["https://localhost:5173", "http://localhost:5173"];
```

## HTTPS Support

Enable HTTPS by setting `USE_HTTPS=true` and ensuring SSL certificates exist in the `.cert` directory:

```
backend/
├── .cert/
│   ├── key.pem
│   └── cert.pem
```

## Frontend Integration

Update your frontend API configuration to use the backend URL:

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = process.env.VITE_API_BASE_URL || "http://localhost:3001/api";
```

## Environment-Specific Configurations

### Development
- HTTP backend on localhost:3001
- HTTPS frontend on localhost:5173
- Local MySQL database
- Relaxed CORS policy

### Production
- HTTPS backend on your domain
- HTTPS frontend on your domain
- Production database
- Strict CORS policy
- Secure cookies and headers

## Security Considerations

### Development
- Use HTTP for simplicity
- Local database with simple credentials
- Basic JWT secret

### Production
- Always use HTTPS
- Strong database credentials
- Complex JWT secret (minimum 32 characters)
- Secure CORS configuration
- Environment variable validation

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGINS` includes your frontend URL
   - Ensure protocol (http/https) matches

2. **Database Connection**
   - Verify `DATABASE_URL` format
   - Check database server is running
   - Validate credentials

3. **SSL Certificate Errors**
   - Ensure certificates exist in `.cert` directory
   - Check certificate validity
   - Set `USE_HTTPS=false` for HTTP mode

### Debug Commands

```bash
# Check environment variables
node -e "console.log(process.env)"

# Test database connection
npm run db:test

# Check server startup
npm run dev
```

## Best Practices

1. **Never commit `.env` files** - Use `.env.example` templates
2. **Use strong secrets in production** - Generate random JWT secrets
3. **Validate environment variables** - Check required variables on startup
4. **Use HTTPS in production** - Always encrypt traffic
5. **Restrict CORS origins** - Only allow necessary domains
6. **Monitor logs** - Track server startup and errors