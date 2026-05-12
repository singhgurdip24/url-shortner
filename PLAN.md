# URL Shortener — Turborepo Monorepo

## Stack
- **Monorepo**: Turborepo + pnpm workspaces
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + Tailwind CSS + TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Cache**: Redis (ioredis) — fast redirect lookups
- **Infra**: Docker Compose (Postgres + Redis)

---

## Directory Structure

```
url-shortner/
├── PLAN.md
├── package.json                  # pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── docker-compose.yml
├── .env.example
├── .gitignore
├── apps/
│   ├── api/                      # Express backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── index.ts          # Express app bootstrap
│   │       ├── lib/
│   │       │   ├── prisma.ts
│   │       │   └── redis.ts
│   │       └── routes/
│   │           ├── shorten.ts    # POST /api/shorten
│   │           ├── redirect.ts   # GET /:code
│   │           └── stats.ts      # GET /api/stats/:code
│   └── web/                      # React + Vite frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── index.css         # Tailwind directives
│           ├── App.tsx
│           ├── api/
│           │   └── client.ts
│           └── components/
│               ├── ShortenForm.tsx
│               ├── ResultCard.tsx
│               └── StatsCard.tsx
└── packages/
    └── shared/                   # Shared TypeScript types
        ├── package.json
        ├── tsconfig.json
        └── src/
            └── index.ts
```

---

## Root Files

### `package.json`
```json
{
  "name": "url-shortener",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "engines": { "node": ">=18", "pnpm": ">=9" }
}
```

### `pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build":   { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev":     { "cache": false, "persistent": true },
    "lint":    { "dependsOn": ["^lint"] },
    "db:push": { "cache": false }
  }
}
```

### `tsconfig.base.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

### `docker-compose.yml`
```yaml
version: "3.9"
services:
  postgres:
    image: postgres:15-alpine
    container_name: url_shortener_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-urlshortener}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: url_shortener_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### `.env.example`
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/urlshortener
REDIS_URL=redis://localhost:6379
PORT=3001
BASE_URL=http://localhost:3001
ALLOWED_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3001
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=urlshortener
```

---

## `packages/shared/`

### `package.json`
```json
{
  "name": "@url-shortener/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" }
}
```

### `src/index.ts`
```ts
export interface ShortenRequest  { url: string }
export interface ShortenResponse { code: string; shortUrl: string; originalUrl: string; createdAt: string }
export interface StatsResponse   { code: string; originalUrl: string; clicks: number; createdAt: string }
export interface ErrorResponse   { error: string; message: string }
```

Both `api` and `web` resolve this via `paths` in their `tsconfig.json` — no build step needed.

---

## `apps/api/`

### `package.json` — key dependencies
```json
{
  "dependencies": {
    "express": "^4.19.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.3.0",
    "rate-limit-redis": "^4.2.0",
    "@prisma/client": "^5.14.0",
    "ioredis": "^5.3.2",
    "nanoid": "^3.3.7",
    "zod": "^3.23.0",
    "@url-shortener/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.0.0",
    "prisma": "^5.14.0",
    "tsx": "^4.0.0",
    "typescript": "^5.4.0"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "db:push": "prisma db push",
    "db:generate": "prisma generate"
  }
}
```

> **Note**: Use `nanoid@3` (CommonJS-compatible) to avoid ESM complications with tsx.

### `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Link {
  id          String   @id @default(cuid())
  code        String   @unique
  originalUrl String
  clicks      Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([code])
}
```

### `src/lib/prisma.ts`
Singleton PrismaClient using `globalThis` pattern to survive `tsx watch` hot reloads without exhausting connection pool.

### `src/lib/redis.ts`
ioredis singleton with:
- `REDIS_KEYS.shortCode(code)` → `"short:<code>"`
- `REDIS_TTL.shortCode` → `86400` (24h)
- Error/connect event logging

### `src/routes/shorten.ts` — `POST /api/shorten`
1. Zod-validate body: `url` must be a valid URL string, max 2048 chars
2. `nanoid(7)` generates the short code
3. `prisma.link.create(...)` persists it
4. Eagerly write to Redis cache (write-through)
5. Return `ShortenResponse` with 201

### `src/routes/redirect.ts` — `GET /:code`
1. Check `redis.get("short:<code>")`
2. **Cache hit**: fire-and-forget click increment → `res.redirect(302, url)`
3. **Cache miss**: `prisma.link.findUnique` → 404 if not found → populate cache → sync increment → `res.redirect(302, url)`

Use **302** (not 301) — prevents browsers caching the redirect locally so clicks are always counted.

### `src/routes/stats.ts` — `GET /api/stats/:code`
Always reads from Postgres (not Redis) for accurate click count. Returns `StatsResponse`.

### `src/index.ts`
```ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "./lib/redis.js";
import { shortenRouter } from "./routes/shorten.js";
import { statsRouter } from "./routes/stats.js";
import { redirectRouter } from "./routes/redirect.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

// Rate limit: 20 req/min per IP, backed by Redis
app.use("/api/shorten", rateLimit({
  windowMs: 60_000,
  max: 20,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
}));

app.use("/api", shortenRouter);
app.use("/api", statsRouter);
app.use("/", redirectRouter);   // registered last to not shadow /api routes

app.listen(Number(process.env.PORT ?? 3001), "0.0.0.0", () => {
  console.log(`API listening on port ${process.env.PORT ?? 3001}`);
});
```

---

## `apps/web/`

### `package.json` — key dependencies
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@url-shortener/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vite": "^5.3.0",
    "typescript": "^5.4.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview"
  }
}
```

### `tsconfig.json`
- `"moduleResolution": "bundler"` (Vite-recommended)
- `"noEmit": true` (Vite handles transpilation)
- `paths` alias for `@url-shortener/shared`

### `vite.config.ts`
- `@vitejs/plugin-react`
- Dev proxy: `/api → http://localhost:3001` (eliminates CORS in dev)
- Resolve alias for `@url-shortener/shared` → `../../packages/shared/src/index.ts`

### `tailwind.config.js`
```js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

### Components

| File | Description |
|---|---|
| `src/api/client.ts` | `shortenUrl(url)` and `fetchStats(code)` fetch wrappers |
| `src/components/ShortenForm.tsx` | URL text input + Shorten button; inline error display |
| `src/components/ResultCard.tsx` | Shows short URL as link, copy-to-clipboard button (2s feedback), View Stats button |
| `src/components/StatsCard.tsx` | Displays original URL, click count, creation date |
| `src/App.tsx` | State orchestration — wires form → result → stats |

**UI layout**: centered card (`max-w-lg mx-auto mt-20`), Tailwind utility classes throughout. No external component library.

---

## Startup Sequence

```bash
# 1. Enable pnpm
corepack enable && corepack prepare pnpm@latest --activate

# 2. Install all workspace dependencies
pnpm install

# 3. Start Postgres + Redis
docker compose up -d

# 4. Apply DB schema + generate Prisma client
pnpm --filter @url-shortener/api db:push

# 5. Start all apps
pnpm dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

---

## Verification Checklist

1. Open http://localhost:5173, paste a URL, click Shorten → short URL appears
2. Click the short URL → redirects to the original page
3. Click "View Stats" → shows click count = 1
4. Revisit the short URL multiple times → click count increments
5. `docker exec url_shortener_redis redis-cli GET short:<code>` → returns the original URL (confirms cache hit)
6. Submit an invalid URL → form shows validation error without crashing
7. `curl http://localhost:3001/api/stats/<code>` → returns JSON with clicks
