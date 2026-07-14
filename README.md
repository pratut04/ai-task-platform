# AI Task Processing Platform

<div align="center">

![AI Task Platform](https://img.shields.io/badge/AI_Task_Platform-Production_Ready-5b70f0?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5?style=flat-square&logo=kubernetes)

**Enterprise-grade task processing platform with real-time status updates, Redis queuing, and Kubernetes autoscaling.**

[Features](#features) · [Quick Start](#quick-start) · [Docker](#docker) · [Kubernetes](#kubernetes) · [Architecture](#architecture) · [API](#api-reference)

</div>

---

## Features

- 🔐 **JWT Authentication** — Access + refresh token rotation, bcrypt password hashing
- 📋 **Task Management** — Create, run, monitor, and delete text processing tasks
- ⚡ **4 Processing Operations** — Uppercase, Lowercase, Reverse, Word Count
- 🔄 **Real-time Updates** — Auto-polling for live task status (2-5s intervals)
- 📊 **Dashboard Analytics** — Live statistics with task status breakdown
- 🐍 **Python Worker** — Redis-backed queue consumer with retry logic
- 🏗️ **Clean Architecture** — Repository → Service → Controller pattern
- 🐳 **Docker Ready** — Multi-stage builds with non-root users
- ☸️ **Kubernetes** — HPA autoscaling for workers (2-10 replicas)
- 🔁 **CI/CD** — GitHub Actions with automated Docker push and ArgoCD GitOps
- 🎨 **Premium Dark UI** — Glassmorphism, Framer Motion animations, Tailwind CSS

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Query, Framer Motion |
| **Backend** | Node.js, Express, TypeScript, Mongoose, Bull Queue |
| **Worker** | Python 3.12, Redis-py, PyMongo |
| **Database** | MongoDB Atlas |
| **Queue** | Redis 7.2 (Bull v4) |
| **Auth** | JWT (Access + Refresh), bcrypt |
| **Security** | Helmet, CORS, Rate Limiting, Express Validator |
| **Logging** | Winston + Daily Rotate (backend), JSON logs (worker) |
| **Infra** | Docker Compose, Kubernetes, ArgoCD, GitHub Actions |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- Redis 7+
- MongoDB Atlas account (or local MongoDB)
- Docker & Docker Compose (for containerized setup)

### 1. Clone & Configure

```bash
git clone https://github.com/YOUR_ORG/ai-task-platform.git
cd ai-task-platform
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MONGO_URI and JWT secrets
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### 4. Worker Setup

```bash
cd worker
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your MONGO_URI and REDIS_URL
python main.py
```

---

## Docker

### Run Everything with Docker Compose

```bash
# Copy and fill environment variables
cp backend/.env.example .env

# Start all services (backend, frontend, worker, redis)
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

**Services:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Redis | redis://localhost:6379 |

### Build Individual Images

```bash
# Backend
docker build -t ai-task-backend ./backend --target production

# Frontend
docker build -t ai-task-frontend ./frontend --target production

# Worker
docker build -t ai-task-worker ./worker --target production
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Required |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `CLIENT_URL` | Allowed CORS origin | `http://localhost:5173` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Winston log level | `debug` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

### Worker (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | Required |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `LOG_LEVEL` | Python log level | `INFO` |

---

## Kubernetes

### Prerequisites

- `kubectl` configured for your cluster
- Kubernetes 1.28+
- Nginx Ingress Controller
- cert-manager (for TLS)

### Deploy

```bash
# 1. Create secrets (replace values first!)
kubectl apply -f k8s/base/secret.yaml

# 2. Apply all manifests
kubectl apply -f k8s/base/

# 3. Check status
kubectl get pods -n ai-task-platform
kubectl get services -n ai-task-platform
kubectl get ingress -n ai-task-platform

# 4. Check HPA
kubectl get hpa -n ai-task-platform
```

### ArgoCD Setup

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Apply Application
kubectl apply -f argocd/application.yaml

# Get initial password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

---

## API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Login and get tokens | Public |
| `POST` | `/api/auth/refresh` | Refresh access token | Public |
| `GET` | `/api/auth/profile` | Get current user | Protected |
| `POST` | `/api/auth/logout` | Logout | Protected |

### Tasks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/tasks` | Create a task | Protected |
| `GET` | `/api/tasks` | List tasks (paginated) | Protected |
| `GET` | `/api/tasks/stats` | Get task statistics | Protected |
| `GET` | `/api/tasks/:id` | Get task details | Protected |
| `POST` | `/api/tasks/:id/run` | Queue task for processing | Protected |
| `DELETE` | `/api/tasks/:id` | Delete a task | Protected |

### Query Parameters (GET /api/tasks)

| Parameter | Type | Values |
|-----------|------|--------|
| `page` | number | 1, 2, 3... |
| `limit` | number | 1-100 |
| `status` | string | pending, running, success, failed |
| `operation` | string | uppercase, lowercase, reverse, word_count |
| `search` | string | Search in title and inputText |

### Example: Create Task

```json
POST /api/tasks
Authorization: Bearer <token>

{
  "title": "Process customer feedback",
  "inputText": "Hello World this is a test",
  "operation": "uppercase"
}
```

### Example: Response

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "title": "Process customer feedback",
    "inputText": "Hello World this is a test",
    "operation": "uppercase",
    "status": "pending",
    "result": null,
    "logs": [],
    "executionTime": null,
    "createdBy": "65a0b1c2d3e4f5a6b7c8d9e0",
    "createdAt": "2024-01-12T10:00:00.000Z",
    "updatedAt": "2024-01-12T10:00:00.000Z"
  }
}
```

---

## Project Structure

```
ai-task-platform/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/             # DB, env configuration
│   │   ├── controllers/        # HTTP handlers
│   │   ├── middlewares/        # Auth, validation, error
│   │   ├── models/             # Mongoose models
│   │   ├── queue/              # Bull queue service
│   │   ├── repositories/       # Data access layer
│   │   ├── routes/             # Express routes
│   │   ├── services/           # Business logic
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Logger, response formatter
│   │   ├── validators/         # Input validation rules
│   │   ├── app.ts              # Express factory
│   │   └── server.ts           # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── api/                # Axios instance + API modules
│   │   ├── components/         # Reusable UI components
│   │   ├── layouts/            # Page layouts
│   │   ├── pages/              # Route pages
│   │   ├── router/             # Route guards
│   │   ├── store/              # Zustand stores
│   │   ├── styles/             # Global CSS
│   │   └── types/              # TypeScript types
│   ├── Dockerfile
│   └── nginx.conf
├── worker/                     # Python Redis consumer
│   ├── logger/                 # JSON structured logger
│   ├── processor/              # Task processing logic
│   ├── queue/                  # Redis queue consumer
│   ├── main.py                 # Entry point
│   ├── Dockerfile
│   └── requirements.txt
├── k8s/                        # Kubernetes manifests
│   └── base/
│       ├── namespace.yaml
│       ├── configmap.yaml
│       ├── secret.yaml
│       ├── backend.yaml
│       ├── services.yaml
│       ├── worker.yaml         # Includes HPA
│       ├── pvc.yaml
│       └── ingress.yaml
├── argocd/
│   └── application.yaml        # ArgoCD app definition
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # GitHub Actions pipeline
├── docker-compose.yml
├── ARCHITECTURE.md             # Detailed architecture docs
└── README.md
```

---

## Architecture Overview

```
Browser → Nginx Ingress → Frontend (Nginx/React) or Backend (Express)
                                              │
                                              ├── MongoDB Atlas
                                              └── Redis Queue
                                                       │
                                              Python Worker(s)
                                              (auto-scaled 2-10)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the complete technical architecture including sequence diagrams, data flow, and security model.

---

## CI/CD Pipeline

```
git push main
    │
    ├─ Backend: lint → TypeScript build → tests
    ├─ Frontend: lint → build
    ├─ Worker: black format → flake8 lint
    │
    └─ All pass → Build & push Docker images to GHCR
                → Update k8s manifests in infra repo
                → ArgoCD detects change → auto-sync
                → Kubernetes rolling update
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT © 2024 AI Task Platform

---

<div align="center">
Built with ❤️ using React, Node.js, Python, Redis, MongoDB, Docker, and Kubernetes
</div>
