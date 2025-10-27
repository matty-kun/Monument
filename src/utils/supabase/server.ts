import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

/**
 * Creates a Supabase client that uses the user's cookies for authentication.
 * Works across different Next.js versions (handles both async and sync cookies()).
 */
export async function createClient() {
  // Await cookies() in case it's async in your Next.js version
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // public anon key
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookieList) {
          cookieList.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );
}
/**
 * Creates a read-only Supabase client for use in Server Components that only need to fetch data.
 * This client avoids attempting to set cookies, which is not allowed in a read-only context.
 */
export async function createReadOnlyClient() {
  // Await cookies() in case it's async in your Next.js version
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // public anon key
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // This client is read-only, so `setAll` is a no-op.
        setAll() {
          // In a read-only client, we don't need to set cookies.
        },
      },
    }
  );
}

/**
 * Creates a Supabase client with the Service Role key.
 * Use this only in server-side code — it bypasses RLS.
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // Service clients don't rely on user sessions.
        getAll() {
          return [];
        },
        setAll() {
          // No-op — service clients don't set cookies.
        },
      },
    }
  );
}
