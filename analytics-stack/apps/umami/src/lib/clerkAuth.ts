import {auth, clerkClient} from '@clerk/nextjs/server';
import {randomUUID} from 'node:crypto';
import {ROLES} from '@/lib/constants';
import {hashPassword} from '@/lib/auth';
import {createUser, getUserByUsername} from '@/queries';
import type {Auth} from '@/lib/types';

function toAppUser(user: {id: string; username: string; role: string}): Auth['user'] {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    isAdmin: user.role === ROLES.admin,
  };
}

function inferUsername(user: any) {
  return (
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    user?.username ||
    user?.id
  );
}

export async function resolveClerkAuth(): Promise<Auth | null> {
  if (!process.env.CLERK_SECRET_KEY) {
    return null;
  }

  try {
    const {userId} = auth();

    if (!userId) {
      return null;
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const username = inferUsername(clerkUser);

    if (!username) {
      return null;
    }

    let appUser = await getUserByUsername(username);

    if (!appUser) {
      appUser = await createUser({
        id: randomUUID(),
        username,
        password: hashPassword(randomUUID()),
        role: ROLES.admin,
      });
    }

    return {
      user: toAppUser(appUser),
    };
  } catch (error) {
    return null;
  }
}
