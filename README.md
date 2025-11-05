# Ticket Management System (Full-Stack, Realtime, PWA)

A modern ticketing platform for technical support teams featuring realtime updates, role-based access, Kanban workflows, analytics, and an offline-ready PWA.

## Table of Contents
- Overview
- Features
- Tech Stack
- Project Structure
- Getting Started
  - Prerequisites
  - Environment Variables
  - Backend Setup
  - Frontend Setup
- Development
- Scripts
- API Highlights
- Realtime & Notifications
- PWA
- Database & Migrations
- Security
- Deployment Notes
- License

---

## Overview
The Ticket Management System streamlines support operations: create, prioritize, assign, and track tickets linked to customers and applications. It provides a Kanban board for visual workflow, realtime notifications for collaboration, admin dashboards for operations, and a Progressive Web App (PWA) experience for installability and offline fallback. The architecture is modular, secure, and designed for maintainability and scale.

## Features
- Ticket lifecycle management: create, assign, comment, update status (Open/In Progress/Resolved/Closed)
- Customer and application linkage per ticket; priorities and due dates
- Kanban board with drag-and-drop and filters
- Realtime notifications via WebSockets (Socket.IO)
- Role-based access control (Admin, Employee, User)
- Admin panel: Users, Customers, Applications, Tickets, Tasks
- Reminder dialog for delayed tickets with configurable intervals (Employee)
- Dashboard with KPIs and exportable reports (PDF)
- PWA: installable app, offline fallback, auto-update service worker
- Secure dev with HTTPS, proxy to backend

## Tech Stack
- Frontend: React, TypeScript, Vite, Material UI, Zustand, Socket.IO client, vite-plugin-pwa, Axios
- Backend: Node.js, Express, Socket.IO, JWT, Drizzle ORM, PostgreSQL
- Tooling: ESLint, mkcert (local HTTPS), dotenv, Vite

## Project Structure
```
/ticket_managementsystem
├── backend/
│   ├── src/
│   │   ├── config/ (database, http server)
│   │   ├── middleware/ (auth, sockets)
│   │   ├── modules/ (auth, users, tickets, tasks, comments, notifications, customers, applications, docs)
│   │   ├── routes/ and sockets/
│   │   └── utils/
│   ├── drizzle/ (schema, migrations, seed)
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/ (dashboard, admin, kanban, profile, common, pwa)
    │   ├── services/ (api client)
    │   ├── stores/ (auth, theme, kanban)
    │   └── config/, utils/
    ├── index.html
    └── vite.config.ts
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- pnpm / npm / yarn
- mkcert (for local HTTPS in frontend)

### Environment Variables
Create the following env files based on provided examples:

- Backend: `backend/.env`
```
# Database
DATABASE_URL=postgres://user:password@localhost:5432/ticketdb

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Server
PORT=3001
CORS_ORIGIN=https://localhost:5173
```

- Frontend: `frontend/.env` (or `.env.development`)
```
VITE_BACKEND_URL=http://localhost:3001
```

Note: Frontend dev runs over HTTPS with mkcert; proxy forwards `/api` to VITE_BACKEND_URL.

### Backend Setup
1. Install dependencies
```
cd backend
npm install
```
2. Run migrations and seed (Drizzle)
```
# ensure drizzle.config.js is configured
node drizzle/migrate.js
node drizzle/seed.js
```
3. Start backend
```
npm run dev
# or
node server.js
```

### Frontend Setup
1. Install dependencies
```
cd frontend
npm install
```
2. Generate local HTTPS certs (first time)
```
mkcert -install
mkdir .cert
mkcert -key-file ./.cert/key.pem -cert-file ./.cert/cert.pem "localhost" "127.0.0.1" "::1"
```
3. Start frontend
```
npm run dev
# Open https://localhost:5173
```

## Development
- Frontend dev server (Vite) is configured for HTTPS and proxies `/api` to the backend.
- Axios interceptors inject JWT and handle token refresh; request IDs are attached for traceability.
- Socket.IO client connects for realtime events (notifications, updates).
- PWA is enabled in development for testing installation and offline fallback.

## Scripts
Common scripts (see each package.json for details):
- Backend:
  - `npm run dev` – start Express server with auto-reload
  - `npm run test-connection` – verify DB connection
- Frontend:
  - `npm run dev` – start Vite dev server
  - `npm run build` – production build
  - `npm run preview` – preview build locally

## API Highlights
- Auth: login/register, token refresh, protected routes
- Tickets: CRUD, status transitions, comments, reminders
- Users/Customers/Applications: CRUD for admins
- Docs/Reports: generation and retrieval endpoints

## Realtime & Notifications
- Socket.IO on the backend publishes events for ticket changes and system notifications.
- Frontend shows a notification bell with unread counts, popover for items, and a reminder dialog for delayed tickets (employee role) with configurable interval.

## PWA
- vite-plugin-pwa configured with autoUpdate, offline fallback page, and icons
- Installable on desktop/mobile
- Optimized bundle with code splitting and vendor chunks

## Database & Migrations
- Drizzle ORM for schema-first, type-safe models
- Migrations and seeds located in `backend/drizzle/`
- Seed scripts populate demo data (kanban boards, users, tickets)

## Security
- JWT auth with access/refresh tokens
- Role-based middleware on protected routes
- HTTPS in dev via mkcert; production should terminate TLS at a reverse proxy (e.g., Nginx)
- CORS configured via env

## Deployment Notes
- Build frontend and serve via a static server or reverse proxy; point `/api` to backend.
- Configure environment variables for production (DB, JWT, CORS, ports).
- Run migrations before starting the backend.
- For SSL in production, use a proper certificate (e.g., Let’s Encrypt) at the proxy layer.

## License
This project is provided for portfolio and educational purposes. Add a license of your choice if distributing publicly.
