# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**Freeline** — an event management system with booth/queue management and a mobile user app. Korean-language UI. Hosted at `j14a207.p.ssafy.io`.

## Build & Development Commands

### Backend (Spring Boot 4.0, Java 21)
```bash
cd be/Freeline/
./gradlew clean build          # Full build with tests + checkstyle
./gradlew test                 # Tests only
./gradlew check                # Checkstyle + tests
./gradlew bootJar -x test     # Build JAR without tests
```
- Checkstyle enforced: config at `be/Freeline/config/checkstyle/checkstyle.xml`
  - No wildcard imports, no static imports
  - Import order: `java → javax → jakarta → org → lombok → com` (strict)
- Tests use Testcontainers (PostgreSQL 18.3 + Redis 8.6) and REST Assured 5.5.0
- Run a single test: `./gradlew test --tests "com.freeline.domain.event.service.EventServiceTest"`

### Frontend — Mobile (Expo React Native)
```bash
cd fe/freeline_user/
npm install
npm run start                  # Expo dev server
npm run web                    # Web export
```

### Frontend — Web Apps (Next.js 16)
```bash
cd fe/freeline-booth/          # or fe/freeline-super/
npm install
npm run dev                    # Dev server (port 3000)
npm run build                  # Production build
```
- Both web apps use `output: "standalone"` for Docker and have basePaths (`/booth`, `/super`)

### Docker
```bash
# Backend services (PostgreSQL + Redis + RabbitMQ + app)
cd infra/backend/ && docker-compose up -d

# Frontend services
cd infra/frontend/ && docker-compose up -d

# Nginx reverse proxy
cd infra/nginx/ && docker-compose up -d
```

## Architecture

### Repository Structure
- `be/Freeline/` — Spring Boot backend (Java 21, Gradle)
- `fe/freeline_user/` — Mobile app (Expo 54 / React Native 0.81)
- `fe/freeline-booth/` — Booth manager web app (Next.js 16)
- `fe/freeline-super/` — Admin web app (Next.js 16)
- `fe/types/` — Shared TypeScript types (changes here trigger rebuild of ALL FE apps in CI)
- `infra/` — Docker Compose configs, Nginx, Jenkins pipelines, monitoring

### Backend Architecture
Domain-driven layered design with 11 domains: `actionlog`, `auth`, `booth`, `boothmanager`, `boothmap`, `event`, `goods`, `pushnotification`, `qr`, `report`, `waiting`.

Each domain follows: `controller/ → service/ → repository/ → entity/` with `dto/{request,response}/`, `converter/`, and `exception/` subdirectories.

**Converter pattern**: `@UtilityClass` static methods (`toEntity()`, `toXyzResDto()`) decouple entities from DTOs.

**Error handling**: Throw `BusinessException(ErrorCode.XXX)` — the `ErrorCode` enum uses a prefix convention: `C-xxx` common, `A-xxx` admin, `U-xxx` user/auth, `E-xxx` event, `B-xxx` booth, etc.

Key cross-cutting concerns in `common/`:
- `BaseResponse<T>` (record) wraps all API responses: `{success, data, error, timestamp, httpStatus}`
  - Factory methods: `ok()`, `created()`, `noContent()`, `fail()`
  - Paginated responses use `PageResponse<T>`
- `GlobalExceptionHandler` catches all exceptions → uniform `BaseResponse`
- JWT stateless auth: `JwtProvider` + `JwtAuthenticationFilter`, token blacklist via Redis on logout
- `@PreAuthorize("hasRole('...')")` for role-based access
- RabbitMQ event system for real-time updates:
  ```
  Domain Event → WaitingEventPublisher → RabbitMQ (waiting.events exchange)
    ├→ SSE Queue → BoothManager subscribers (real-time updates)
    └→ FCM Queue → Mobile push notifications (Firebase)
  ```
- Cloudflare R2 for file storage (S3-compatible)

### Database
- PostgreSQL 18.3 with Hibernate/JPA (DDL auto = none, OSIV disabled)
- Schema defined in `be/Freeline/src/main/resources/ddl.sql` (idempotent CREATE IF NOT EXISTS)
- No migration tool — schema applied via `spring.sql.init.mode: always` on startup
- Redis for caching and JWT blacklist
- RabbitMQ for async event messaging (SSE + FCM queues with dead-letter retry)

### Frontend Architecture
- **Mobile**: Expo Router with 5 tabs (home, reservation, map, my, search), NativeWind styling, Axios API client, `QRMockContext` for testing QR flows
- **Web apps**: Next.js App Router, shadcn + Tailwind CSS, Axios API client
  - Booth app: `(dashboard)/` route group with sidebar layout (dashboard, goods, settings)
  - Super app: flat routes (events, login, register, settings)
- **API clients**: `fe/freeline-{booth,super}/src/lib/api.ts` — Axios with Bearer token from localStorage
  - Super app has 401/403 interceptor that auto-redirects to `/login`
- **API modules**: organized per domain in `src/lib/api/` (auth.ts, event.ts, booth.ts, etc.)
- **TypeScript paths**: `@/*` → `./src/` (web apps), `@/*` → root (mobile)

### Infrastructure
Two-server deployment:
- **Server A** (172.26.3.239): Nginx, backend, frontend apps, PostgreSQL, Redis, RabbitMQ, Flume Agent
- **Server B** (172.26.15.39): Jenkins, Infisical (secrets), Prometheus + Grafana monitoring, Hadoop (HDFS + YARN) + Hive

Nginx routes: `/` → user app, `/booth` → booth app, `/super` → admin app, `/api/` → backend (with SSE: no buffering, 3600s timeout)

Additional routes: `/jenkins`, `/grafana/`, `/prometheus/` → Server B services

### CI/CD
Three Jenkins pipelines (`be/Jenkinsfile`, `fe/Jenkinsfile`, `infra/Jenkinsfile`) with:
- Change detection per folder — only rebuild affected components
- `fe/types/` changes trigger rebuild of all 3 frontend apps
- Infisical secret injection via `infisical run` (paths: `/be`, `/fe`, `/prod`)
- Docker build + deploy on `main` branch only; tests run on all branches
- Health checks post-deploy (HTTP endpoints + `docker compose ps` state)
- `infra/hosts.conf` maps components to target servers
- Infra pipeline enforces deploy order: `networks,infisical,jenkins,jenkins-agent,monitoring,monitoring-agent,hadoop,flume-agent,loadtest,nginx`

### Configuration
- Backend profiles: `local` (defaults in `application-local.yml`) and `live` (env vars via Infisical)
- Secrets managed by Infisical (self-hosted on port 8081)
- Swagger UI available at `/swagger-ui.html` (try-it-out enabled)
- Prometheus metrics at `/actuator/prometheus`
- Timezone: `Asia/Seoul` globally (Jackson + Hibernate + Docker TZ)
- File upload limits: 100MB per file, 500MB per request

### Hadoop Analytics Pipeline
Event-level post-analysis report system using Hadoop batch processing.

**Data flow:**
```
[Mobile App] → trackEvent() → buffer (20건/30초) → POST /api/v1/logs/actions
    → [Spring Boot] Logback hourly rolling file (logs/action/)
    → [Flume Agent] spooldir source → HDFS sink
    → [HDFS] /data/logs/action/{date}/{hour}/
    → [Hive] batch analysis → PostgreSQL report tables → Admin dashboard
```

**Components:**
- `actionlog` domain (BE): `POST /api/v1/logs/actions` — bulk log collection, file-only (no DB)
- `features/tracking/` (Mobile): TrackingProvider context + useTracking hook, buffer + batch send
- `infra/hadoop/`: HDFS (NameNode + DataNode), YARN (ResourceManager + NodeManager), Hive (Metastore + HiveServer2)
- `infra/flume-agent/`: Flume 1.11.0 spooldir→HDFS, spool-mover sidecar for rolling file handoff
- Action log format: TSV (timestamp, eventId, visitorId, action, targetType, targetId, metadata, clientTimestamp, sessionId)
- HDFS replication: 1 (single DataNode), Hive metastore: dedicated PostgreSQL
