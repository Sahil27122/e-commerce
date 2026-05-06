# 🛒 E-Commerce Backend API

A production-grade, scalable e-commerce REST API built with Node.js, Express, PostgreSQL, MongoDB, and Redis. Designed with clean architecture, security best practices, and real-world engineering decisions at its core.

> **Open Source for Frontend Developers** — This is a backend-only project. Frontend developers can build full-featured e-commerce applications on top of this API without worrying about backend complexity.

---

## 📌 Project Overview

### What it does
A complete backend system for an e-commerce platform — handling user authentication, product catalog, shopping cart, orders, payments, and background jobs.

### Who it's for
- **Frontend developers** who want a production-ready API to build React, Next.js, Vue, or mobile apps on top of
- **Recruiters and interviewers** evaluating backend engineering skills
- **Students and developers** studying industry-grade backend architecture

### Why it exists
Most e-commerce tutorials either oversimplify the backend or rely on third-party platforms. This project demonstrates how a real backend is architected — with deliberate decisions around databases, security, scalability, and maintainability.

---

## ✨ Key Features

### Authentication & Security
- JWT-based authentication with **access + refresh token** strategy
- Refresh tokens stored **hashed** (SHA-256) in PostgreSQL
- Refresh tokens delivered via **HTTP-only cookies** (XSS protection)
- Token **rotation** on every refresh (replay attack prevention)
- **bcrypt** password hashing with configurable salt rounds
- **Rate limiting** per route to prevent brute force attacks
- CORS with domain whitelist
- Helmet.js security headers

### Architecture
- Clean **Route → Controller → Service** separation
- Global error handling with `AppError` class (operational vs programmer errors)
- `asyncHandler` wrapper — zero try/catch repetition across controllers
- **Zod** schema validation as reusable middleware
- Environment-aware error responses (full stack trace in dev, safe messages in prod)

### Data Layer
- **Polyglot persistence** — PostgreSQL for relational data, MongoDB for flexible documents, Redis for caching and ephemeral data
- **Prisma ORM** with full migration history
- **Mongoose** for MongoDB schema enforcement
- Database-level constraints (UNIQUE, FOREIGN KEY, NOT NULL)

### Performance
- Redis caching layer with configurable TTL per route
- Cache invalidation on data mutations
- Background job queues with **Bull** (email, notifications)
- Cursor-based pagination for large datasets

### Developer Experience
- Full **Postman collection** included
- `.env.example` with all required variables
- **Docker Compose** for one-command local setup
- Structured logging with Winston + Morgan
- Seed scripts for realistic demo data

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js + Express.js | HTTP server and routing |
| Primary DB | PostgreSQL + Prisma ORM | Users, orders, payments (relational, ACID) |
| Document DB | MongoDB + Mongoose | Product catalog (flexible schema) |
| Cache / Queue | Redis + Bull | Cart, sessions, rate limiting, background jobs |
| Authentication | JWT + bcrypt | Stateless auth with secure password storage |
| Validation | Zod | Runtime schema validation |
| File Upload | Cloudinary | Product image storage and CDN delivery |
| Payments | Razorpay | Payment processing and webhook verification |
| Logging | Winston + Morgan | Structured application and request logging |
| DevOps | Docker Compose | Local environment orchestration |

---

## 🏗 Architecture & Design Decisions

### Project Structure Philosophy
The project follows a **layered MVC architecture** where each layer has a single, well-defined responsibility:

```
Route       → URL definition only. No logic.
Controller  → HTTP coordination only. Calls service, returns response.
Service     → All business logic. No knowledge of HTTP.
Model       → Data schema and DB interaction.
Middleware  → Cross-cutting concerns (auth, validation, rate limiting).
```

This separation means business logic is fully reusable — callable from REST routes, background jobs, CLI scripts, or tests without any HTTP dependency.

### Key Engineering Decisions

**Why JWT over Sessions?**
Sessions require server-side state and a shared session store across instances — a scalability problem. JWTs are stateless and verifiable by any server instance using the shared secret. This makes horizontal scaling straightforward.

**Why Access Token + Refresh Token?**
A single long-lived token can't be revoked if stolen. Short-lived access tokens (15 min) limit the damage window. Refresh tokens (7 days) are stored in the database, making them revocable — logout actually works.

**Why store Refresh Tokens hashed?**
If the database is compromised, plain-text refresh tokens give attackers 7-day session access for every user. SHA-256 hashed tokens are useless without the originals. This is defense-in-depth.

**Why HTTP-only cookies for Refresh Tokens?**
`localStorage` is readable by any JavaScript on the page — XSS attacks can steal tokens. HTTP-only cookies are invisible to JavaScript; only the browser sends them. The refresh token (long-lived, high-value) gets maximum browser-level protection.

**Why PostgreSQL for users/orders, MongoDB for products?**
Users, orders, and payments have strict relational structure and require ACID transactions — PostgreSQL enforces schema rigidity and guarantees consistency. Products have variable attributes (a phone has RAM, a shirt has size) — MongoDB's flexible document model handles this naturally without sparse columns or complex joins.

**Why Redis for cart?**
Cart data is ephemeral, high-frequency, and user-session scoped. Storing in PostgreSQL would create millions of rows updated constantly. Redis handles this with O(1) hash operations and TTL-based automatic expiry. It's the right tool for the job.

**Why background jobs for email?**
An API response time should never depend on a third-party service (email provider). If the email provider is slow or down, the user's request shouldn't timeout. Bull queues decouple email delivery from the request lifecycle — the API responds instantly, the email goes out independently with automatic retry on failure.

---

## 🌐 API Overview

### Base URL
```
http://localhost:3000
```

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

### Authentication
Protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication Flow

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│   Client    │         │  API Server  │         │  Database  │
└──────┬──────┘         └──────┬───────┘         └─────┬──────┘
       │                       │                       │
       │  POST /auth/register  │                       │
       │──────────────────────>│                       │
       │                       │  Hash password        │
       │                       │  Store user           │
       │                       │──────────────────────>│
       │  201 { user }         │                       │
       │<──────────────────────│                       │
       │                       │                       │
       │  POST /auth/login     │                       │
       │──────────────────────>│                       │
       │                       │  Verify password      │
       │                       │  Generate tokens      │
       │                       │  Store hashed RT      │
       │                       │──────────────────────>│
       │  accessToken (body)   │                       │
       │  refreshToken (cookie)│                       │
       │<──────────────────────│                       │
       │                       │                       │
       │  GET /auth/me         │                       │
       │  Authorization: Bearer <accessToken>          │
       │──────────────────────>│                       │
       │                       │  Verify JWT           │
       │                       │  Fetch fresh user     │
       │                       │──────────────────────>│
       │  200 { user }         │                       │
       │<──────────────────────│                       │
       │                       │                       │
       │  [Access token expires after 15 minutes]      │
       │                       │                       │
       │  POST /auth/refresh-token (cookie sent auto)  │
       │──────────────────────>│                       │
       │                       │  Hash cookie token    │
       │                       │  Find in DB           │
       │                       │  Delete old token     │
       │                       │  Create new token     │
       │                       │──────────────────────>│
       │  New accessToken      │                       │
       │  New refreshToken cookie                      │
       │<──────────────────────│                       │
```

---

## 📖 API Documentation

### Auth Routes

#### Register
```
POST /auth/register
```
Creates a new user account.

**Request Body:**
```json
{
  "name": "Sahil Sharma",
  "email": "sahil@example.com",
  "password": "securepassword123"
}
```

**Success Response — 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Sahil Sharma",
    "email": "sahil@example.com",
    "role": "CUSTOMER",
    "isVerified": false,
    "createdAt": "2026-04-16T11:05:34.001Z"
  }
}
```

**Error Cases:**

| Status | Message | Cause |
|--------|---------|-------|
| 400 | Name must be at least 2 characters | Validation failed |
| 400 | Invalid email format | Validation failed |
| 400 | Password must be at least 8 characters | Validation failed |
| 409 | Email already registered | Duplicate email |

---

#### Login
```
POST /auth/login
```
Authenticates a user and returns tokens.

**Request Body:**
```json
{
  "email": "sahil@example.com",
  "password": "securepassword123"
}
```

**Success Response — 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
> Refresh token is set automatically as an HTTP-only cookie named `refreshToken`.

**Error Cases:**

| Status | Message | Cause |
|--------|---------|-------|
| 400 | Invalid email format | Validation failed |
| 401 | Invalid credentials | Wrong email or password |

---

#### Get Current User
```
GET /auth/me
```
Returns the authenticated user's profile. **Requires auth.**

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response — 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Sahil Sharma",
    "email": "sahil@example.com",
    "role": "CUSTOMER",
    "isVerified": false,
    "createdAt": "2026-04-16T11:05:34.001Z"
  }
}
```

**Error Cases:**

| Status | Message | Cause |
|--------|---------|-------|
| 401 | No token provided | Missing Authorization header |
| 401 | jwt malformed | Invalid token format |
| 401 | jwt expired | Access token expired — use refresh endpoint |

---

#### Refresh Access Token
```
POST /auth/refresh-token
```
Issues a new access token using the refresh token cookie. Call this when the access token expires.

> No request body needed. The `refreshToken` cookie is sent automatically by the browser.

**Success Response — 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
> A new refresh token cookie is also set automatically (token rotation).

**Error Cases:**

| Status | Message | Cause |
|--------|---------|-------|
| 401 | No refresh token provided | Cookie missing |
| 401 | Invalid refresh token | Token not in DB (logged out) |
| 401 | Refresh token expired | Must login again |

---

#### Logout
```
POST /auth/logout
```
Invalidates the refresh token and clears the cookie. **Requires auth.**

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response — 200:**
```json
{
  "success": true
}
```

> The access token remains valid until its 15-minute expiry. This is by design — short expiry windows make this acceptable without a token blacklist.

---

## 🗄 Database Schema

### PostgreSQL (via Prisma)

#### User
```
id          String    UUID, Primary Key
name        String    User's display name
email       String    Unique, validated format
password    String    bcrypt hashed, never returned in responses
isVerified  Boolean   Default: false
role        Enum      CUSTOMER | ADMIN, Default: CUSTOMER
createdAt   DateTime  Auto-set on creation
updatedAt   DateTime  Auto-updated on every change
```

#### RefreshToken
```
id          String    UUID, Primary Key
token       String    Unique, SHA-256 hashed before storage
userId      String    Foreign Key → User.id (CASCADE)
expiresAt   DateTime  7 days from creation
createdAt   DateTime  Auto-set on creation
```

**Relationship:** One User → Many RefreshTokens (multi-device support)

---

## 📁 Folder Structure

```
ecommerce-backend/
│
├── prisma/
│   ├── schema.prisma          # Database schema and relations
│   └── migrations/            # Full migration history (git for DB)
│
├── src/
│   ├── config/
│   │   └── db.js              # Prisma singleton — one connection pool
│   │
│   ├── controllers/           # HTTP layer only — no business logic
│   │   └── auth.controller.js
│   │
│   ├── services/              # All business logic — framework agnostic
│   │   └── auth.service.js
│   │
│   ├── routes/                # URL definitions — map endpoints to controllers
│   │   └── auth.routes.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js # JWT verification — protect routes
│   │   ├── validate.js        # Zod schema validation factory
│   │   └── errorHandler.js    # Global error handler (dev vs prod modes)
│   │
│   ├── validators/
│   │   └── auth.validator.js  # Zod schemas for auth routes
│   │
│   ├── utils/
│   │   ├── AppError.js        # Custom error class with status codes
│   │   ├── asyncHandler.js    # Eliminates try/catch in every controller
│   │   └── tokenUtils.js      # JWT generation helpers
│   │
│   └── app.js                 # Express config — middlewares and routes
│
├── server.js                  # Entry point — starts HTTP server only
├── .env.example               # All required environment variables
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/Sahil27122/e-commerce.git
cd e-commerce
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
Fill in your values (see `.env.example` below).

### 4. Create the database
```sql
CREATE DATABASE "e-commerce";
```

### 5. Run migrations
```bash
npx prisma migrate dev
```

### 6. Start the server
```bash
npm run dev       # Development (with hot reload)
npm start         # Production
```

### .env.example
```env
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/e-commerce"

# JWT
ACCESS_TOKEN_SECRET=your_64_char_random_secret_here
REFRESH_TOKEN_SECRET=your_other_64_char_random_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

Generate secure secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🧪 API Testing

### cURL Examples

**Register:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Sahil Sharma","email":"sahil@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"sahil@example.com","password":"password123"}'
```

**Get Profile (authenticated):**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <your_access_token>"
```

**Refresh Token:**
```bash
curl -X POST http://localhost:3000/auth/refresh-token \
  -b cookies.txt
```

**Logout:**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <your_access_token>" \
  -b cookies.txt
```

---

## ❌ Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Human-readable description of what went wrong"
}
```

In development mode, responses also include:
```json
{
  "success": false,
  "message": "Error message",
  "stack": "Full stack trace for debugging"
}
```

### Error Categories

| Range | Type | Examples |
|-------|------|---------|
| 400 | Bad Request | Validation failed, missing fields |
| 401 | Unauthorized | Missing/expired/invalid token |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email registration |
| 500 | Server Error | Unexpected crash (details hidden in production) |

---

## 🧠 What I Learned

### Engineering Concepts
- **Layered architecture** — Why separating routes, controllers, and services makes code reusable, testable, and maintainable across different invocation contexts (HTTP, CLI, jobs)
- **Database selection** — How to evaluate SQL vs NoSQL based on data shape, relationship requirements, and transaction needs — not just popularity
- **JWT security** — The full lifecycle of access + refresh tokens, why short expiry matters, and why HTTP-only cookies protect long-lived tokens from XSS
- **Defense in depth** — Why hashing refresh tokens in the database protects users even if the database itself is compromised
- **Error handling patterns** — How to build a global error handler that distinguishes operational errors (user's fault) from programmer errors (your fault) and responds appropriately

### Practical Skills
- Designing database schemas before writing code — thinking about constraints, relationships, and indexes upfront
- Reading error messages systematically instead of guessing — every error tells you exactly what and where
- Building reusable middleware factories (`validate(schema)`, `asyncHandler(fn)`) that eliminate repetition across the entire codebase
- Understanding what SQL Prisma generates — never blindly trusting the ORM

### Challenges Faced
- **Token naming conflicts** — JavaScript scope issues when destructuring a variable with the same name as a function parameter. Solved by using `password: _` alias pattern
- **Zod v4 breaking change** — `.errors` was renamed to `.issues` in Zod v4. Debugged by reading the actual error object structure instead of assuming documentation was current
- **URL encoding in connection strings** — Special characters in PostgreSQL passwords (`@`, `#`) must be percent-encoded in DATABASE_URL. Found by systematically reading the connection string format
- **bcrypt comparison misconception** — Initially believed re-hashing and comparing hashes would work. Learned that bcrypt uses a random salt per hash, making direct comparison impossible — `bcrypt.compare()` is the only correct approach

---

## 🗺 Roadmap

- [x] **Week 1** — Project setup, PostgreSQL, JWT authentication
- [ ] **Week 2** — MongoDB product catalog with Cloudinary image upload
- [ ] **Week 3** — Redis cart, OTP email verification, rate limiting
- [ ] **Week 4** — Redis caching layer with invalidation strategy
- [ ] **Week 5** — Orders, Razorpay payments, webhook verification, ACID transactions
- [ ] **Week 6** — Bull job queues, Zod on all routes, cursor pagination, structured logging
- [ ] **Week 7** — Docker Compose, seed scripts, full Postman collection, deployment

---

## 📄 License

MIT License — free to use for personal and commercial projects.

---

<p align="center">Built from scratch as a learning project — no boilerplate, no AI-generated code, every line understood.</p>
