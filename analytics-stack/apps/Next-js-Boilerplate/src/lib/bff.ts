const baseUrl = process.env.NEXT_PUBLIC_BFF_URL?.replace(/\/$/, "");

export async function bffFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = baseUrl ? `${baseUrl}${path}` : path;
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `BFF request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
