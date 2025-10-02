"use client";

import { useState } from "react";
import type { Link } from "@shared-types/index";
import { bffFetch } from "@/lib/bff";

interface FormState {
  url: string;
  domain: string;
  key: string;
}

const initialForm: FormState = {
  url: "",
  domain: "",
  key: "",
};

export default function LinksPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<Link | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await bffFetch<Link>("/api/links", {
        method: "POST",
        body: JSON.stringify({
          url: form.url,
          domain: form.domain || undefined,
          key: form.key || undefined,
        }),
      });

      setLink(result);
      setForm(initialForm);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Create a short link</h1>
        <p className="text-sm text-muted-foreground">
          Submit a destination URL and optional domain/slug to provision a new Dub link via the integration BFF.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-6 shadow-sm">
        <div className="space-y-2">
          <label htmlFor="url" className="block text-sm font-medium">
            Destination URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            required
            value={form.url}
            onChange={(event) => setForm((state) => ({ ...state, url: event.target.value }))}
            placeholder="https://example.com"
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="domain" className="block text-sm font-medium">
              Domain (optional)
            </label>
            <input
              id="domain"
              name="domain"
              value={form.domain}
              onChange={(event) => setForm((state) => ({ ...state, domain: event.target.value }))}
              placeholder="dub.sh"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="key" className="block text-sm font-medium">
              Slug (optional)
            </label>
            <input
              id="key"
              name="key"
              value={form.key}
              onChange={(event) => setForm((state) => ({ ...state, key: event.target.value }))}
              placeholder="launch"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create link"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {link ? (
        <div className="space-y-2 rounded-lg border p-4">
          <h2 className="font-medium">Latest link</h2>
          <dl className="grid gap-1 text-sm">
            <div className="flex gap-2">
              <dt className="w-32 text-muted-foreground">Short link</dt>
              <dd>{link.shortLink}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-32 text-muted-foreground">Destination</dt>
              <dd>{link.url}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-32 text-muted-foreground">Created</dt>
              <dd>{new Date(link.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
