import {
  AnalyticsOverviewSchema,
  MetricDeltaSchema,
  type AnalyticsOverview,
  type AnalyticsQuery,
} from "@shared-types/index";

export class UmamiSdkError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "UmamiSdkError";
    this.status = status;
  }
}

const UMAMI_BASE_URL = process.env.UMAMI_BASE_URL;
const UMAMI_API_TOKEN = process.env.UMAMI_API_TOKEN;
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID;

function assertEnv(value: string | undefined, key: string) {
  if (!value) {
    throw new UmamiSdkError(`Missing ${key} environment variable`);
  }
  return value;
}

function buildMetric(current: number, previous: number) {
  return MetricDeltaSchema.parse({
    current,
    previous,
    delta: current - previous,
  });
}

export async function getOverview(query: AnalyticsQuery): Promise<AnalyticsOverview> {
  const baseUrl = assertEnv(UMAMI_BASE_URL, "UMAMI_BASE_URL");
  const apiToken = assertEnv(UMAMI_API_TOKEN, "UMAMI_API_TOKEN");
  const websiteId = assertEnv(UMAMI_WEBSITE_ID, "UMAMI_WEBSITE_ID");

  const from = new Date(query.from);
  const to = new Date(query.to);

  if (Number.isNaN(from.valueOf()) || Number.isNaN(to.valueOf())) {
    throw new UmamiSdkError("Invalid date range supplied to analytics overview");
  }

  const url = new URL(`/api/websites/${websiteId}/stats`, baseUrl);
  url.searchParams.set("startAt", from.valueOf().toString());
  url.searchParams.set("endAt", to.valueOf().toString());

  if (query.pathname) {
    url.searchParams.set("url", query.pathname);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new UmamiSdkError(text || "Failed to load analytics overview", response.status);
  }

  const payload = await response.json();

  // apps/umami/src/app/api/websites/[websiteId]/stats/route.ts exposes GET /api/websites/:id/stats. 【F:apps/umami/src/app/api/websites/[websiteId]/stats/route.ts†L9-L62】
  const pageviews = payload.pageviews ?? {};
  const visitors = payload.visitors ?? {};
  const visits = payload.visits ?? {};
  const bounces = payload.bounces ?? {};
  const totaltime = payload.totaltime ?? {};

  const visitsCurrent = Number(visits.value ?? 0);
  const visitsPrevious = Number(visits.prev ?? 0);
  const bouncesCurrent = Number(bounces.value ?? 0);
  const bouncesPrevious = Number(bounces.prev ?? 0);
  const totalTimeCurrent = Number(totaltime.value ?? 0);
  const totalTimePrevious = Number(totaltime.prev ?? 0);

  const overview = AnalyticsOverviewSchema.parse({
    pageviews: buildMetric(Number(pageviews.value ?? 0), Number(pageviews.prev ?? 0)),
    visitors: buildMetric(Number(visitors.value ?? 0), Number(visitors.prev ?? 0)),
    visits: buildMetric(visitsCurrent, visitsPrevious),
    bounceRate: buildMetric(
      visitsCurrent ? bouncesCurrent / Math.max(visitsCurrent, 1) : 0,
      visitsPrevious ? bouncesPrevious / Math.max(visitsPrevious, 1) : 0,
    ),
    avgVisitDuration: buildMetric(
      visitsCurrent ? totalTimeCurrent / Math.max(visitsCurrent, 1) : 0,
      visitsPrevious ? totalTimePrevious / Math.max(visitsPrevious, 1) : 0,
    ),
  });

  return overview;
}
