# AI Task Platform — Architecture Document

## System Overview

The AI Task Processing Platform is a distributed, microservices-based system designed for enterprise-grade task processing at scale. It follows clean architecture principles with clear separation of concerns across three independently deployable services.

---

## High-Level Architecture

       ```
                     Users
                     │
                     ▼
              Frontend (Vercel)
                     │
                     ▼
              Backend API (Render)
              │              │
              │              │
              ▼              ▼
       MongoDB Atlas     Upstash Redis
                            │
                            ▼
                     Worker (Railway)
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
└─────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Repository Pattern** | Isolates data access; easy to swap DB |
| **Service Layer** | All business logic in one place; testable |
| **DTO Validation** | express-validator enforces input at edge |
| **Error Code System** | Service throws string codes; middleware maps to HTTP |
| **Bull Queue** | Production-grade Redis queue with retries |
| **JWT Refresh Tokens** | Stateless auth with rotation |
| **Winston + Daily Rotate** | Structured logs with automatic rotation |

### Folder Structure

```
backend/src/
├── config/         # DB connection, env config
├── controllers/    # HTTP handlers (thin layer)
├── dto/            # Data Transfer Objects (future expansion)
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

### Live Updates Strategy

Tasks with `pending` or `running` status trigger automatic polling via React Query's `refetchInterval`:

```typescript
refetchInterval: (query) => {
  const status = query.state.data?.status;
  return (status === 'pending' || status === 'running') ? 2000 : false;
}
```

- Dashboard stats: polls every 5 seconds
- Task detail: polls every 2 seconds when active

### Folder Structure

```
frontend/src/
├── api/            # Axios instance + typed API modules
├── components/
│   ├── layout/     # Sidebar, Navbar
│   ├── tasks/      # Task-specific components
│   └── ui/         # Reusable: Button, Card, Modal, Badge...
├── hooks/          # Custom React hooks
├── layouts/        # DashboardLayout
├── pages/          # Route-level page components
├── router/         # Route guards, lazy loading
├── store/          # Zustand stores
├── styles/         # globals.css, Tailwind config
├── types/          # Shared TypeScript types
└── utils/          # Utility functions
```

---

## Python Worker Architecture

### Processing Flow

```
Redis Queue (Bull)
       │
       ▼
WorkerConsumer.run()
  └─ _fetch_next_job()   ← BRPOP from Redis list
       │
       ▼
  _process_job(job_data)
  ├─ Update MongoDB: status = 'running'
  ├─ TaskProcessor.process(operation, inputText)
  │   └─ Returns (result, execution_time_ms, logs)
  └─ Update MongoDB: status = 'success'/'failed'
                       result, logs, executionTime
```

### Error Handling

- Invalid operation → `ValueError` → status = failed
- Unexpected exception → caught at top level → status = failed
- Redis connection error → logged, retry on next loop iteration
- Graceful shutdown on SIGTERM/SIGINT

---

## Infrastructure Architecture

### Docker Compose (Development)

```
docker-compose.yml
├── redis        — Redis 7.2 with persistence
├── backend      — Node.js API server
├── frontend     — Nginx serving React build
└── worker       — Python worker (2 replicas)
```

### Kubernetes (Production)

```
Namespace: ai-task-platform
├── Deployments
│   ├── backend    (2 replicas, rolling update)
│   ├── frontend   (2 replicas, rolling update)
│   ├── redis      (1 replica, PVC)
│   └── worker     (2-10 replicas, HPA)
├── Services
│   ├── backend-service   (ClusterIP)
│   ├── frontend-service  (ClusterIP)
│   └── redis-service     (ClusterIP)
├── Ingress
│   └── ai-task-ingress  (Nginx, TLS via cert-manager)
├── ConfigMap
│   └── ai-task-config   (non-sensitive env)
├── Secret
│   └── ai-task-secrets  (MONGO_URI, JWT keys)
└── PVC
    └── redis-pvc        (5Gi)
```

### CI/CD Pipeline (GitHub Actions)

```
Push to main
     │
     ▼
┌────────────────────────────────────┐
│ 1. Backend: Lint, TypeScript, Test │ ◄─ Parallel jobs
│ 2. Frontend: Lint, Build           │
│ 3. Worker: Flake8, Black           │
└────────────┬───────────────────────┘
             │ All pass
             ▼
┌───────────────────────────────────────────┐
│ 4. Build & Push Docker Images to GHCR     │
│    - ai-task-backend:sha + latest         │
│    - ai-task-frontend:sha + latest        │
│    - ai-task-worker:sha + latest          │
└────────────────────────┬──────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ 5. Update Infrastructure Repo                        │
│    - Patch k8s manifests with new image SHA tags     │
│    - ArgoCD detects git change → auto-sync          │
│    - Kubernetes rolling update                       │
└─────────────────────────────────────────────────────┘
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
