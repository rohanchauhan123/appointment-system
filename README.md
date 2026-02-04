# Diagnostic Center Appointment System - Backend

A production-ready NestJS backend for a diagnostic center calling team with real-time updates, role-based access control, comprehensive audit logging, and automated daily CSV reporting.

## 🚀 Features

- **Real-Time Updates** - Socket.IO WebSocket for live appointment sync
- **Role-Based Access** - Admin and Agent roles with protected routes
- **Audit Trail** - Complete logging of all CREATE/UPDATE actions with data snapshots
- **Daily Reports** - Automated CSV export emailed at 11:30 PM
- **JWT Authentication** - Secure token-based authentication
- **Clean Architecture** - Modular NestJS structure

## 📋 Tech Stack

- Node.js (LTS)
- NestJS (TypeScript)
- PostgreSQL
- TypeORM
- Socket.IO
- JWT Authentication
- Nodemailer

## 🗄️ Database Schema

### Users
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | User name |
| email | string | Unique email |
| password | string | Bcrypt hashed |
| role | enum | 'admin' \| 'agent' |
| is_active | boolean | Account status |
| created_at | timestamp | |

### Appointments
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| patient_name | string | |
| test_name | string | |
| branch_location | string | |
| appointment_date | datetime | |
| amount | decimal | |
| advance_amount | decimal | |
| balance_amount | decimal | Auto-calculated |
| pro_details | string | Nullable |
| contact_number | string | |
| agent_id | UUID | FK → users |

### Activity Logs
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| appointment_id | UUID | FK → appointments |
| agent_id | UUID | FK → users |
| action | enum | CREATE \| UPDATE \| DELETE |
| old_data | JSONB | Previous state |
| new_data | JSONB | New state |
| created_at | timestamp | |

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 14+
- npm or yarn

### 1. Clone and Install

```bash
cd appointment
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=diagnostic_center

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# SMTP (for daily reports)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@diagnosticcenter.com

# Report Recipients
REPORT_RECIPIENTS=admin@example.com,manager@example.com
```

### 3. Create Database

```bash
# Using psql
createdb diagnostic_center

# Or via Docker
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=diagnostic_center \
  -p 5432:5432 \
  postgres:15
```

### 4. Start the Application

```bash
# Development (with hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

### 5. Seed Admin User

```bash
npm run seed:admin
```

**Default admin credentials:**
- Email: `admin@diagnosticcenter.com`
- Password: `Admin@123`

## 📡 API Endpoints

All endpoints are prefixed with `/api`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login and get JWT token |

**Request:**
```json
{
  "email": "admin@diagnosticcenter.com",
  "password": "Admin@123"
}
```

### Admin Endpoints (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/agents | Create new agent |
| GET | /api/admin/agents | List all agents |
| PUT | /api/admin/agents/:id/status | Toggle agent status |
| GET | /api/admin/activity-logs | View all audit logs |
| POST | /api/admin/jobs/trigger-report | Manually trigger report |

### Appointments (Admin & Agent)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/appointments | List all appointments |
| POST | /api/appointments | Create appointment |
| PUT | /api/appointments/:id | Update appointment |
| GET | /api/appointments/:id | Get single appointment |

## 🔌 WebSocket Events

Connect to `ws://localhost:3000` with JWT token.

### Connection

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

// Or via query parameter
const socket = io('http://localhost:3000?token=YOUR_JWT_TOKEN');
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `appointment_created` | `{ type, data, timestamp }` | New appointment created |
| `appointment_updated` | `{ type, data, timestamp }` | Appointment updated |

## 📧 Daily Reports

- **Schedule:** Every day at 11:30 PM
- **Content:** CSV of all appointments created that day
- **Recipients:** Configured in `REPORT_RECIPIENTS` env var

## 🔒 Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📁 Project Structure

```
src/
├── auth/               # JWT authentication
├── users/              # User management
├── appointments/       # Appointment CRUD
├── activity-logs/      # Audit logging
├── websocket/          # Real-time updates
├── jobs/               # Scheduled tasks
├── common/
│   ├── guards/         # Auth guards
│   └── decorators/     # Custom decorators
├── config/             # Configuration
├── seed/               # Database seeding
└── main.ts             # Application bootstrap
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📝 License

UNLICENSED - Private project
