# Ticket Management System - Projects Overview

A modern, full-stack ticketing platform for technical support teams featuring realtime updates, role-based access, Kanban workflows, analytics, and cross-platform support (Web & Mobile).

---

## Project Structure

```
ticket_managementsystem/
├── api/          # Backend API (Node.js + Express)
├── web/          # Web Frontend (React + TypeScript + PWA)
├── mobile/       # Mobile App (Expo + React Native)
└── docs/         # Documentation
```

---

## 1. Backend API (`api/`)

RESTful API server handling authentication, ticket management, realtime communication, and database operations.

### Tech Stack
- **Runtime:** Node.js (18+)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Realtime:** Socket.IO
- **Auth:** JWT (access + refresh tokens)
- **Validation:** Zod
- **Logging:** Pino
- **Testing:** Vitest, fast-check
- **API Docs:** Swagger/OpenAPI

### Key Features
- JWT-based authentication with role-based access control (Admin, Employee, User)
- Ticket CRUD with status transitions (Open/In Progress/Resolved/Closed)
- Customer and application management
- Comment system for tickets
- Realtime notifications via WebSockets
- File uploads with Multer
- Email parsing with IMAP (imapflow + mailparser)
- Scheduled tasks with node-cron
- Rate limiting with express-rate-limit
- Security headers with Helmet
- Database migrations and seeding scripts

### Key Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon |
| `npm run start` | Start production server |
| `npm run test` | Run test suite |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed demo data |

---

## 2. Web Frontend (`web/`)

Progressive Web App (PWA) providing a responsive web interface with Kanban boards, dashboards, admin panels, and realtime updates.

### Tech Stack
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **UI Library:** Material UI (MUI) v7
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query
- **Routing:** React Router v7
- **Drag & Drop:** dnd-kit, hello-pangea/dnd
- **Rich Text Editor:** TipTap
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Realtime:** Socket.IO Client
- **i18n:** i18next + react-i18next
- **PDF Export:** jsPDF + jspdf-autotable
- **PWA:** vite-plugin-pwa
- **Styling:** Emotion, RTL support

### Key Features
- Kanban board with drag-and-drop functionality
- Dashboard with KPIs and analytics charts
- Admin panel for managing users, customers, applications, tickets
- Realtime notification bell with unread counts
- Rich text editor for ticket descriptions and comments
- Data tables with sorting, filtering, and pagination
- Date pickers for scheduling and due dates
- QR code generation
- PDF report export
- PWA: installable, offline fallback, auto-update service worker
- Internationalization (i18n) support
- RTL layout support
- HTTPS development with mkcert

### Key Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

---

## 3. Mobile App (`mobile/`)

Cross-platform mobile application built with Expo, providing native iOS and Android access to the ticket management system.

### Tech Stack
- **Framework:** Expo SDK 54 + React Native 0.81
- **Navigation:** Expo Router v6, React Navigation v7
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query
- **Forms:** React Hook Form + Zod
- **Realtime:** Socket.IO Client
- **Animations:** React Native Reanimated v4
- **i18n:** i18next + react-i18next
- **Testing:** Jest + ts-jest
- **Rich Text:** react-native-pell-rich-editor, tentap-editor

### Expo APIs Used
| API | Purpose |
|-----|---------|
| expo-av | Audio/video playback |
| expo-battery | Battery status |
| expo-device | Device information |
| expo-document-picker | File picking |
| expo-image | Optimized image loading |
| expo-image-picker | Camera/gallery access |
| expo-location | Geolocation |
| expo-notifications | Push notifications |
| expo-print | Document printing |
| expo-sharing | Share functionality |
| expo-updates | OTA updates |
| expo-haptics | Haptic feedback |
| expo-splash-screen | Splash screen |

### Key Features
- Native mobile experience for iOS and Android
- Realtime ticket updates and notifications
- Rich text editing for ticket details
- Image picking and document handling
- Maps integration (react-native-maps)
- Gesture handling and smooth animations
- Toast notifications
- Keyboard-aware scrolling
- Internationalization support
- OTA updates via expo-updates
- Web target support via expo-web

### Key Scripts
| Command | Description |
|---------|-------------|
| `npm run start` | Start Expo dev server |
| `npm run android` | Run on Android device/emulator |
| `npm run ios` | Run on iOS simulator/device |
| `npm run web` | Run web version |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest tests |

---

## Architecture Overview

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Web (PWA)  │    │   Mobile     │    │   Future     │
│   React+TS   │    │   Expo/RN    │    │   Clients    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼───────┐
                    │   API        │
                    │   Express    │
                    │   Socket.IO  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │
                    │  (Drizzle)   │
                    └──────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 13+
- npm or pnpm
- Expo CLI (for mobile development)

### Quick Start

```bash
# Install all dependencies
npm run install:all

# Setup database
npm run migrate

# Seed demo data
npm run seed

# Start backend
npm run start

# Start web frontend
cd web && npm run dev

# Start mobile app
cd mobile && npm run start
```

### Environment Variables

**Backend (`api/.env`):**
```env
DATABASE_URL=postgres://user:password@localhost:5432/ticketdb
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d
PORT=3001
CORS_ORIGIN=https://localhost:5173
```

**Web (`web/.env`):**
```env
VITE_BACKEND_URL=http://localhost:3001
```

**Mobile (`mobile/.env`):**
```env
API_URL=http://localhost:3001
```

---

## Development Notes

- The backend runs on port 3001 by default
- Web frontend runs on port 5173 (HTTPS with mkcert)
- Mobile app connects to backend via environment variable
- Socket.IO handles realtime communication across all clients
- Database schema managed via Drizzle migrations
- All clients share the same API endpoints

---

## License

This project is provided for portfolio and educational purposes.
