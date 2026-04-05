# 💰 Finance Data Processing Backend API

A RESTful API for managing financial records with role-based access control, dashboard analytics, and JWT authentication.

## 📌 Project Overview

This backend powers a finance dashboard where different users interact with financial records based on their roles. Built with Node.js, Express, and MongoDB.

## 🚀 Features

- 👥 User & Role Management (Viewer, Analyst, Admin)
- 💸 Financial Records CRUD with filtering & pagination
- 📊 Dashboard Analytics using MongoDB aggregation
- 🔐 Role-Based Access Control (RBAC)
- ✅ Input Validation & Error Handling
- 🔑 JWT Authentication with Refresh Tokens
- 🛡️ Rate Limiting & Security Headers

## 🏗️ Architecture

```
Client
  │
Routes (auth | users | transactions | dashboard)
  │
Middleware (Auth | RoleCheck | Validation | RateLimit)
  │
Controllers (Request parsing, Response formatting)
  │
Services (Business logic, Aggregations)
  │
Models (User | Transaction | RefreshToken)
  │
MongoDB
```

## 📂 Project Structure

```
finance-backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   └── RefreshToken.js
│   ├── services/
│   │   ├── userService.js
│   │   ├── transactionService.js
│   │   └── dashboardService.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── transactionController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── roleCheck.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── transactionRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/
│   │   └── helpers.js
│   └── app.js
├── .env.example
├── package.json
└── README.md
```

## ⚡ Quick Start

**Prerequisites:** Node.js v18+, MongoDB (local or Atlas)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

## 🔧 Environment Variables

| Variable | Description | Default |
|---|---|---|
| PORT | Server port | 3000 |
| MONGODB_URI | MongoDB connection string | Required |
| JWT_SECRET | JWT signing secret | Required |
| JWT_REFRESH_SECRET | Refresh token secret | Required |
| JWT_EXPIRES_IN | Access token expiry | 15m |
| JWT_REFRESH_EXPIRES_IN | Refresh token expiry | 7d |
| BCRYPT_ROUNDS | Password hashing rounds | 10 |
| NODE_ENV | Environment | development |

## API Documentation

## API Testing
  👉 Full Postman collection with real responses:

  🔗 [View Postman Collection](https://abhishek-3585218.postman.co/workspace/Zorvyn~d043c0d8-ed27-401e-a762-b44d3f85fc07/collection/45090748-6bea6136-2e64-4f75-a2b7-911c903aa502?action=share&creator=45090748&active-environment=45090748-e7b6e84a-6ef6-477c-86ef-51be5f99179d)

  ✔ Covers:

  - Authentication
  - Transactions
  - Dashboard
  -  User management
  -  Error cases

### 🔐 Authentication APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login | Public |
| POST | /api/auth/refresh | Refresh access token | Public |
| POST | /api/auth/logout | Logout | Authenticated |
| GET | /api/auth/me | Get current user | Authenticated |

### 💸 Transactions APIs

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | /api/transactions | List with filters | Viewer+ |
| GET | /api/transactions/:id | Get by ID | Viewer+ |
| POST | /api/transactions | Create | Analyst+ |
| PUT | /api/transactions/:id | Update | Analyst+ |
| DELETE | /api/transactions/:id | Delete | Analyst+ |
| POST | /api/transactions/bulk-delete | Bulk delete | Analyst+ |
| GET | /api/transactions/stats/summary | Statistics | Analyst+ |

### 📊 Dashboard APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/dashboard/summary | Income, expenses, net balance |
| GET | /api/dashboard/categories | Category-wise breakdown |
| GET | /api/dashboard/trends | Monthly trends (last 6 months) |
| GET | /api/dashboard/recent | Last 10 transactions |
| GET | /api/dashboard/full | All dashboard data in one request |

### User Management (Admin Only)

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/users | List all users |
| GET | /api/users/:id | Get user by ID |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |

## 👑 Role-Based Access Control

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| View transactions | ✅ | ✅ | ✅ |
| View dashboard | ✅ | ✅ | ✅ |
| Create / Update / Delete transaction | ❌ | ✅ | ✅ |
| Bulk operations | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

## API Examples

**Register**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secure123","name":"John Doe","role":"viewer"}'
```

**Create Transaction**
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":1500,"type":"expense","category":"groceries","date":"2024-01-15","description":"Weekly shopping"}'
```

**Dashboard Summary**
```bash
curl -X GET "http://localhost:3000/api/dashboard/summary?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Filter Transactions**
```bash
curl -X GET "http://localhost:3000/api/transactions?type=expense&category=groceries&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Running Tests

```bash
npm test
npm run test:coverage
```

## API Testing

All APIs were tested using Postman, including:

- Authentication (register, login, token refresh)
- Role-based access control (viewer, analyst, admin)
- Transaction CRUD operations
- Filtering and pagination
- Dashboard analytics endpoints

Proper responses, validation errors, and access restrictions were verified.

## 💡 Assumptions

- User registration is public; role assignment defaults to `viewer` unless specified
- Transactions are scoped per user — each user only sees their own records
- Categories are a predefined list to keep data consistent
- Hard delete is used (no soft delete) for simplicity
- All dates stored in UTC
- Rate limiting: 100 requests per 15 minutes per IP

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.18 |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Testing | Jest + Supertest |
| Security | Helmet, CORS, express-mongo-sanitize |

## 🚀 Future Improvements

- 📁 Store CSV exports as downloadable files  
- ⚡ Add Redis caching for dashboard endpoints  
- 🧾 Move budget configuration to database  
- 📘 Add Swagger for API documentation  
- 🔐 Add Google OAuth for simplified authentication  
