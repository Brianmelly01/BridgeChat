# BridgeChat — Full-Stack Communication Platform

A production-ready real-time communication platform built with **Node.js**, **React Native (Expo)**, and **React (Admin Dashboard)**.

---

## 🏗️ Architecture

```
BridgeChat/
├── backend/          # Node.js + Express + Socket.IO + Prisma + PostgreSQL
├── mobile/           # React Native (Expo) — iOS & Android
├── admin/            # React + Vite — Admin Dashboard
├── nginx/            # Reverse proxy config
└── docker-compose.yml
```

---

## ✨ Features

### Mobile App
- 🔐 JWT auth with refresh token rotation + Firebase OAuth (Google/Apple)
- 💬 Real-time 1:1 and group messaging via Socket.IO
- 📷 Rich media: images, videos, voice notes, documents
- 📞 Audio & video calls via WebRTC signaling
- 🗺️ Location-based user discovery (nearby users)
- 👥 Public/private communities
- 🔔 Push notifications (FCM)
- 🌑 Dark theme with glassmorphism UI
- ✅ Read receipts, typing indicators, message reactions
- 🔒 E2E encryption support (libsodium)

### Admin Dashboard
- 📊 Real-time stats with charts (Recharts)
- 👥 User management: search, filter, ban/unban
- 🚨 Report management with status workflow
- 🌐 Community moderation

### Backend
- RESTful API + Socket.IO real-time layer
- Prisma ORM with PostgreSQL
- Redis for sessions, presence, QR tokens
- AWS S3 media uploads
- Firebase Admin push notifications
- Rate limiting, helmet, CORS
- Graceful shutdown

---

## 🚀 Quick Start

### 1. Clone & Configure

```bash
git clone https://github.com/yourorg/bridgechat
cd BridgeChat
cp backend/.env.example backend/.env
# Fill in all values in backend/.env
```

### 2. Run with Docker

```bash
docker-compose up -d
```

Services:
- **API**: http://localhost:5000
- **Admin**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 3. Run Locally (Development)

**Backend:**
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

**Admin:**
```bash
cd admin
npm install
npm run dev
```

**Mobile:**
```bash
cd mobile
npm install
npx expo start
```

---

## 🔑 Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in all values.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `REDIS_URL` | Redis connection URL |
| `AWS_S3_BUCKET` | S3 bucket name for media |
| `FIREBASE_PROJECT_ID` | Firebase project for FCM |
| `TWILIO_ACCOUNT_SID` | Twilio for TURN server |

---

## 📱 Mobile Configuration

Set environment variables in `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://YOUR_SERVER_IP:5000/api
EXPO_PUBLIC_SOCKET_URL=http://YOUR_SERVER_IP:5000
```

---

## 🗄️ Database

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name init

# Open Prisma Studio
npx prisma studio
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Restart backend only
docker-compose restart backend

# Stop all
docker-compose down

# Full reset (removes volumes)
docker-compose down -v
```

---

## 📂 Project Structure

### Backend (`/backend/src`)
```
├── config/         # DB, Redis, Firebase, S3, Logger
├── controllers/    # Route handlers
├── middleware/     # Auth, error, upload, rate-limit
├── routes/         # Express routers
├── services/       # Socket.IO, S3, Notifications, WebRTC
└── utils/          # JWT, encryption, validators, email
```

### Mobile (`/mobile/src`)
```
├── navigation/     # Root, Auth, Main navigators
├── screens/        # auth/, main/, calls/, settings/
├── components/     # common/, chat/
├── store/          # Zustand: authStore, chatStore
├── services/       # apiClient, apiServices, socket
├── theme/          # colors, typography, spacing
└── utils/          # formatters
```

---

## 🛡️ Security

- Passwords hashed with **bcrypt** (12 rounds)
- JWT access tokens (15min) + refresh tokens (7 days) stored in Redis
- Rate limiting on all endpoints
- Helmet security headers
- CORS configured per environment
- Input validation with **Zod**
- SQL injection protection via Prisma parameterized queries

---

## 📄 License

MIT © BridgeChat Team
