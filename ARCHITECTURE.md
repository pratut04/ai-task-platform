# AI Task Platform — Architecture Document

## System Overview

The AI Task Processing Platform is a distributed, microservices-based system designed for enterprise-grade task processing at scale. It follows clean architecture principles with clear separation of concerns across three independently deployable services backed by MongoDB and Redis.

---

## High-Level Architecture

```
                     Users
                      │
                      ▼
               Frontend (React + Vite)
               [Deployed: Vercel]
                      │  HTTP/REST
                      ▼
               Backend API (Node.js + Express)
               │                    │
               ▼                    ▼
         MongoDB Atlas         Redis (Bull Queue)
                                    │
                                    ▼
                         Python Worker (consumer)
```

---

## Repository Layout

```
ai-task-platform/
├── backend/            # Node.js + Express + TypeScript API
├── frontend/           # React + Vite + TypeScript SPA
├── worker/             # Python task worker
├── k8s/                # Kubernetes manifests (Kustomize)
│   ├── base/           # Base manifests
│   └── overlays/       # dev / prod environment patches
├── argocd/             # ArgoCD Application manifest
├── .github/workflows/  # GitHub Actions CI/CD pipeline
├── docker-compose.yml  # Local development stack (5 services)
└── redis-win/          # Redis binaries for Windows local dev
```

---

## Backend Architecture (Node.js + Express + TypeScript)

### Layered Architecture (Clean Architecture)

```
HTTP Request
     │
     ▼
┌─────────────┐
│  Middleware  │  Auth, Rate Limit, Helmet, CORS, Validation
└──────┬──────┘
       ▼
┌─────────────┐
│  Controller  │  Thin HTTP layer — parse req, call service, send res
└──────┬──────┘
       ▼
┌─────────────┐
│   Service   │  Business logic, orchestration, error codes
└──────┬──────┘
       ▼
┌─────────────┐
│ Repository  │  Data access — Mongoose queries only
└──────┬──────┘
       ▼
┌─────────────┐
│    Model    │  Mongoose schema + hooks
└──────┬──────┘
```

### Folder Structure

```
backend/src/
├── config/         # DB connection, env config
├── controllers/    # HTTP handlers (thin layer)
├── dto/            # Data Transfer Objects
├── middlewares/    # Auth, validation, error handler
├── models/         # Mongoose models
├── queue/          # Bull queue service
├── repositories/   # Data access layer
├── routes/         # Express route definitions
├── services/       # Business logic layer
├── types/          # TypeScript enums and interfaces
├── utils/          # Logger, response formatter
├── validators/     # express-validator rule sets
├── app.ts          # Express factory
└── server.ts       # Entry point
```

---

## Frontend Architecture (React + Vite + TypeScript)

### State Management

| State Type | Tool | Rationale |
|------------|------|-----------|
| **Server state** | React Query | Caching, polling, mutations |
| **Auth state** | Zustand + persist | Lightweight, persisted |
| **Form state** | React Hook Form | Performance, validation |
| **UI state** | Local component state | Simplest approach |

### Styling & Build

- **Tailwind CSS** for utility-first styling (`tailwind.config.js`, `postcss.config.js`)
- Production build served via **Nginx** (`nginx.conf`)
- Deployed to **Vercel** (`vercel.json`)

### Live Updates Strategy

Tasks with `pending` or `running` status trigger automatic polling via React Query's `refetchInterval`:

```typescript
refetchInterval: (query) => {
  const status = query.state.data?.status;
  return (status === 'pending' || status === 'running') ? 2000 : false;
}
```

### Folder Structure

```
frontend/src/
├── api/            # Axios instance + typed API modules
├── components/
│   ├── auth/       # Login, Register form components
│   ├── layout/     # Sidebar, Navbar
│   ├── tasks/      # Task-specific components
│   └── ui/         # Reusable: Button, Card, Modal, Badge...
├── hooks/          # Custom React hooks
├── layouts/        # DashboardLayout
├── pages/          # Route-level page components
├── router/         # Route guards, lazy loading
├── store/          # Zustand stores
├── styles/         # Global CSS
├── types/          # Shared TypeScript types
└── utils/          # Utility functions
```

---

## Python Worker Architecture

### Module Structure

```
worker/
├── main.py             # Entry point — starts WorkerConsumer loop
├── config/             # Settings (env vars, MongoDB/Redis config)
├── logger/             # Structured logging setup
│   └── logger.py
├── processor/          # Task processing logic
│   └── task_processor.py
├── task_queue/         # Redis queue consumer (Bull-compatible BRPOP)
│   └── consumer.py
├── queue/              # Bull queue helpers / job schema
├── requirements.txt
└── Dockerfile
```

### Processing Flow

```
Redis Queue (Bull)
       │
       ▼
WorkerConsumer.run()   ← main.py entry point
  └─ _fetch_next_job() ← BRPOP from Redis list
       │
       ▼
  _process_job(job_data)
  ├─ Update MongoDB: status = 'running'
  ├─ TaskProcessor.process(operation, inputText)
  │   └─ Returns (result, execution_time_ms, logs)
  └─ Update MongoDB: status = 'success'/'failed'
                       result, logs, executionTime
```

---

## Infrastructure Architecture

### Docker Compose (Local Development)

```
docker-compose.yml
├── mongodb   — MongoDB 7.0 with persistence (port 27017)
├── redis     — Redis 7.2-alpine with AOF persistence (port 6379)
├── backend   — Node.js API server (port 5000)
├── frontend  — Nginx serving React build (port 5173→80)
└── worker    — Python worker (WORKER_CONCURRENCY=4)
```

### Kubernetes (Production — Kustomize)

```
k8s/
├── base/
│   ├── namespace.yaml    — Namespace: ai-task-platform
│   ├── backend.yaml      — Backend Deployment (2 replicas) + ClusterIP Service (:5000)
│   ├── services.yaml     — Frontend Deployment (2 replicas) + ClusterIP Service (:80)
│   │                       Redis Deployment (1 replica, PVC) + ClusterIP Service (:6379)
│   ├── worker.yaml       — Worker Deployment (2–10 replicas, HPA) + Service
│   ├── ingress.yaml      — Nginx Ingress with TLS via cert-manager
│   ├── configmap.yaml    — ai-task-config (non-sensitive env vars)
│   ├── secret.yaml       — ai-task-secrets (MONGO_URI, JWT keys)
│   └── pvc.yaml          — redis-pvc (5Gi)
└── overlays/
    ├── dev/              — Dev environment patches
    └── prod/             — Prod environment patches
```

### ArgoCD GitOps

```
argocd/
└── application.yaml   — ArgoCD Application pointing to infra repo
                         Auto-syncs k8s manifests on git push
```

### CI/CD Pipeline (GitHub Actions)

```
Push to main / develop   (PRs to main also trigger lint jobs)
      │
      ▼
┌───────────────────────────────────────────────────┐
│ Job 1: Backend — Lint & Test                      │ ◄─ Parallel
│   npm ci → lint → tsc build → npm test           │
│ Job 2: Frontend — Lint & Build                    │
│   npm ci → lint → npm run build                  │
│ Job 3: Worker — Lint                              │
│   pip install flake8 black                        │
│   black --check → flake8 (max-line-length 120)   │
└──────────────────┬────────────────────────────────┘
                   │ All pass + push to main only
                   ▼
┌──────────────────────────────────────────────────────┐
│ Job 4: Build & Push Docker Images → GHCR             │
│   ghcr.io/<owner>/ai-task-backend:<sha>+latest       │
│   ghcr.io/<owner>/ai-task-frontend:<sha>+latest      │
│   ghcr.io/<owner>/ai-task-worker:<sha>+latest        │
└────────────────────────────┬─────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│ Job 5: Update Infrastructure Repo                         │
│   Checkout: pratut04/ai-task-platform-infra               │
│   sed patch k8s/base/*.yaml with new image SHA tags       │
│   git commit & push → ArgoCD detects → rolling update    │
└──────────────────────────────────────────────────────────┘
```

---

## Security Architecture

| Layer | Mechanism |
|-------|-----------|
| **Transport** | HTTPS via TLS cert-manager |
| **Auth** | JWT Access (15m) + Refresh (7d) tokens |
| **Password** | bcrypt with cost factor 12 |
| **HTTP Headers** | Helmet (CSP, HSTS, XSS protection) |
| **Rate Limiting** | express-rate-limit (100 req/15min) |
| **Input Validation** | express-validator on all endpoints |
| **CORS** | Whitelist client URL only |
| **Container Security** | Non-root users in all Docker images |
| **K8s Secrets** | Kubernetes Secrets (never in ConfigMap) |

---

## Data Flow: Task Processing

```
1. User submits form → POST /api/tasks
2. Backend creates task (status: pending) in MongoDB
3. User clicks "Run" → POST /api/tasks/:id/run
4. Backend updates status: pending, pushes job to Redis (Bull)
5. Python worker polls Redis queue (BRPOP)
6. Worker updates task status: running in MongoDB
7. Worker processes text (uppercase/lowercase/reverse/word_count)
8. Worker saves result, logs, executionTime to MongoDB
9. Worker updates status: success/failed
10. Frontend auto-polls task every 2-5s → displays live updates
```
