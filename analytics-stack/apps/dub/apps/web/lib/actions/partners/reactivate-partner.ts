"use server";

import { recordAuditLog } from "@/lib/api/audit-logs/record-audit-log";
import { linkCache } from "@/lib/api/links/cache";
import { getDefaultProgramIdOrThrow } from "@/lib/api/programs/get-default-program-id-or-throw";
import { deactivatePartnerSchema } from "@/lib/zod/schemas/partners";
import { prisma } from "@dub/prisma";
import { waitUntil } from "@vercel/functions";
import { authActionClient } from "../safe-action";

// Reactivate a partner
export const reactivatePartnerAction = authActionClient
  .schema(deactivatePartnerSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { workspace, user } = ctx;
    const { partnerId } = parsedInput;

    const programId = getDefaultProgramIdOrThrow(workspace);

    const where = {
      programId,
      partnerId,
    };

    const programEnrollment = await prisma.programEnrollment.findUniqueOrThrow({
      where: {
        partnerId_programId: where,
      },
      include: {
        program: true,
        partner: true,
      },
    });

    if (programEnrollment.status !== "deactivated") {
      throw new Error("This partner is not deactivated.");
    }

    await prisma.$transaction([
      prisma.link.updateMany({
        where,
        data: {
          expiresAt: null,
        },
      }),

      prisma.programEnrollment.update({
        where: {
          partnerId_programId: where,
        },
        data: {
          status: "approved",
        },
      }),
    ]);

    waitUntil(
      (async () => {
        const links = await prisma.link.findMany({
          where,
          select: {
            domain: true,
            key: true,
          },
        });

        await Promise.allSettled([
          // TODO send email to partner
          linkCache.expireMany(links),
          recordAuditLog({
            workspaceId: workspace.id,
            programId,
            action: "partner.unbanned",
            description: `Partner ${partnerId} unbanned`,
            actor: user,
            targets: [
              {
                type: "partner",
                id: partnerId,
                metadata: programEnrollment.partner,
              },
            ],
          }),
        ]);
      })(),
    );
  });
