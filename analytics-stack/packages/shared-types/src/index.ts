import { z } from "zod";

export const UserIdentitySchema = z.object({
  id: z.string(),
  email: z.string().email().nullish(),
  name: z.string().nullish(),
  orgId: z.string().nullish(),
});

export type UserIdentity = z.infer<typeof UserIdentitySchema>;

export const LinkCreateInputSchema = z
  .object({
    url: z.string().url(),
    domain: z.string().min(1).optional(),
    key: z.string().min(1).optional(),
    workspaceId: z.string().min(1).optional(),
  })
  .strict();

export type LinkCreateInput = z.infer<typeof LinkCreateInputSchema>;

export const LinkSchema = z
  .object({
    id: z.string(),
    shortLink: z.string().url(),
    url: z.string().url(),
    domain: z.string(),
    key: z.string(),
    createdAt: z.string(),
  })
  .strict();

export type Link = z.infer<typeof LinkSchema>;

export const AnalyticsQuerySchema = z
  .object({
    from: z.string(),
    to: z.string(),
    pathname: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  })
  .strict();

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;

export const MetricDeltaSchema = z
  .object({
    current: z.number(),
    previous: z.number(),
    delta: z.number(),
  })
  .strict();

export type MetricDelta = z.infer<typeof MetricDeltaSchema>;

export const AnalyticsOverviewSchema = z
  .object({
    pageviews: MetricDeltaSchema,
    visitors: MetricDeltaSchema,
    visits: MetricDeltaSchema,
    bounceRate: MetricDeltaSchema,
    avgVisitDuration: MetricDeltaSchema,
  })
  .strict();

export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;
