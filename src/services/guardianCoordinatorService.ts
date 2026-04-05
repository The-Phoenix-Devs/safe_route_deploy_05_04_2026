import { supabase } from "@/integrations/supabase/client";
import { randomUuid } from "@/utils/randomUuid";

export function generateCoordinatorPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export interface CreateCoordinatorParams {
  name: string;
  mobile_number: string;
}

export interface GuardianCoordinatorResult {
  id: string;
  username: string;
  mobile_number: string;
  pin: string;
}

/**
 * School admin only: create a parent coordinator with rotating 6-digit PIN.
 */
export async function createGuardianCoordinator(
  params: CreateCoordinatorParams,
): Promise<GuardianCoordinatorResult> {
  const mobile = params.mobile_number.replace(/\D/g, "").slice(-10);
  if (mobile.length !== 10) {
    throw new Error("Enter a valid 10-digit mobile number.");
  }

  const variants = [mobile, `+91${mobile}`, `91${mobile}`];
  const { data: existingRows } = await supabase
    .from("profiles")
    .select("id")
    .in("mobile_number", variants);

  if (existingRows?.length) {
    throw new Error("This mobile number already has an account. Use a different number.");
  }

  const pin = generateCoordinatorPin();
  const firebaseUid = randomUuid();
  const username = params.name.trim().replace(/\s+/g, " ").slice(0, 80);
  const email = `${mobile}@coordinator.sishutirtha.local`;

  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      firebase_uid: firebaseUid,
      username,
      email,
      user_type: "guardian_admin",
      mobile_number: mobile,
      coordination_pin: pin,
    })
    .select("id, username, mobile_number")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: profile.id as string,
    username: profile.username as string,
    mobile_number: profile.mobile_number as string,
    pin,
  };
}
