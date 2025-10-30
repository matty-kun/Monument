import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Utility to safely get the cookies store.
 * Works on both sync and async Next.js environments.
 */
async function getCookieStore() {
  return await Promise.resolve(cookies());
}

/**
 * Creates a Supabase client that uses the user's cookies for authentication.
 * ✅ Safe for use inside Server Actions and Route Handlers.
 * ❌ Not for use directly inside React Server Components (layouts/pages).
 */
export async function createClient() {
  const cookieStore = await getCookieStore();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookieList) {
          try {
            // ✅ Only allowed inside Server Actions or Route Handlers
            cookieList.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {
            // ⚠️ Ignore cookie writes when used in Server Components
            console.warn(
              "Attempted to modify cookies outside a Server Action or Route Handler."
            );
          }
        },
      },
    }
  );
}

/**
 * Creates a read-only Supabase client.
 * ✅ Safe for Server Components (layouts, pages).
 * 🚫 Cannot refresh sessions or set cookies.
 */
export async function createReadOnlyClient() {
  const cookieStore = await getCookieStore();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // ✅ Do nothing — prevents cookie write errors in Server Components
        },
      },
    }
  );
}

/**
 * Creates a Supabase client with the Service Role key.
 * ⚠️ Use ONLY on the server. Bypasses RLS (full admin privileges).
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op — service clients don’t set cookies
        },
      },
    }
  );
}
