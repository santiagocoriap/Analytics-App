import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  const supported = ["en", "es"] as const;
  const lang = (supported as readonly string[]).includes(locale) ? locale : "en";

  let messages: Record<string, unknown> = {};
  try {
    messages = (await import(`../locales/${lang}.json`)).default;
  } catch {
    // ok: empty fallback
  }

  return { locale: lang, messages };
});
