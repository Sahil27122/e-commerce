# 🛒 E-Commerce Backend API

A production-grade, scalable e-commerce REST API built with Node.js, Express, PostgreSQL, MongoDB, and Redis. Designed with clean architecture, security best practices, and real-world engineering decisions at its core.

> **Open Source for Frontend Developers** — This is a backend-only project. Frontend developers can build full-featured e-commerce applications on top of this API without worrying about backend complexity.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Design Decisions](#-architecture--design-decisions)
- [Project Structure](#-project-structure)
- [API Overview](#-api-overview)
- [Authentication Flow](#-authentication-flow)
- [API Reference](#-api-reference)
  - [Auth Module](#auth-module)
  - [Product Module](#product-module)
  - [Category Module](#category-module)
- [Function & Middleware Reference](#-function--middleware-reference)
- [Database Schema](#-database-schema)
- [Pagination & Filtering](#-pagination--filtering)
- [Error Handling](#-error-handling)
- [Setup Instructions](#️-setup-instructions)
- [API Testing](#-api-testing)
- [What I Learned](#-what-i-learned)
- [Contributing](#-contributing)

---

## 📌 Project Overview

### What it does
A complete backend system for an e-commerce platform — handling user authentication, product catalog with category hierarchy, image uploads, shopping cart, orders, payments, and background jobs.

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
- Role-based access control (`CUSTOMER` | `ADMIN`)

### Product Catalog
- **Flexible product attributes** — key-value pair system handles any product type (phones have RAM/storage, clothing has size/color)
- **Hierarchical category system** — self-referencing categories with parent-child relationships
- **Materialized path pattern** — `categoryPath` array enables filtering by parent category without recursive queries at read time
- **Dynamic filter endpoint** — aggregation pipeline extracts unique attribute values per category for frontend filter UI
- **Cloudinary image upload** — products and categories with CDN-delivered images
- **Slug auto-generation** — URL-friendly identifiers from product/category names, applied consistently via a shared utility
- **Soft delete** — categories blocked from deletion if active products exist; products hidden via `isActive` flag
- **Faker.js seed script** — generates realistic demo data across all categories with one command

### Architecture
- Clean **Route → Controller → Service** separation
- Global error handling with `AppError` class (operational vs programmer errors)
- `asyncHandler` wrapper — zero try/catch repetition across controllers
- **Zod** schema validation as reusable middleware
- Environment-aware error responses (full stack trace in dev, safe messages in prod)

### Data Layer
- **Polyglot persistence** — PostgreSQL for relational data, MongoDB for flexible documents
- **Prisma ORM** with full migration history
- **Mongoose** for MongoDB schema enforcement
- **Compound indexes** on frequently queried field combinations
- Database-level constraints (UNIQUE, FOREIGN KEY, NOT NULL)

### Developer Experience
- `.env.example` with all required variables
- Faker.js seed script for realistic demo data
- Consistent response envelope across every endpoint

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js + Express.js | HTTP server and routing |
| Primary DB | PostgreSQL + Prisma ORM | Users, refresh tokens (relational, ACID) |
| Document DB | MongoDB + Mongoose | Product catalog, categories (flexible schema) |
| Authentication | JWT + bcrypt | Stateless auth with secure password storage |
| Validation | Zod | Runtime schema validation |
| File Upload | Multer + Cloudinary | Image handling and CDN delivery |
| Fake Data | @faker-js/faker | Realistic seed data generation |

---

## 🏗 Architecture & Design Decisions

### Project Structure Philosophy
The project follows a **layered MVC architecture** where each layer has a single, well-defined responsibility:

```
Route       → URL definition only. No logic.
Controller  → HTTP coordination only. Calls service, returns response.
Service     → All business logic. No knowledge of HTTP.
Model       → Data schema and DB interaction.
Middleware  → Cross-cutting concerns (auth, validation, role checks).
```

This separation means business logic is fully reusable — callable from REST routes, background jobs, CLI scripts, or tests without any HTTP dependency.

### Key Engineering Decisions

**Why JWT over Sessions?**
Sessions require server-side state and a shared session store across instances — a scalability problem. JWTs are stateless and verifiable by any server instance using the shared secret.

**Why Access Token + Refresh Token?**
A single long-lived token can't be revoked if stolen. Short-lived access tokens (15 min) limit the damage window. Refresh tokens (7 days) are stored in the database, making them revocable — logout actually works.

**Why store Refresh Tokens hashed?**
If the database is compromised, plain-text refresh tokens give attackers 7-day session access for every user. SHA-256 hashed tokens are useless without the originals.

**Why HTTP-only cookies for Refresh Tokens?**
`localStorage` is readable by any JavaScript on the page — XSS attacks can steal tokens. HTTP-only cookies are invisible to JavaScript; only the browser sends them.

**Why PostgreSQL for users, MongoDB for products?**
Users and refresh tokens have strict relational structure and benefit from ACID transactions. Products have variable attributes (a phone has RAM, a shirt has size) — MongoDB's flexible document model handles this naturally without sparse columns or complex joins.

**Why key-value pairs for product attributes instead of a mixed object?**
A free-form `Mixed` type in Mongoose can't be indexed, can't be queried by a specific attribute, and gives no structure for building a frontend filter UI. A key-value array `[{ key: "ram", value: "8GB" }]` is indexable, queryable with `$elemMatch`, and enables dynamic filter generation via aggregation.

**Why materialized path for category hierarchy?**
Filtering products by a parent category (e.g. "Electronics") requires knowing every descendant category ID ("Phones", "Laptops", ...). Recursive lookups at read time are slow. Instead, each product stores its full ancestor chain (`categoryPath`) at write time, so filtering by any ancestor is a single indexed `$in` query — no recursion needed on every request.

**Why soft delete instead of hard delete?**
Hard deleting a category that has historical products would break referential integrity and orphan data. Soft delete (`isActive: false`) preserves history while hiding records from public responses. Category deletion additionally checks for active products first and blocks deletion rather than cascading — preventing accidental mass data loss.

**Why explicit slug generation instead of a Mongoose pre-save hook?**
Mongoose's `pre('save')` hook only fires on `.save()`, not on `findByIdAndUpdate()` — which this project uses for all updates. Relying on the hook silently fails to regenerate slugs on update. Calling a shared `slugify()` utility explicitly in both `createProduct`/`createCategory` and `updateProduct`/`updateCategory` removes this hidden inconsistency.

---

## 📁 Project Structure

```
ecommerce-backend/
│
├── prisma/
│   ├── schema.prisma              # PostgreSQL schema — User, RefreshToken
│   └── migrations/                # Full migration history
│
├── src/
│   ├── config/
│   │   ├── prisma.js              # Prisma singleton — one connection pool
│   │   ├── mongoose.js            # MongoDB connection
│   │   └── cloudinary.js          # Cloudinary SDK configuration
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   └── category.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── product.service.js
│   │   └── category.service.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   └── category.routes.js
│   │
│   ├── models/
│   │   ├── product.model.js       # Product with key-value attributes
│   │   └── category.model.js      # Self-referencing category tree
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT verification — protect routes
│   │   ├── authorize.js           # Role-based access control
│   │   ├── upload.js              # Multer — memory storage for Cloudinary
│   │   ├── validate.js            # Zod schema validation factory
│   │   └── errorHandler.js        # Global error handler (dev vs prod modes)
│   │
│   ├── validators/
│   │   ├── auth.validator.js      # Zod schemas for auth routes
│   │   └── product.validator.js   # Zod schemas for product routes
│   │
│   ├── utils/
│   │   ├── AppError.js            # Custom error class with status codes
│   │   ├── asyncHandler.js        # Eliminates try/catch in every controller
│   │   ├── tokenUtils.js          # JWT generation helpers
│   │   └── slugify.js             # URL-friendly slug generation
│   │
│   ├── scripts/
│   │   └── seedProducts.js        # Faker.js seed — realistic demo products
│   │
│   └── app.js                     # Express config — middlewares and routes
│
├── server.js                      # Entry point — starts HTTP server only
├── .env.example                   # All required environment variables
└── README.md
```

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
       │                       │  Verify JWT            │
       │                       │  Fetch fresh user      │
       │                       │──────────────────────>│
       │  200 { user }         │                       │
       │<──────────────────────│                       │
       │                       │                       │
       │  [Access token expires after 15 minutes]      │
       │                       │                       │
       │  POST /auth/refresh-token (cookie sent auto)  │
       │──────────────────────>│                       │
       │                       │  Hash cookie token     │
       │                       │  Find in DB             │
       │                       │  Delete old token       │
       │                       │  Create new token       │
       │                       │──────────────────────>│
       │  New accessToken      │                       │
       │  New refreshToken cookie                      │
       │<──────────────────────│                       │
```

---

## 📖 API Reference

> **Format note:** Each endpoint lists its middleware chain in execution order, the exact internal flow inside the service layer, and every error case the route can return. This mirrors how the codebase actually executes a request, not just the happy path.

### Auth Module

#### POST `/auth/register`

**Purpose:** Create a new, unverified user account.

| Field | Details |
|---|---|
| **Method** | `POST` |
| **Auth Required** | No |
| **Middleware Chain** | `validate(registerSchema)` → `register` |

**Request Body:**
```json
{
  "name": "Sahil Sharma",
  "email": "sahil@example.com",
  "password": "securepassword123"
}
```

**Success Response (201):**
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

**Error Responses:**

| Status | Message | Cause |
|---|---|---|
| 400 | Name must be at least 2 characters | Zod validation failed |
| 400 | Invalid email format | Zod validation failed |
| 400 | Password must be at least 8 characters | Zod validation failed |
| 409 | Email already registered | Duplicate email |

**Internal Flow:**
1. `validate(registerSchema)` middleware runs `schema.safeParse(req.body)` — on failure, throws `AppError` with the first Zod issue message and a `400` status before the controller ever runs
2. Controller extracts `{ name, email, password }` from `req.body` and calls `authService.register()`
3. `auth.service.register()`:
   - Checks for an existing user via `prisma.user.findUnique({ where: { email } })`
   - If found → throws `AppError('Email already registered', 409)`
   - Hashes the password with `bcrypt.hash(password, 10)`
   - Creates the user via `prisma.user.create()` with the hashed password
   - Destructures the result to strip `password` before returning (`const { password: _, ...userWithoutPassword } = user`)
4. Controller responds `201` with the sanitized user object

---

#### POST `/auth/login`

**Purpose:** Authenticate a user and issue access + refresh tokens.

| Field | Details |
|---|---|
| **Method** | `POST` |
| **Auth Required** | No |
| **Middleware Chain** | `validate(loginSchema)` → `login` |

**Request Body:**
```json
{
  "email": "sahil@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
> The refresh token is **not** returned in the body. It is set as an HTTP-only cookie named `refreshToken`.

**Error Responses:**

| Status | Message | Cause |
|---|---|---|
| 400 | Invalid email format | Zod validation failed |
| 401 | Invalid credentials | Email not found **or** wrong password — deliberately identical message to prevent user enumeration |

**Internal Flow:**
1. Controller extracts `{ email, password }`, calls `authService.login()`
2. `auth.service.login()`:
   - Looks up the user by email; if absent → `AppError('Invalid credentials', 401)`
   - Compares password with `bcrypt.compare(password, user.password)` (never re-hashes and compares directly — bcrypt salts are random per hash)
   - If mismatch → same `AppError('Invalid credentials', 401)`
   - Generates `accessToken` via `generateAccessToken(user.id, user.role)` — payload carries only `userId` and `role`, **never** email or name, so the token can't go stale if profile fields change
   - Generates a raw `refreshToken` via `generateRefreshToken(user.id)`, SHA-256 hashes it, and stores the **hash** (not the raw token) in the `RefreshToken` table with a 7-day `expiresAt`
   - Returns `{ accessToken, refreshToken: <raw token> }` to the controller
3. Controller sets the raw refresh token as an `httpOnly`, `sameSite: strict` cookie, and returns only the `accessToken` in the JSON body

---

#### GET `/auth/me`

**Purpose:** Return the authenticated user's current profile.

| Field | Details |
|---|---|
| **Method** | `GET` |
| **Auth Required** | Yes |
| **Middleware Chain** | `protect` → `me` |

**Success Response (200):**
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

**Error Responses:**

| Status | Message | Cause |
|---|---|---|
| 401 | No token provided | Missing or malformed `Authorization` header |
| 401 | jwt malformed | Token isn't a valid JWT structure |
| 401 | jwt expired | Access token past its 15-minute expiry |

**Internal Flow:**
1. `protect` middleware verifies the JWT (see [Function Reference](#protect--srcmiddlewaresauthmiddlewarejs)) and attaches the decoded payload to `req.user`
2. Controller calls `authService.getMe(req.user.userId)` rather than trusting the JWT payload for display data
3. Service re-fetches the user **fresh from PostgreSQL** with `prisma.user.findUnique()` and an explicit `select` — guarantees the response always reflects the current name/role/verification status, not a snapshot from token-issue time

---

#### POST `/auth/refresh-token`

**Purpose:** Exchange a valid refresh token cookie for a new access token, rotating the refresh token in the process.

| Field | Details |
|---|---|
| **Method** | `POST` |
| **Auth Required** | No `protect` — deliberately. A client calling this endpoint already has an **expired** access token, so requiring a valid one would create a deadlock |
| **Middleware Chain** | `refresh` (controller reads the cookie directly) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
> A new `refreshToken` cookie is set automatically (rotation).

**Error Responses:**

| Status | Message | Cause |
|---|---|---|
| 401 | No refresh token provided | `refreshToken` cookie missing |
| 401 | Invalid refresh token | Hash not found in DB (already used, or user logged out) |
| 401 | Refresh token expired | Past the 7-day `expiresAt` |

**Internal Flow:**
1. Controller reads `req.cookies.refreshToken`; if absent, throws before calling the service
2. `auth.service.refreshAccessToken()`:
   - SHA-256 hashes the incoming raw token and looks it up via `prisma.refreshToken.findUnique()`
   - Not found → `AppError('Invalid refresh token', 401)`
   - Found but `expiresAt < new Date()` → `AppError('Refresh token expired', 401)`
   - Fetches the owning user to get a fresh `role` for the new access token
   - **Rotation:** deletes the matched token record, generates a brand-new refresh token, hashes it, and inserts a new record — the old token can never be reused even if intercepted
3. Controller sets the new refresh token as a cookie and returns only the new access token in the body

---

#### POST `/auth/logout`

**Purpose:** Revoke the current refresh token and clear the cookie.

| Field | Details |
|---|---|
| **Method** | `POST` |
| **Auth Required** | Yes |
| **Middleware Chain** | `protect` → `logout` |

**Success Response (200):**
```json
{ "success": true }
```

**Error Responses:**

| Status | Message | Cause |
|---|---|---|
| 401 | No refresh token provided | Cookie missing |
| 401 | Invalid token | Hash not found in DB |

**Internal Flow:**
1. `protect` confirms the caller holds a valid (not-yet-expired) access token
2. Controller reads `req.cookies.refreshToken`, hashes it, and calls `authService.logout()`
3. Service looks up the hash; if missing, throws — otherwise deletes the `RefreshToken` row
4. Controller calls `res.clearCookie('refreshToken')`
5. The **access token itself is not invalidated** — it remains technically valid until its 15-minute expiry. This is an accepted tradeoff: short expiry windows make a token blacklist unnecessary for this project's scale

---

### Product Module

#### POST `/products`

**Purpose:** Create a new product (Admin only).

| Field | Details |
|---|---|
| **Method** | `POST` |
| **Auth Required** | Yes (`Bearer <accessToken>`) |
| **Role Required** | `ADMIN` |
| **Middleware Chain** | `protect` → `authorize('ADMIN')` → `validate(createProductSchema)` → `createProduct` |

**Request Body:**
```json
{
  "name": "Apple iPhone 15 Pro",
  "description": "Latest iPhone with titanium design",
  "price": 134900,
  "quantity": 50,
  "category": "<category_id>",
  "attributes": [
    { "key": "ram", "value": "8GB" },
    { "key": "storage", "value": "256GB" },
    { "key": "battery", "value": "3274mAh" }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Apple iPhone 15 Pro",
    "slug": "apple-iphone-15-pro",
    "category": "<phones_id>",
    "categoryPath": ["<phones_id>", "<electronics_id>"],
    "attributes": [{ "key": "ram", "value": "8GB" }],
    "isActive": true
  }
}
```

**Error Responses:**

| Status | Message | Cause |
|---|---|---|
| 401 | No token provided | Missing `Authorization` header |
| 403 | Forbidden | Authenticated but role isn't `ADMIN` |
| 400 | Invalid category ID | `category` fails Zod's 24-char ObjectId-length check |

**Internal Flow:**
1. `protect` verifies the JWT → `authorize('ADMIN')` checks `req.user.role` against the allowed list, both **before** the request body is even parsed by Zod
2. `validate(createProductSchema)` coerces `price`/`quantity` to numbers and validates the category ID shape
3. Controller passes `req.body` straight to `productService.createProduct()`
4. `product.service.createProduct()`:
   - Generates the slug via the shared `slugify()` utility — never relies on a Mongoose hook (see [Architecture Decisions](#key-engineering-decisions))
   - Calls the internal `buildCategoryChain(category)` helper, which walks **up** the category tree (child → parent → grandparent) using a `while` loop until it hits a category with no `parent`, collecting every visited `_id` into `categoryPath`
   - Creates the document via `Product.create()` with the generated `slug` and `categoryPath` attached

---

#### GET `/products`

**Purpose:** List products with category, search, attribute, and price filtering, plus pagination.

| Field | Details |
|---|---|
| **Method** | `GET` |
| **Auth Required** | No (public) |
| **Middleware Chain** | `getProducts` (no auth/role middleware — public catalog browsing) |

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `category` | ObjectId string | — | Matches against `categoryPath`, so a parent category ID returns products from every descendant category too |
| `search` | string | — | Case-insensitive regex match on `name` |
| `attributeKey` + `attributeValue` | string | — | Must be used together; matches one entry inside the `attributes` array via `$elemMatch` |
| `minPrice` / `maxPrice` | number | — | Inclusive price range; non-numeric values are rejected with `400` before reaching MongoDB |
| `page` | number | 1 | Clamped to a minimum of 1 — prevents a negative `$skip` |
| `limit` | number | 10 | Capped at 50 server-side regardless of what's requested — prevents large-payload DoS |

**Example:** `GET /products?category=<phones_id>&minPrice=50000&maxPrice=150000&page=1&limit=20`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [ "...array of product documents, category populated with name + slug" ],
    "pagination": {
      "total": 23,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    }
  }
}
```

**Error Responses:**

| Status | Message | Cause |
|---|---|---|
| 400 | minPrice must be a number | `minPrice` isn't numeric |
| 400 | maxPrice must be a number | `maxPrice` isn't numeric |

**Internal Flow:**
1. Destructures all filters from `req.query` with defaults `page = 1, limit = 10`
2. Validates `minPrice`/`maxPrice` with `isNaN(Number(...))` **before** building any query object — failing fast avoids leaking a raw Mongoose `CastError` (which would expose internal stack traces) to the client
3. Builds the `query` object incrementally:
   - `isActive: true` always included
   - `category` → cast to `new mongoose.Types.ObjectId(category)` and matched with `categoryPath: { $in: [...] }`, which is what makes parent-category filtering work without recursive lookups
   - `search` → `{ name: { $regex: search, $options: 'i' } }`
   - `attributeKey` + `attributeValue` → `{ attributes: { $elemMatch: { key, value } } }`
   - price range → builds `query.price.$gte` / `.$lte` only for the bounds that were actually supplied
4. Computes `pageNum = Math.max(1, Number(page))` and `limitNum = Math.min(Number(limit), 50)`, then `skip = (pageNum - 1) * limitNum`
5. Runs the product fetch and the total count **in parallel** with `Promise.all([Product.find(query)..., Product.countDocuments(query)])` — halves the wait time versus sequential `await` calls since neither query depends on the other's result
6. Returns `products` alongside a `pagination` object built from `pageNum`/`limitNum`/`total`

---

#### GET `/products/filters`

**Purpose:** Return every unique attribute key and its possible values for a given category, so the frontend can render filter checkboxes without hardcoding anything.

| Field | Details |
|---|---|
| **Method** | `GET` |
| **Auth Required** | No (public) |
| **Middleware Chain** | `getProductFilters` — registered **before** `GET /products/:slug` in the router so Express doesn't mistake `filters` for a slug |

**Query Parameters:**

| Param | Required | Description |
|---|---|---|
| `category` | Yes | Must be a valid 24-char MongoDB ObjectId |

**Example:** `GET /products/filters?category=<phones_id>`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    { "key": "battery", "values": ["3274mAh", "4000mAh", "5400mAh"] },
    { "key": "ram", "values": ["4GB", "8GB", "12GB"] },
    { "key": "storage", "values": ["64GB", "128GB", "256GB", "512GB"] }
  ]
}
```

**Error Responses:**

| Status | Message | Cause |
|---|---|---|
| 400 | Category is required | `category` query param omitted — this endpoint is intentionally never global, since mixing attribute keys across unrelated categories (e.g. phone RAM with clothing size) would be meaningless to a frontend |
| 400 | Invalid category ID | `category` isn't a valid ObjectId — checked with `mongoose.Types.ObjectId.isValid()` **before** it's used in the aggregation, so an invalid string never reaches MongoDB as a raw query |

**Internal Flow:**
1. Validates `category` is present, then valid, in that order
2. Runs a MongoDB aggregation pipeline against the `Product` collection:
   - `$match` — `isActive: true` and `categoryPath: { $in: [categoryObjectId] }`
   - `$unwind: '$attributes'` — explodes each product's attribute array so every `{ key, value }` pair becomes its own pipeline document
   - `$group` — groups by `attributes.key`, collecting all values into a set with `$addToSet` (automatically deduplicates)
   - `$project` — reshapes `_id` (the grouped key) into a `key` field and drops `_id` from the output
   - `$sort: { key: 1 }` — alphabetical ordering for a predictable UI
3. Returns the aggregation result directly — no further transformation needed

---

#### GET `/products/:slug`

**Purpose:** Fetch a single product by its slug.

| Field | Details |
|---|---|
| **Method** | `GET` |
| **Auth Required** | No (public) |

**Success Response (200):**
```json
{
  "success": true,
  "data": { "...full product document, category populated" }
}
```

**Error Responses:**

| Status | Message | Cause |
|---|---|---|
| 404 | Product not found | No document matches the slug |

**Internal Flow:**
1. `Product.findOne({ slug }).populate('category', 'name slug')` — only `name` and `slug` are pulled from the referenced category to keep the payload lean
2. `null` result → `AppError('Product not found', 404)`

---

#### PUT `/products/:id`

**Purpose:** Update a product by its MongoDB `_id` (Admin only).

| Field | Details |
|---|---|
| **Method** | `PUT` |
| **Auth Required** | Yes |
| **Role Required** | `ADMIN` |
| **Middleware Chain** | `protect` → `authorize('ADMIN')` → `updateProduct` |

**Request Body (all fields optional):**
```json
{ "name": "Apple iPhone 15 Pro Max", "price": 159900 }
```

**Internal Flow:**
1. **Why `:id` and not `:slug`?** The slug is derived from `name`. If a request updates `name`, the slug the client used to reach this route would already be stale by the time the update lands — `_id` never changes, so it's the only safe identifier for a mutation
2. If `updateData.name` is present, the service regenerates `updateData.slug = slugify(updateData.name)` **before** calling Mongoose — `findByIdAndUpdate()` is query-level middleware and does **not** trigger the model's `pre('save')` hooks, so relying on a hook here would silently produce a stale slug
3. `Product.findByIdAndUpdate(id, updateData, { new: true })` — `{ new: true }` returns the document *after* the update instead of the pre-update snapshot
4. `null` result → `AppError('Product not found', 404)`

---

#### DELETE `/products/:id`

**Purpose:** Soft-delete a product (Admin only).

| Field | Details |
|---|---|
| **Method** | `DELETE` |
| **Auth Required** | Yes |
| **Role Required** | `ADMIN` |

**Success Response (200):**
```json
{ "success": true, "message": "Product deleted successfully" }
```

**Internal Flow:**
1. `Product.findByIdAndUpdate(id, { isActive: false })` — the document is never removed from MongoDB
2. Every public read query (`getProducts`, `getProductBySlug`, `getProductFilters`) filters on `isActive: true`, so the product disappears from the catalog without losing historical data (e.g. for past orders that reference it)

---

#### POST `/products/:id/images`

**Purpose:** Upload a product image to Cloudinary and append its URL to the product.

| Field | Details |
|---|---|
| **Method** | `POST` |
| **Auth Required** | Yes |
| **Role Required** | `ADMIN` |
| **Middleware Chain** | `protect` → `authorize('ADMIN')` → `upload.single('image')` → `uploadProductImage` |
| **Request Type** | `multipart/form-data`, field name `image`, max 5MB, images only |

**Error Responses:**

| Status | Message | Cause |
|---|---|---|
| 400 | No image provided | `req.file` undefined — no file in the form-data |
| 500 (via multer) | only images allowed | `fileFilter` rejected a non-`image/*` mimetype |
| 404 | Product not found | `id` doesn't match any product |

**Internal Flow:**
1. `upload.single('image')` (Multer, configured with `memoryStorage()`) buffers the file **in RAM** rather than writing a temp file to disk — avoids the read/write/cleanup cycle a disk-based approach would need, and works identically across multiple server instances since nothing is written locally
2. Controller checks `req.file` exists before calling the service
3. Service fetches the product by `id`; not found → `404`
4. Wraps Cloudinary's callback-based `uploader.upload_stream()` in a `new Promise()` so it can be `await`-ed like any other async call, streaming `req.file.buffer` directly into the `ecommerce/products` folder
5. Pushes the returned `secure_url` into `product.images[]` and calls `product.save()`

---

### Category Module

#### POST `/categories`

**Purpose:** Create a category, optionally as a child of an existing one (Admin only).

| Field | Details |
|---|---|
| **Method** | `POST` |
| **Auth Required** | Yes |
| **Role Required** | `ADMIN` |
| **Middleware Chain** | `protect` → `authorize('ADMIN')` → `createCategory` |

**Request Body:**
```json
{
  "name": "Phones",
  "description": "Smartphones and mobile phones",
  "parent": "<electronics_category_id>"
}
```
> `parent` is optional — omit it to create a top-level category.

**Internal Flow:**
1. Service generates `slug = slugify(name)`
2. `Category.create({ name, slug, description, parent, image })` — `parent` defaults to `null` in the schema if omitted, marking it top-level

---

#### GET `/categories`

**Purpose:** List categories, optionally filtered by parent.

| Field | Details |
|---|---|
| **Method** | `GET` |
| **Auth Required** | No (public) |

**Query Parameters:**

| Param | Value | Behavior |
|---|---|---|
| _(none)_ | — | Returns every active category |
| `parent` | `null` | Returns only top-level categories (`parent: null`) |
| `parent` | `<categoryId>` | Returns direct children of that category |

**Internal Flow:**
1. Builds `query = { isActive: true }`
2. If `filters.parent === 'null'` (string, since query params are always strings) → `query.parent = null`
3. Else if `filters.parent` is a truthy non-`'null'` string → `query.parent = filters.parent`
4. `Category.find(query).populate('parent', 'name slug')`

---

#### GET `/categories/:slug`

**Purpose:** Fetch a single category by slug, with its parent populated.

**Error Responses:**

| Status | Message | Cause |
|---|---|---|
| 404 | Category not found | No active category matches the slug |

---

#### PUT `/categories/:id`

**Purpose:** Update a category (Admin only). Same slug-regeneration logic as product updates — `slugify()` is called explicitly when `name` changes.

---

#### DELETE `/categories/:id`

**Purpose:** Soft-delete a category, but only if it has no active products (Admin only).

**Error Responses:**

| Status | Message | Cause |
|---|---|---|
| 400 | Cannot delete category with active products | `Product.countDocuments({ category: id, isActive: true })` returned `> 0` |
| 404 | Category not found | `id` doesn't match any category |

**Internal Flow:**
1. Counts active products referencing this category's `_id` directly
2. If any exist, the deletion is **blocked** rather than cascading — this was a deliberate design choice over two alternatives: silently doing nothing (leaves stale data visible) or cascading the soft-delete to every product (too easy to trigger by accident and wipe out an entire catalog section). Blocking forces the admin to consciously move or remove products first
3. If the count is zero, proceeds to `findByIdAndUpdate(id, { isActive: false })`

---

#### POST `/categories/:id/image`

**Purpose:** Upload/replace a category's image.

**Internal Flow:** Identical pattern to product image upload, except the category schema stores a single `image: String` rather than an array — so the service **assigns** `category.image = result.secure_url` instead of pushing to an array.

---

## 🧩 Function & Middleware Reference

> Only functions with non-trivial internal logic are documented here. Simple pass-through controllers are omitted.

### `slugify(text)`

| Detail | Value |
|---|---|
| **File** | `src/utils/slugify.js` |
| **Purpose** | Convert any string into a URL-safe, deduplicated, edge-trimmed slug |
| **Input** | `text` (String) — e.g. a product or category name |
| **Output** | String — lowercase, hyphenated slug |

**Internal Logic (in order):**
1. `.toLowerCase()`
2. `.trim()` — strips leading/trailing **whitespace** first
3. `.replace(/\s+/g, '-')` — collapses **one or more** consecutive spaces into a single hyphen (the `+` quantifier is what prevents `"a  b"` from becoming `"a--b"`)
4. `.replace(/[^\w-]+/g, '')` — strips any character that isn't a word character or hyphen (handles punctuation like `!`, `#`, `&`)
5. `.replace(/--+/g, '-')` — collapses any hyphens that ended up adjacent after step 4 removed characters between them
6. `.replace(/^-+|-+$/g, '')` — trims hyphens specifically from the start/end — necessary even after step 2's whitespace trim, because step 4 can introduce **new** edge hyphens by deleting a leading/trailing special character (e.g. `"#Phone"` becomes `"-Phone"` after steps 3/4, which the earlier whitespace trim never catches)

**Example:** `"  Apple   iPhone #15 Pro!!  "` → `"apple-iphone-15-pro"`

**Why it's a standalone utility and not a Mongoose hook:** `pre('save')` hooks don't fire on `findByIdAndUpdate()`, which every update endpoint in this project uses. Centralizing the logic here means both `create*` and `update*` service functions call the exact same implementation explicitly — no hidden, inconsistent behavior depending on which Mongoose method happens to be used.

---

### `buildCategoryChain(categoryId)` *(internal helper, not exported)*

| Detail | Value |
|---|---|
| **File** | `src/services/product.service.js` |
| **Purpose** | Walk a category's ancestry from itself up to the root, collecting every ID along the way |
| **Input** | `categoryId` — the product's direct category `_id` |
| **Output** | Array of ObjectIds, e.g. `[phonesId, electronicsId]` |

**Internal Logic:**
1. Fetches the starting category document
2. Loops with a `while (current)` condition — **not recursion**:
   - Pushes `current.id` onto the chain
   - If `current.parent` is falsy (top of the tree) → `break`
   - Otherwise fetches the parent document and continues the loop with it as the new `current`
3. Returns the accumulated chain once the loop exits

**Why `while` instead of recursion:** Recursive tree traversal uses the call stack — one frame per level. A corrupted dataset where a category's `parent` accidentally points back into its own ancestry would cause infinite recursion and a stack overflow that crashes the whole process. A `while` loop has no stack growth and can be bounded with an explicit safety counter if needed, failing gracefully instead of crashing.

**Why this exists at all:** Products store `category` (their direct category) **and** `categoryPath` (every ancestor). This is what lets `GET /products?category=<electronicsId>` return phones and laptops — products that don't belong to Electronics directly, but whose `categoryPath` includes it.

---

### `auth.service.register(name, email, password)`

| Detail | Value |
|---|---|
| **File** | `src/services/auth.service.js` |
| **Output** | User object without the `password` field |

**Internal Logic:**
1. `prisma.user.findUnique({ where: { email } })` — if a row exists, throws `AppError('Email already registered', 409)`
2. `bcrypt.hash(password, 10)` — 10 salt rounds, the standard balance between brute-force resistance and login latency
3. `prisma.user.create()` with the hashed password
4. `const { password: _, ...userWithoutPassword } = user` — destructures the password into a discarded `_` variable (a common JS convention for "I am intentionally ignoring this") because `password` was already a function parameter name and can't be redeclared with `const` in the same scope

---

### `auth.service.login(email, password)`

| Detail | Value |
|---|---|
| **File** | `src/services/auth.service.js` |
| **Output** | `{ accessToken, refreshToken }` |

**Internal Logic:**
1. Looks up the user; not found → `AppError('Invalid credentials', 401)`
2. `await bcrypt.compare(password, user.password)` — **never** re-hashes the input password and compares hashes directly, because bcrypt embeds a random salt in every hash it produces, so hashing the same password twice never yields the same output. `compare()` extracts the salt from the stored hash internally and reproduces the comparison correctly
3. Mismatch → the exact same `AppError('Invalid credentials', 401)` used for "email not found" — a deliberate choice to prevent **user enumeration**: if the two failure cases returned different messages, an attacker could use the API to discover which emails are registered
4. `generateAccessToken(user.id, user.role)` — payload is intentionally minimal (`userId`, `role` only); see [tokenUtils](#tokenutilsjs--generateaccesstoken--generaterefreshtoken)
5. `generateRefreshToken(user.id)` produces the raw token returned to the client; the service then SHA-256 hashes it and stores **only the hash** via `prisma.refreshToken.create()` with a 7-day `expiresAt` — if the database were ever breached, stolen hashes are useless without the original token

---

### `auth.service.refreshAccessToken(rawToken)`

| Detail | Value |
|---|---|
| **File** | `src/services/auth.service.js` |
| **Output** | `{ accessToken, refreshToken }` (a *new* pair) |

**Internal Logic:**
1. Hashes `rawToken` with SHA-256 and looks up the hash in `RefreshToken`
2. Not found → `AppError('Invalid refresh token', 401)` (covers both tampering and a token that's already been rotated/logged out)
3. `tokenRecord.expiresAt < new Date()` → `AppError('Refresh token expired', 401)`
4. Re-fetches the user to get a **current** `role` for the new access token (not trusted from anywhere else)
5. **Rotation, in order:** delete the old `RefreshToken` row → generate a new raw token → hash it → insert a new row. Deleting first means even if something fails immediately after, the compromised/used token can never be replayed
6. Returns the new pair; the controller sets the new refresh token as a cookie and returns only the new access token in the response body

---

### `auth.service.logout(rawToken)`

| Detail | Value |
|---|---|
| **File** | `src/services/auth.service.js` |

**Internal Logic:**
1. Hashes the incoming token, looks it up
2. Not found → `AppError('Invalid token', 401)` — this check happens **before** any delete call (an earlier version of this function called `delete()` before checking existence, which crashed on `null`)
3. Deletes the matching `RefreshToken` row — the access token is left to expire naturally rather than being explicitly blacklisted, an accepted tradeoff given its 15-minute lifetime

---

### `product.service.getProducts(filters)`

| Detail | Value |
|---|---|
| **File** | `src/services/product.service.js` |
| **Output** | `{ products, pagination }` |

**Internal Logic:**
1. Validates `minPrice`/`maxPrice` numeric-ness **before** touching the query object — letting an invalid value flow into `query.price.$gte = Number("abc")` would store `NaN`, which Mongoose rejects with an unfiltered `CastError` that leaks internal stack details to the client
2. Builds `query` conditionally — every filter (`category`, `search`, price range, `attributeKey`/`attributeValue`) is only added if actually supplied, so an empty query string returns the full active catalog
3. `category` is cast with `new mongoose.Types.ObjectId(category)` before being placed in `categoryPath: { $in: [...] }` — query params arrive as plain strings, and MongoDB will not match a string against a stored ObjectId without this explicit cast
4. `pageNum = Math.max(1, Number(page))` guards against `page=0` or negative values, which MongoDB's `$skip` rejects outright with a server error
5. `limitNum = Math.min(Number(limit), 50)` hard-caps the page size — without this, a request like `?limit=1000000` would force MongoDB to scan and serialize an unbounded result set, a trivial denial-of-service vector
6. `Promise.all([Product.find(...), Product.countDocuments(...)])` — runs the page fetch and the total count concurrently since neither depends on the other's result, roughly halving total latency versus two sequential `await`s

---

### `product.service.getProductFilters(filters)`

| Detail | Value |
|---|---|
| **File** | `src/services/product.service.js` |
| **Output** | `[{ key, values }]` |

**Internal Logic:**
1. Requires `category` — without it, attribute keys from unrelated categories (phone `ram` mixed with clothing `size`) would be returned together, which is meaningless for a frontend filter panel
2. Validates the ObjectId format with `mongoose.Types.ObjectId.isValid()` before constructing the aggregation — an invalid string passed straight to `new ObjectId()` throws an unguarded error
3. Aggregation pipeline:
   - `$match` — active products whose `categoryPath` contains the given category
   - `$unwind: '$attributes'` — turns a product with 5 attributes into 5 separate pipeline documents, each carrying one `{ key, value }` pair
   - `$group` — buckets by `attributes.key`, collecting every value into a set via `$addToSet` (deduplicates automatically, unlike `$push`)
   - `$project` — renames the grouped `_id` to `key` and removes the now-redundant `_id` field from the output
   - `$sort: { key: 1 }` — alphabetical, so the frontend gets a stable, predictable order

---

### `protect` — `src/middlewares/auth.middleware.js`

| Detail | Value |
|---|---|
| **Purpose** | Verify the access token and attach its payload to `req.user` |
| **Wrapped in** | `asyncHandler` — so a thrown `jwt.verify()` error (expired/malformed) flows to the global error handler instead of crashing the request unhandled |

**Internal Logic:**
1. Reads `req.headers.authorization`; missing or not prefixed with `"Bearer "` → `AppError('No token provided', 401)`
2. `authHeader.split(' ')[1]` — splitting `"Bearer <token>"` on the space character produces `["Bearer", "<token>"]`; index `1` is the token itself
3. `jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)` — throws `TokenExpiredError` or `JsonWebTokenError` on failure, both caught by the `asyncHandler` wrapper and forwarded to `errorHandler`
4. On success, `req.user = decoded` (contains `userId` and `role`) and calls `next()`

---

### `authorize(...roles)` — `src/middlewares/authorize.js`

| Detail | Value |
|---|---|
| **Purpose** | Higher-order function (middleware factory) that returns a role-checking middleware |
| **Input** | Any number of allowed role strings, e.g. `authorize('ADMIN')` or `authorize('ADMIN', 'MODERATOR')` |
| **Output** | An Express middleware function |

**Internal Logic:**
1. `(...roles) => (req, res, next) => { ... }` — the outer function captures `roles` in a closure; the inner function is what Express actually invokes per-request and still has access to `roles` even though the outer call already finished
2. `if (!roles.includes(req.user.role))` → `next(new AppError('Forbidden', 403))`
3. Otherwise `next()`
4. Always runs **after** `protect` in the middleware chain — `protect` is what populates `req.user` in the first place

---

### `validate(schema)` — `src/middlewares/validate.js`

| Detail | Value |
|---|---|
| **Purpose** | Middleware factory wrapping any Zod schema for use as route middleware |

**Internal Logic:**
1. `schema.safeParse(req.body)` — used instead of `.parse()` because `safeParse` never throws; it returns `{ success, data }` or `{ success: false, error }`, letting the middleware control exactly how validation failures are reported
2. On failure, `result.error.issues.map(e => e.message)` collects every Zod issue message, and only the **first** one is passed into `AppError(..., 400)` — keeps error responses simple rather than dumping a full validation report
3. On success, `req.body = result.data` — replaces the raw body with Zod's parsed/coerced version (e.g. `z.coerce.number()` outputs), so downstream code never has to re-validate or re-cast

---

### `asyncHandler(fn)` — `src/utils/asyncHandler.js`

| Detail | Value |
|---|---|
| **Purpose** | Eliminate repeated `try/catch` blocks in every async controller/middleware |

**Internal Logic:**
```js
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}
```
1. Takes a controller function `fn` and returns a **new** function with the exact `(req, res, next)` signature Express expects
2. `Promise.resolve(fn(...))` normalizes the call so that even a controller that throws synchronously is caught — wrapping a non-promise value in `Promise.resolve()` still produces a promise whose `.catch()` is reachable
3. `.catch(next)` forwards any rejection straight to Express's `next()`, which routes it to `errorHandler` — without this wrapper, every controller would need its own `try { } catch (err) { next(err) }` block

---

### `errorHandler(err, req, res, next)` — `src/middlewares/errorHandler.js`

| Detail | Value |
|---|---|
| **Purpose** | Single, centralized place where every error in the app — operational or not — becomes an HTTP response |
| **Registration** | Mounted **last** in `app.js`, after every route — Express only routes to an error-handling middleware (recognized by its 4-argument signature) when something upstream calls `next(err)` |

**Internal Logic:**
1. `statusCode = err.statusCode || 500` — defaults to `500` for errors that didn't originate from `AppError` (i.e. unexpected bugs)
2. In `development`: always returns the real `err.message` plus `err.stack` — full visibility while debugging locally
3. In `production`: returns `err.message` **only if** `err.isOperational === true` (i.e. it came from `AppError`); otherwise returns a generic `"Something went wrong"` — prevents leaking internal implementation details (file paths, library names, query structure) to real users or attackers probing the API

---

### `AppError` — `src/utils/AppError.js`

| Detail | Value |
|---|---|
| **Purpose** | A custom `Error` subclass that carries an HTTP status code and an "expected error" flag |

**Internal Logic:**
```js
class AppError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = true
    }
}
```
- `super(message)` — delegates to the built-in `Error` constructor so `.message` and `.stack` still behave normally
- `isOperational = true` is the flag `errorHandler` checks to distinguish "a user did something the API anticipated" (wrong password, duplicate email, missing field) from "something broke that nobody anticipated" (a bug, a DB outage) — only the former is ever shown to the client in production

---

### `tokenUtils.js` — `generateAccessToken` / `generateRefreshToken`

| Detail | Value |
|---|---|
| **File** | `src/utils/tokenUtils.js` |

**Internal Logic:**
```js
const generateAccessToken = (userId, role) =>
    jwt.sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY })

const generateRefreshToken = (userId) =>
    jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY })
```
- The access token payload intentionally carries `role` (accepted tradeoff: a 15-minute window where a demoted admin could still act as one, in exchange for not hitting the DB on every single request just to check permissions)
- The refresh token payload carries **only** `userId` — its sole purpose is minting new access tokens, so it doesn't need `role` at all
- Each uses a **separate secret** (`ACCESS_TOKEN_SECRET` vs `REFRESH_TOKEN_SECRET`) — a leaked access-token secret can't be used to forge refresh tokens, and vice versa

---

### `seedProducts.js` — `src/scripts/seedProducts.js`

| Detail | Value |
|---|---|
| **Purpose** | Populate MongoDB with realistic demo products across every existing category, in one command |
| **Run with** | `npm run seed` |

**Internal Logic:**
1. Connects to MongoDB directly (`mongoose.connect()`) — this script runs **outside** Express entirely; it has no HTTP context, so it talks to Mongoose models directly rather than going through the service layer (which expects `req`-shaped data and is optimized for one document at a time, not bulk inserts)
2. Fetches all active categories and builds a `slug → document` lookup map
3. `generateAttributes(categoryType)` returns a different realistic attribute set per category slug (phones get `ram`/`storage`/`battery`/`screenSize`/`camera`; laptops get `processor`/`ram`/`storage`/`screenSize`/`graphics`; clothing gets `size`/`material`/`fit`/`gender`; books get `author`/`language`/`pages`/`genre`; anything else falls back to a generic `color` attribute)
4. For each entry in a hardcoded `PRODUCT_TYPES` list (category slug + desired count), builds each product's `categoryPath` from the category's stored `parent` field — this mirrors `buildCategoryChain()` from the service layer, but without an extra DB round-trip per product, since the category documents are already loaded into memory
5. Deletes any previously-seeded data first via `Product.deleteMany({ isSeeded: true })`, then inserts the new batch with `Product.insertMany()` — bulk insert is significantly faster than calling `createProduct()` in a loop, since it's a single round-trip to MongoDB instead of one per document
6. Every seeded document is flagged `isSeeded: true`, which is what makes step 5 possible without ever touching real, manually-created products (which default to `isSeeded: false`)
7. Disconnects and calls `process.exit(0)` on success, or logs the error and exits with code `1` on failure — standard practice for CLI scripts so they can be chained in CI/automation and their exit code reflects success/failure

---

## 🗄 Database Schema

### PostgreSQL (via Prisma)

#### User
```
id          String    UUID, Primary Key
name        String    User's display name
email       String    Unique
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
userId      String    Foreign Key -> User.id
expiresAt   DateTime  7 days from creation
createdAt   DateTime  Auto-set on creation
```
**Relationship:** One User → Many RefreshTokens (multi-device support). Foreign key uses `ON DELETE RESTRICT` — a user with active refresh tokens can't be deleted until those tokens are removed first.

### MongoDB (via Mongoose)

#### Product
```
name          String      Required
slug          String      Unique, generated via slugify()
description   String      Required
price         Number      Required
quantity      Number      Default: 0
images        [String]    Cloudinary URLs
category      ObjectId    Reference -> Category (direct parent only)
categoryPath  [ObjectId]  Full ancestry chain - enables parent-category filtering
attributes    [{key, value}]  Flexible key-value pairs, indexed on both fields
isActive      Boolean     Default: true (soft delete)
isSeeded      Boolean     Default: false (distinguishes seed script data from real data)
```
**Indexes:** `{ isActive: 1, category: 1, price: 1 }` compound index covers the most common query shape in one pass; `{ 'attributes.key': 1, 'attributes.value': 1 }` supports attribute filtering.

#### Category
```
name        String      Required
slug        String      Unique, generated via slugify()
description String      Optional
image       String      Cloudinary URL, optional
parent      ObjectId    Self-reference -> Category (null for top-level)
isActive    Boolean     Default: true
```
**Relationship:** Self-referencing — a category's `parent` points to another document in the *same* collection, which is what allows arbitrarily nested categories without a separate "Category Tree" model.

---

## 🔍 Pagination & Filtering

All list endpoints follow a consistent pattern:

```
GET /products?page=2&limit=20&category=<id>&minPrice=10000&maxPrice=80000&search=iphone
```

Responses always include a `pagination` object:
```json
{
  "pagination": {
    "total": 85,
    "page": 2,
    "limit": 20,
    "totalPages": 5
  }
}
```

**Built-in protections** (see [`getProducts` internal logic](#productservicegetproductsfilters) for exactly where each is applied):
- `page` minimum is 1 — negative/zero pages rejected before reaching MongoDB
- `limit` maximum is 50 — prevents large-payload denial-of-service requests
- Non-numeric `minPrice`/`maxPrice` returns `400` with a clear message instead of a raw Mongoose `CastError`
- Invalid category ObjectId format returns `400` before it's used in any query

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

| Status | Type | Examples |
|--------|------|---------|
| 400 | Bad Request | Validation failed, invalid ObjectId format, non-numeric price |
| 401 | Unauthorized | Missing/expired/invalid token, missing/invalid refresh token |
| 403 | Forbidden | Authenticated but not `ADMIN` |
| 404 | Not Found | Product, category, or user doesn't exist |
| 409 | Conflict | Duplicate email registration |
| 500 | Server Error | Unexpected crash — details hidden in production |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- MongoDB 6+
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

### 4. Create the PostgreSQL database
```sql
CREATE DATABASE "e-commerce";
```

### 5. Run Prisma migrations
```bash
npx prisma migrate dev
```

### 6. Seed the database (optional)
```bash
npm run seed
```

### 7. Start the server
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

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT
ACCESS_TOKEN_SECRET=your_64_char_random_secret_here
REFRESH_TOKEN_SECRET=your_other_64_char_random_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Generate secure secrets:
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

**Get Products with filters:**
```bash
curl "http://localhost:3000/products?category=<id>&minPrice=50000&maxPrice=150000&page=1"
```

**Get Dynamic Filters:**
```bash
curl "http://localhost:3000/products/filters?category=<phones_id>"
```

**Create Product (Admin):**
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name":"Samsung S24","description":"Flagship phone","price":79999,"quantity":30,"category":"<id>","attributes":[{"key":"ram","value":"8GB"}]}'
```

**Upload Product Image:**
```bash
curl -X POST http://localhost:3000/products/<id>/images \
  -H "Authorization: Bearer <admin_token>" \
  -F "image=@/path/to/image.jpg"
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

## 🧠 What I Learned

### Week 1 — Auth & PostgreSQL

**Engineering Concepts:**
- **Layered architecture** — Why separating routes, controllers, and services makes code reusable across HTTP, CLI, and background jobs
- **JWT security** — The full lifecycle of access + refresh tokens, why short expiry matters, and why HTTP-only cookies protect against XSS
- **Defense in depth** — Why hashing refresh tokens protects users even if the database is compromised
- **Error handling patterns** — Distinguishing operational errors (user's fault) from programmer errors (your fault)

**Challenges Faced:**
- **Token naming conflicts** — Destructuring a variable with the same name as a function parameter. Solved with a `password: _` alias pattern
- **Zod v4 breaking change** — `.errors` renamed to `.issues`. Debugged by reading the actual error object structure
- **URL encoding in connection strings** — Special characters in PostgreSQL passwords must be percent-encoded
- **bcrypt comparison misconception** — bcrypt uses a random salt per hash, making re-hashing impossible — `bcrypt.compare()` is the only correct approach

### Week 2 — MongoDB Product Catalog

**Engineering Concepts:**
- **SQL vs NoSQL tradeoffs** — Evaluated based on data shape and relationships, not popularity. Products have variable attributes that would require sparse columns or an EAV pattern in SQL
- **Materialized path pattern** — Storing the full category ancestry chain on each product enables parent-category filtering with a single `$in` query instead of recursive lookups
- **MongoDB aggregation pipeline** — Used `$unwind`, `$group`, `$addToSet` to build a dynamic filter endpoint that extracts unique attribute values per category
- **Compound indexes** — Indexing `{ isActive, category, price }` together covers the most common query pattern rather than three separate indexes
- **Denormalization tradeoffs** — `categoryPath` costs extra write complexity but makes reads extremely fast — the right tradeoff for e-commerce, where reads vastly outnumber writes
- **Input validation as security** — An uncapped `limit` enables DoS attacks, a negative `page` crashes MongoDB's `$skip`, and an unvalidated ObjectId exposes raw `CastError` internals

**Challenges Faced:**
- **Pre-hook inconsistency** — Mongoose's `pre('save')` hook doesn't fire on `findByIdAndUpdate()`. Discovered when updating a product's name didn't regenerate its slug. Solved by extracting slug generation into a shared `slugify()` utility called explicitly in both create and update service functions
- **Parent category filtering gap** — `GET /products?category=electronicsId` returned an empty array because products belong directly to "Phones," not "Electronics." Solved by introducing `categoryPath` — an array storing the full ancestry chain so any ancestor ID matches
- **Multer/Express 5 incompatibility** — A multer release candidate broke `memoryStorage` under Express 5 with an "Unexpected end of form" error. Solved by pinning to the LTS release
- **ObjectId vs string comparison** — Query params arrive as strings, but MongoDB stores ObjectIds. `$in: [category]` never matched until explicitly wrapping with `new mongoose.Types.ObjectId(category)`
- **Mongoose 7+ async hook syntax** — Pre-save hooks require an `async function()` with no `next` parameter; the older callback style produced a confusing "next is not a function" error

---

## 🤝 Contributing

This is an open learning project. Frontend developers are welcome to build on top of this API. If you find a bug or want to suggest an improvement, feel free to open an issue or pull request.

---

## 📄 License

MIT License — free to use for personal and commercial projects.

---

<p align="center">Built from scratch as a learning project — no boilerplate, no AI-generated code, every line understood.</p>
