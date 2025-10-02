# Build Tasks for the Assistant

Read THIS file and docs/CONTEXT.md before editing code.

1) Workspace + plumbing
- Ensure pnpm workspaces + Turborepo: apps/*, packages/*.
- Add tsconfig.base.json paths: @shared-types/*, @sdk-umami/*, @sdk-dub/*.
- Create infra/env/*.example per app. Don’t hardcode secrets.

2) Clerk OIDC
- apps/web: set up Clerk (App Router). middleware.ts protects /(app) routes; public: '/', '/signin', '/signup'.
- apps/integration-bff: use @clerk/nextjs/server to validate every API request. Helper: requireAuth() → {id,email,name,orgId}.

3) Shared contracts
- packages/shared-types: Zod schemas for UserIdentity, LinkCreateInput, Link, AnalyticsQuery, AnalyticsOverview, TrackEventInput.

4) SDKs (inspect vendor code FIRST)
- packages/sdk-umami: discover real analytics + event endpoints in apps/umami and bind to them. Use UMAMI_BASE_URL, UMAMI_API_TOKEN.
- packages/sdk-dub: discover real link CRUD endpoints in apps/dub and bind to them. Use DUB_BASE_URL, DUB_API_TOKEN.
- In comments, cite file/line references where endpoints are defined.

5) BFF routes (Next.js App Router)
- GET /api/health → {ok:true, service:"integration-bff"}.
- POST /api/links → requireAuth → validate LinkCreateInput → call sdk-dub.createLink → return normalized Link.
- GET /api/analytics/overview?from&to&pathname&limit → requireAuth → validate with AnalyticsQuery → call sdk-umami.getOverview → return normalized data.

6) Web calls BFF
- apps/web/lib/bff.ts: fetch helper pointing at NEXT_PUBLIC_BFF_URL.
- Minimal UI pages:
  - (app)/links: form to create a link → POST /api/links → show result.
  - (app)/analytics: fetch /api/analytics/overview and render JSON.

7) Done when
- `pnpm dev` runs; protected routes prompt Clerk sign-in.
- BFF rejects unauthenticated requests; passes when signed in.
- Endpoints return normalized shapes per @shared-types.

Notes:
- Prefer composition over patching vendor cores.
- Keep diffs small; document any vendor changes in docs/INTEGRATION_NOTES.md.
