import { NextResponse } from "next/server";
import { AnalyticsOverviewSchema, AnalyticsQuerySchema } from "@shared-types/index";
import { getOverview, UmamiSdkError } from "@sdk-umami/index";
import { requireAuth, UnauthorizedError } from "@/server/require-auth";

export async function GET(request: Request) {
  try {
    await requireAuth();

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const parsed = AnalyticsQuerySchema.parse(params);

    const overview = await getOverview(parsed);

    return NextResponse.json(AnalyticsOverviewSchema.parse(overview));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    if (error instanceof UmamiSdkError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 502 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Unknown error" }, { status: 500 });
  }
}
