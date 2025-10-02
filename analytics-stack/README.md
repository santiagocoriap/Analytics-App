# Analytics Stack

This repository aggregates the three core applications that power the analytics SaaS platform:

- **Frontend** (`apps/Next-js-Boilerplate`) – customer onboarding, auth (Clerk), plans, subscriptions, and management UI.
- **Umami** (`apps/umami`) – privacy-first analytics engine.
- **Dub** (`apps/dub`) – link tracking and analytics.

The root project wires these modules together so that you can install dependencies once and launch every service either with a single Node.js command or with Docker.

## Prerequisites

- Node.js 20+ (Next.js boilerplate requires =20; Umami supports 18+, Dub ships with pnpm 8.6.10)
- `pnpm` available via [Corepack](https://nodejs.org/api/corepack.html) (`corepack enable`) for the Umami and Dub apps
- Docker Desktop (optional, only if you plan to run with `docker compose`)

## Install dependencies

Install helper tooling at the root and bootstrap each application:

```bash
npm run install:all
```

This command runs:

- `npm install --prefix apps/Next-js-Boilerplate`
- `pnpm install --dir apps/umami`
- `pnpm install --dir apps/dub`

Feel free to run the individual scripts if you only want to set up one service at a time (`npm run install:frontend`, `npm run install:umami`, `npm run install:dub`).

## Run every app with one Node command

```bash
npm run dev
```

The root uses `concurrently` to spawn:

- `npm run dev --prefix apps/Next-js-Boilerplate`
- `pnpm --dir apps/umami dev`
- `pnpm --dir apps/dub dev`

Each process is color-coded and can be stopped together with `Ctrl+C`.

## Run every app with Docker Compose

```bash
docker compose up --build
```

Key ports:

- Frontend – <http://localhost:3000>
- Umami – <http://localhost:3001>
- Dub – <http://localhost:3002>

Live code updates are supported via bind mounts. Container dependencies (like Postgres for Umami or Dub) are **not** provisioned yet—you can extend the compose file by adding the required databases, caches, or message brokers as integration work begins.

## Next steps

- Wire shared auth and tenancy concerns (Clerk, plan enforcement) by exposing APIs from the frontend that the analytics apps can trust.
- Decide on shared infrastructure components (databases, queues) and model them in `docker-compose.yml`.
- Add CI automation (lint, test, type-check) to keep the services aligned.

