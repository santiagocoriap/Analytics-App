import { LinkSchema, type Link, type LinkCreateInput } from "@shared-types/index";

const DUB_BASE_URL = process.env.DUB_BASE_URL;
const DUB_API_TOKEN = process.env.DUB_API_TOKEN;
const DEFAULT_WORKSPACE_ID = process.env.DUB_WORKSPACE_ID;

export class DubSdkError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "DubSdkError";
    this.status = status;
  }
}

function assertEnv(value: string | undefined, key: string) {
  if (!value) {
    throw new DubSdkError(`Missing ${key} environment variable`);
  }
  return value;
}

export async function createLink(input: LinkCreateInput): Promise<Link> {
  const baseUrl = assertEnv(DUB_BASE_URL, "DUB_BASE_URL");
  const apiToken = assertEnv(DUB_API_TOKEN, "DUB_API_TOKEN");
  const workspaceId = input.workspaceId ?? DEFAULT_WORKSPACE_ID;

  if (!workspaceId) {
    throw new DubSdkError("A workspaceId must be provided either in the payload or DUB_WORKSPACE_ID env var.");
  }

  const url = new URL("/api/links", baseUrl);
  url.searchParams.set("workspaceId", workspaceId);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      url: input.url,
      domain: input.domain,
      key: input.key,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new DubSdkError(text || "Failed to create link", response.status);
  }

  const data = await response.json();

  // apps/dub/apps/web/app/api/links/route.ts handles POST /api/links requests. 【F:apps/dub/apps/web/app/api/links/route.ts†L86-L151】
  const parsed = LinkSchema.safeParse({
    id: data.id,
    shortLink: data.shortLink ?? data.short_link,
    url: data.url,
    domain: data.domain,
    key: data.key,
    createdAt: data.createdAt ?? data.created_at ?? new Date().toISOString(),
  });

  if (!parsed.success) {
    throw new DubSdkError(parsed.error.message);
  }

  return parsed.data;
}
