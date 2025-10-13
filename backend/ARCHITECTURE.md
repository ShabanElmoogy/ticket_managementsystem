# Backend Architecture

This document outlines the organized structure of the ticket management system backend.

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration and connection
├── constants/
│   └── index.js             # Application constants (status, roles, etc.)
├── controllers/
│   ├── index.js             # Controller exports
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management logic
│   ├── ticketController.js  # Ticket management logic
│   ├── commentController.js # Comment management logic
│   └── dashboardController.js # Dashboard statistics logic
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── socketMiddleware.js  # Socket.IO middleware
├── routes/
│   ├── index.js             # Route exports
│   ├── authRoutes.js        # Authentication routes
│   ├── userRoutes.js        # User management routes
│   ├── ticketRoutes.js      # Ticket management routes
│   └── dashboardRoutes.js   # Dashboard routes
├── utils/
│   └── socketHelpers.js     # Socket.IO helper functions
├── prisma/                  # Database schema and migrations
├── server.js                # Main application entry point
└── package.json             # Dependencies and scripts
```

## Architecture Patterns

### MVC Pattern
- **Models**: Defined using Prisma schema
- **Views**: JSON API responses
- **Controllers**: Business logic separated into controller files

### Middleware Pattern
- Authentication middleware for protected routes
- Socket middleware for real-time notifications
- Error handling middleware

### Repository Pattern
- Database operations centralized through Prisma client
- Shared database instance across all controllers

## Key Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (ADMIN/EMPLOYEE)
- Protected routes with middleware

### Real-time Communication
- Socket.IO integration for live notifications
- User-specific notification rooms
- Event-driven architecture

### Database Management
- Prisma ORM for type-safe database operations
- Connection pooling and graceful shutdown
- Centralized database configuration

### API Organization
- RESTful API design
- Modular route organization
- Consistent error handling

## Route Structure

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login

### User Routes (`/api/users`)
- `GET /` - Get all users (admin only)
- `GET /employees` - Get all employees

### Ticket Routes (`/api/tickets`)
- `GET /` - Get tickets with filtering
- `GET /:id` - Get single ticket
- `POST /` - Create ticket (admin only)
- `PUT /:id` - Update ticket
- `DELETE /:id` - Delete ticket (admin only)
- `POST /:id/take` - Assign ticket to current user
- `POST /:id/comments` - Add comment to ticket

### Dashboard Routes (`/api/dashboard`)
- `GET /stats` - Get dashboard statistics
- `GET /activities` - Get activity feed

## Security Features

- Password hashing with bcrypt
- JWT token validation
- Role-based access control
- Input validation and sanitization
- CORS configuration

## Real-time Features

- Live ticket updates
- Comment notifications
- Assignment notifications
- Activity feed updates

## Error Handling

- Centralized error middleware
- Consistent error response format
- Proper HTTP status codes
- Detailed error logging

## Database Schema

The application uses Prisma with the following main entities:
- **User**: Authentication and user management
- **Ticket**: Core ticket entity with status tracking
- **Comment**: Ticket comments and communication

## Environment Configuration

Required environment variables:
- `DATABASE_URL`: Database connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 3001)

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables in `.env`
3. Run database migrations: `npx prisma migrate dev`
4. Start the server: `npm start`

## Development Guidelines

- Follow the established folder structure
- Use consistent naming conventions
- Implement proper error handling
- Add appropriate middleware for new routes
- Maintain separation of concerns
- Write descriptive commit messages