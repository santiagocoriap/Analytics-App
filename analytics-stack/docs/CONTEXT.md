Project: analytics-stack
Goal: Integrate our Web app with Umami analytics and Dub links with unified SSO, shared types, and a BFF.

Constraints:
- Don’t delete vendor code in apps/umami or apps/dub; only minimal patches allowed.
- Put integration logic in apps/integration-bff and typed clients in packages/sdk-*.
- All shared contracts live in packages/shared-types (Zod + TS).
- Prefer composition over forking whenever possible.

Key tasks for you (the assistant):
1) Add endpoints to integration-bff for:
   - POST /links -> proxies to Dub, then emits event to Umami or our events table
   - GET /analytics/* -> fetches from Umami with our auth and returns normalized shapes
2) Add tracking helpers in packages/sdk-umami for pageview + event
3) Add Dub client in packages/sdk-dub for link CRUD
4) Wire NextAuth (or chosen SSO) so web and bff share JWT; forward identity to Umami/Dub via headers or service token
5) Update web to call only the bff (no direct calls to vendor apps)
