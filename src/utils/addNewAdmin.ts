import { supabase } from "@/integrations/supabase/client";

export type AddAdminByMobileResult =
  | { success: true; adminId: string; message: string }
  | { success: false; error: string };

/**
 * Create a school admin that can log in with the same mobile flow as AdminLogin
 * (profiles row only; no Supabase Auth required). Caller must be a logged-in admin
 * (profiles.id from localStorage).
 */
export async function addAdminByMobile(
  actorProfileId: string,
  mobile: string,
  displayName: string,
  email?: string | null
): Promise<AddAdminByMobileResult> {
  const digits = mobile.replace(/\D/g, "");
  const norm = digits.slice(-10);
  if (norm.length !== 10) {
    return { success: false, error: "Enter a valid 10-digit mobile number." };
  }

  const { data, error } = await supabase.rpc("create_admin_by_admin", {
    p_actor: actorProfileId,
    p_mobile: norm,
    p_username: displayName.trim(),
    p_email: email?.trim() || null,
  });

  if (error) {
    const msg = error.message || "Failed to create admin";
    if (/forbidden/i.test(msg)) {
      return { success: false, error: "Only a school admin can add another admin." };
    }
    if (/already registered/i.test(msg)) {
      return { success: false, error: "This mobile number is already registered." };
    }
    if (/invalid mobile/i.test(msg)) {
      return { success: false, error: "Enter a valid 10-digit mobile number." };
    }
    return { success: false, error: msg };
  }

  if (!data) {
    return { success: false, error: "No profile id returned" };
  }

  return {
    success: true,
    adminId: data as string,
    message: `Admin created. They can sign in with mobile ${norm} on the admin login screen.`,
  };
}

/**
 * Optional: create Supabase Auth user + profile (only if your project has email sign-up enabled).
 */
export const addNewAdminWithAuth = async (
  email: string,
  password: string,
  name: string
) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Failed to create user");

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        firebase_uid: authData.user.id,
        email,
        username: email,
        user_type: "admin",
      })
      .select()
      .single();

    if (profileError) throw new Error(profileError.message);

    return {
      success: true as const,
      admin: {
        id: profileData.id,
        email: profileData.email,
        name,
        role: profileData.user_type,
      },
      message: `Admin account created for ${email} (email must confirm if enabled in Supabase).`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create admin account";
    if (message.includes("User already registered")) {
      return { success: false as const, error: "An account with this email already exists" };
    }
    return { success: false as const, error: message };
  }
};
