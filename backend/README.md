# Ticket Management System - Backend

A robust backend API for managing technical support tickets with role-based access control.

## Features

- **User Management**: Admin and Employee roles with different permissions
- **Ticket Management**: Create, assign, update, and track tickets
- **Real-time Updates**: Track ticket status changes and assignments
- **Comments System**: Add comments to tickets for communication
- **Dashboard Analytics**: Get statistics about tickets and workload
- **Authentication**: JWT-based authentication with secure password hashing

## Tech Stack

- **Node.js** with Express.js
- **SQLite** database with **Prisma** ORM
- **JWT** for authentication
- **bcryptjs** for password hashing

## Setup Instructions

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up the database**:

   ```bash
   npm run db:generate
   npm run db:push
   ```

3. **Seed the database with sample data**:

   ```bash
   node prisma/seed.js
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The server will start on `https://localhost:3001`

## Default Users

After seeding, you can use these accounts:

- **Admin**: `admin@company.com` / `admin123`
- **Employee 1**: `john@company.com` / `employee123`
- **Employee 2**: `sarah@company.com` / `employee123`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/employees` - Get all employees

### Tickets

- `GET /api/tickets` - Get tickets (filtered by role)
- `GET /api/tickets/:id` - Get specific ticket
- `POST /api/tickets` - Create new ticket (Admin only)
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket (Admin only)
- `POST /api/tickets/:id/take` - Take/assign ticket to current user

### Comments

- `POST /api/tickets/:id/comments` - Add comment to ticket

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics

### Health Check

- `GET /api/health` - Server health check

## Database Schema

### User

- `id` - Unique identifier
- `email` - User email (unique)
- `name` - User full name
- `password` - Hashed password
- `role` - ADMIN or EMPLOYEE
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Ticket

- `id` - Unique identifier
- `title` - Ticket title
- `description` - Detailed description
- `status` - OPEN, IN_PROGRESS, RESOLVED, CLOSED
- `priority` - LOW, MEDIUM, HIGH, URGENT
- `assignedToId` - Assigned employee ID (optional)
- `createdById` - Creator user ID
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Comment

- `id` - Unique identifier
- `content` - Comment text
- `ticketId` - Associated ticket ID
- `userId` - Comment author ID
- `createdAt` - Creation timestamp

## Role-Based Access Control

### Admin Permissions

- Create, read, update, delete tickets
- Assign tickets to employees
- View all tickets and users
- Manage user accounts

### Employee Permissions

- View assigned tickets and unassigned tickets
- Take unassigned tickets
- Update status of assigned tickets
- Add comments to accessible tickets

## Environment Variables

Create a `.env` file with:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
```

## Development Commands

- `npm run dev` - Start development server with nodemon
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and apply migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)

## API Usage Examples

### Login

```bash
curl -X POST https://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}'
```

### Create Ticket (Admin)

```bash
curl -X POST https://localhost:3001/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "New Issue",
    "description": "Description of the issue",
    "priority": "HIGH"
  }'
```

### Take Ticket (Employee)

```bash
curl -X POST https://localhost:3001/api/tickets/TICKET_ID/take \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Ticket Status

```bash
curl -X PUT https://localhost:3001/api/tickets/TICKET_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"status": "RESOLVED"}'
```
