import { createClient } from "@/utils/supabase/server";
import { isAdminRole } from "@/utils/supabase/authorizationPolicy";

export class AuthorizationError extends Error {
  constructor(message = "Administrator access is required.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AuthorizationError("Authentication is required.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !isAdminRole(profile.role)
  ) {
    throw new AuthorizationError();
  }

  return { supabase, user, role: profile.role };
}
