# RAMS.AI frontend

Next.js/React review interface. The browser calls `/api/backend/...` on its own origin; only the Next.js server knows the backend URL. Geist fonts are bundled locally.

## Local checks and startup

```sh
npm ci
npm run typecheck
npm run lint
npm run build
npm start -- --port 3000
```

`npm start` prepares public/static assets and runs the same standalone server used by the container. It binds loopback by default; explicitly set `RAMS_BIND_HOST=0.0.0.0` or `--hostname 0.0.0.0` only when needed by the chosen host. `npm run dev` remains available for development.

Runtime configuration (not browser-public variables):

| Variable | Default | Purpose |
|---|---|---|
| `RAMS_API_URL` | `http://127.0.0.1:8000` | Private backend origin, optionally with a path prefix |
| `RAMS_API_TIMEOUT_MS` | `600000` | Upstream timeout; benchmark against the host's request limits |
| `APP_VERSION` | `development` | Commit/version reported by health checks |
| `PORT` | `3000` | Frontend listening port |

Never set an OpenAI key in a `NEXT_PUBLIC_` variable or frontend configuration. The proxy streams multipart uploads/PDF responses, permits only the known review/health routes and methods, disables response caching, and forwards no browser cookies/authorization headers. Logs contain route, request ID, status and elapsed time, not document contents or reviewer comments.

## Staging

The Dockerfile builds a standalone image and runs as the non-root node user. The Node base digest is pinned to the tested image. Deploy the companion backend privately and set `RAMS_API_URL` to its private address. Do not point staging at production services or reuse production secrets.

`GET /api/health` checks this process. `/api/backend/health/live` checks private API connectivity. `/api/backend/health/ready` reports whether model configuration exists; it does not verify the OpenAI key with a live request.

The backend repository provides `deploy/compose.staging.yml`, `deploy/check_staging.py` and the staging runbook. The default Compose binding is loopback-only and contains no real API key. No external staging host or public preview is created by these files.

## Browser regression tests

```sh
npx playwright install --with-deps chromium
npm run test:e2e
```

For an existing Chromium executable, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. The browser suite intercepts API responses; the runtime proxy-failure test uses an intentionally unavailable local upstream. Tests never need a live OpenAI key. CI also builds and starts the Docker image.

Review the launch-readiness audit in `docs/launch-readiness.md` before considering real-user use. Staging hosting needs separate account access, controlled ingress, HTTPS and secure environment configuration. Pricing, billing, authentication and production deployment are outside these readiness changes.
