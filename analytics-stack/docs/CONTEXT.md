# Analytics Stack – Context (Clerk OIDC + Umami + Dub)

Goal: One login (Clerk OIDC) for our Next.js web app, a small Integration BFF, and vendored forks of Umami and Dub. Frontend never calls Umami/Dub directly; it only hits the BFF. BFF uses vendor service tokens.

Repo shape (Turborepo + pnpm):
- apps/web                # Next.js (App Router)
- apps/integration-bff    # Next.js API-only app (App Router); validates Clerk JWT on every request
- apps/umami              # vendored fork (git subtree); keep patches minimal
- apps/dub                # vendored fork (git subtree); keep patches minimal
- packages/shared-types   # Zod + TS contracts (Link, AnalyticsQuery, etc.)
- packages/sdk-umami      # Typed client for Umami; uses UMAMI_BASE_URL + UMAMI_API_TOKEN
- packages/sdk-dub        # Typed client for Dub; uses DUB_BASE_URL + DUB_API_TOKEN
- infra/env/*.example     # env templates
- infra/docker/*          # local Postgres/Redis + optional vendor containers
- docs/*                  # these files

Non-negotiables:
- Central auth = Clerk. Web + BFF share the same session; BFF rejects unauthenticated requests with 401.
- All shared request/response shapes live in packages/shared-types (with Zod validation).
- SDKs adapt to the **actual** vendor endpoints found in apps/umami and apps/dub (inspect code; don’t guess).
- BFF uses service tokens from env; do not forward raw Clerk JWT to vendors.
- Keep Umami/Dub forks as thin as possible. Put glue in BFF/SDKs.

Data flow:
Web (Clerk) → Integration BFF (validate Clerk) → SDKs → Umami/Dub via service tokens → normalize → return to Web.

Acceptance (must hold true):
1) BFF routes return 401 without a valid Clerk session.
2) POST /api/links creates a Dub link and returns normalized @shared-types/Link.
3) GET /api/analytics/overview returns normalized @shared-types/AnalyticsOverview.
4) Web only talks to BFF. No direct calls to Umami/Dub from the browser.
