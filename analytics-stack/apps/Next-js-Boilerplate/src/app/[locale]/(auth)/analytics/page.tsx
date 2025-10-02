"use client";

import { useEffect, useState } from "react";
import type { AnalyticsOverview } from "@shared-types/index";
import { bffFetch } from "@/lib/bff";

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(Math.round(value));
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDuration(seconds: number) {
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remaining = rounded % 60;
  return `${minutes}m ${remaining}s`;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 7);

    bffFetch<AnalyticsOverview>(
      `/api/analytics/overview?from=${from.toISOString()}&to=${to.toISOString()}`,
    )
      .then((data) => {
        setOverview(data);
      })
      .catch((error) => {
        setError(error instanceof Error ? error.message : "Unknown error");
      });
  }, []);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Analytics overview</h1>
        <p className="text-sm text-muted-foreground">
          Last 7 days of Umami website performance aggregated via the integration BFF.
        </p>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {overview ? (
        <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard title="Pageviews" value={formatNumber(overview.pageviews.current)} delta={overview.pageviews.delta} />
          <MetricCard title="Visitors" value={formatNumber(overview.visitors.current)} delta={overview.visitors.delta} />
          <MetricCard title="Visits" value={formatNumber(overview.visits.current)} delta={overview.visits.delta} />
          <MetricCard
            title="Bounce rate"
            value={formatPercent(overview.bounceRate.current)}
            delta={overview.bounceRate.delta}
            isPercentage
          />
          <MetricCard
            title="Avg. visit duration"
            value={formatDuration(overview.avgVisitDuration.current)}
            delta={overview.avgVisitDuration.delta}
          />
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">Loading latest analytics…</p>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  delta: number;
  isPercentage?: boolean;
}

function MetricCard({ title, value, delta, isPercentage }: MetricCardProps) {
  const sign = delta === 0 ? "" : delta > 0 ? "+" : "";
  const formattedDelta = isPercentage ? formatPercent(delta) : formatNumber(delta);

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <dt className="text-sm text-muted-foreground">{title}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
      <p className="text-xs text-muted-foreground">{`${sign}${formattedDelta}`} vs previous period</p>
    </div>
  );
}
