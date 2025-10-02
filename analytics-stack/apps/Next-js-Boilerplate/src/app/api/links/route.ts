import { NextResponse } from "next/server";
import { LinkCreateInputSchema, LinkSchema } from "@shared-types/index";
import { createLink, DubSdkError } from "@sdk-dub/index";
import { requireAuth, UnauthorizedError } from "@/server/require-auth";

export async function POST(request: Request) {
  try {
    await requireAuth();

    const json = await request.json();
    const payload = LinkCreateInputSchema.parse(json);

    const link = await createLink(payload);

    return NextResponse.json(LinkSchema.parse(link));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    if (error instanceof DubSdkError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 502 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Unknown error" }, { status: 500 });
  }
}
