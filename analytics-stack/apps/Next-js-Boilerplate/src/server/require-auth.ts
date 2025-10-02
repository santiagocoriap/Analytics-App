import { auth, currentUser } from "@clerk/nextjs/server";
import { UserIdentitySchema, type UserIdentity } from "@shared-types/index";

export class UnauthorizedError extends Error {
  status = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireAuth(): Promise<UserIdentity> {
  const { userId, orgId } = auth();

  if (!userId) {
    throw new UnauthorizedError();
  }

  const user = await currentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  const primaryEmail = user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)?.emailAddress;
  const fallbackEmail = user.emailAddresses.at(0)?.emailAddress;

  return UserIdentitySchema.parse({
    id: user.id,
    email: primaryEmail ?? fallbackEmail ?? null,
    name: user.fullName ?? null,
    orgId: orgId ?? user.organizationMemberships.at(0)?.organization.id ?? null,
  });
}
