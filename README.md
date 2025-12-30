# MyIndustry - Microservices Marketplace Platform

## Project Overview
MyIndustry is a B2B marketplace platform designed to connect buyers and sellers.

This repository currently runs the **microservices stack** (API gateway + services + per-service databases) via Docker Compose.

> Note: A `monolith/` directory exists as legacy code, but it is not started by the current `docker-compose.yml`.

## Architecture (big picture)
- **API Gateway (Krakend):** Single entry point for client requests; routing is defined in `api-gateway/krakend.json`.
- **Services (`*-service/`):** Node.js/Express apps. Each service owns its database schema and exposes a small REST API.
- **Databases:** One PostgreSQL database per service. Schemas are managed with **Knex migrations** under `<service>/db/migrations`.
- **Inter-service calls:** Services call each other over HTTP using Docker Compose service DNS names (e.g. `http://user-service:5006`).

### Services (internal container ports)
These ports are the ones services listen on *inside* Docker. Host ports are mapped via environment variables in `docker-compose.yml`.

- `krakend` (8080)
- `auth-service` (5001)
- `product-service` (5002)
- `gst-service` (5003)
- `admin-service` (5004)
- `lead-service` (5005)
- `user-service` (5006)
- `seller-service` (5007)
- `chat-service` (5008)

## Getting started (Docker Compose)
### Prerequisites
- Docker + Docker Compose

### Run the full stack
```bash
# Build images + start everything
docker compose up -d --build

# Stop everything
docker compose down
```

### Logs
```bash
# Follow logs for a specific service
docker compose logs -f krakend
```

### Accessing the APIs
- **Primary entry point:** the Krakend gateway host port is `${KRAKEND_PORT}` (set via `.env` / `docker-compose.yml`).
- **Direct-to-service debugging:** each service is also exposed on a host port (e.g. `${LEAD_SERVICE_PORT}` → container port 5005).

## Database migrations (Knex)
- Each service has migrations under `<service>/db/migrations`.
- **Auto-migration on startup:** `auth-service`, `user-service`, `product-service` run `db.migrate.latest()` in `server.js`.
- **Manual migrations:** `admin-service`, `lead-service`, `seller-service`, `chat-service`, `gst-service` currently *do not* auto-run migrations; run them manually:

```bash
# Example: run latest migrations inside a running container
docker compose exec admin-service npx knex migrate:latest
```

### Create a new migration
Create migration files locally (not inside containers):
```bash
cd admin-service
npx knex migrate:make add_some_table
```

## API gateway routing (Krakend)
- Source of truth: `api-gateway/krakend.json`.
- Each `endpoints[]` entry maps a public gateway route to a backend `host` + `url_pattern`.
- For “authenticated” routes, the gateway forwards selected headers (commonly `Authorization`, `Content-Type`, `X-User-ID`).

When adding/changing an API:
1. Implement the route in the target service.
2. Add/update the matching endpoint mapping in `api-gateway/krakend.json`.
3. Rebuild/restart the gateway:
   `docker compose up -d --build krakend`

## Database ownership / cross-service IDs
Each microservice owns its database schema; there are no cross-database foreign keys.

For a detailed map of tables and how IDs are shared across services, see `DB_RELATIONS.md`.
