# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- Tests use Testcontainers (PostgreSQL) and REST Assured
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

### Docker
```bash
# Backend services (DB + Redis + app)
cd infra/backend/ && docker-compose up -d

# Frontend services
cd infra/frontend/ && docker-compose up -d

# Nginx reverse proxy
cd infra/nginx/ && docker-compose up -d
```

## Architecture

### Repository Structure
- `be/Freeline/` — Spring Boot backend (Java 21, Gradle)
- `fe/freeline_user/` — Mobile app (Expo/React Native)
- `fe/freeline-booth/` — Booth manager web app (Next.js)
- `fe/freeline-super/` — Admin web app (Next.js)
- `fe/types/` — Shared TypeScript types (changes here trigger rebuild of all FE apps)
- `infra/` — Docker Compose configs, Nginx, Jenkins pipelines, monitoring

### Backend Architecture
Domain-driven layered design with 9 domains: `auth`, `booth`, `boothmanager`, `boothmap`, `event`, `goods`, `pushnotification`, `qr`, `waiting`.

Each domain follows: `controller/ → service/ → repository/ → entity/` with `dto/{request,response}/`, `converter/`, and `exception/` subdirectories.

Key cross-cutting concerns in `common/`:
- `BaseResponse<T>` wraps all API responses (success flag + data + error + timestamp)
- `GlobalExceptionHandler` with `BusinessException` and `ErrorCode` enum
- JWT stateless auth (filter + provider), OAuth2 client
- Firebase for push notifications, Cloudflare R2 for file storage
- SSE for real-time booth manager updates

### Database
- PostgreSQL 18.3 with Hibernate/JPA (DDL auto = none)
- Schema defined in `be/Freeline/src/main/resources/ddl.sql` (idempotent CREATE IF NOT EXISTS)
- No migration tool — schema applied via `spring.sql.init`
- Redis for caching

### Frontend Architecture
- Mobile: Expo Router with tab navigation, NativeWind styling, Axios API client
- Web apps: Next.js App Router, shadcn + Tailwind CSS, Axios API client

### Infrastructure
Two-server deployment:
- **Server A**: Nginx, backend, frontend apps, PostgreSQL, Redis
- **Server B**: Jenkins, Infisical (secrets), Prometheus + Grafana monitoring

Nginx routes: `/` → user app, `/booth` → booth app, `/super` → admin app, `/api/` → backend

### CI/CD
Three Jenkins pipelines (`be/Jenkinsfile`, `fe/Jenkinsfile`, `infra/Jenkinsfile`) with:
- Change detection (only rebuild affected components)
- Infisical secret injection
- Deploy on main branch only
- Health checks post-deploy
- `infra/hosts.conf` maps components to target servers

### Configuration
- Backend profiles: `local` (defaults in `application-local.yml`) and `live` (env vars via Infisical)
- Secrets managed by Infisical (self-hosted)

  
- Swagger UI available at `/swagger-ui.html`
- Prometheus metrics at `/metrics/prometheus`
