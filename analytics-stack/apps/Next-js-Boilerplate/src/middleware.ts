import {clerkMiddleware} from '@clerk/nextjs/server';
import {NextResponse} from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import {locales, defaultLocale, localePrefix} from './i18n/routing';

const intlMiddleware = createIntlMiddleware({locales, defaultLocale, localePrefix});

export default clerkMiddleware(async (auth, req) => {
  const {pathname} = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ['/', '/(api|trpc)(.*)', '/((?!_next|.*\\..*).*)']
};
