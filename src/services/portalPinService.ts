import { supabase } from "@/integrations/supabase/client";
import { generateSixDigitPin } from "@/utils/pin";

/** Reserves a 6-digit PIN not already used in portal_pin_plain_temp (best-effort uniqueness). */
export async function allocateUniquePortalPin(): Promise<string> {
  for (let i = 0; i < 60; i++) {
    const pin = generateSixDigitPin();
    const { data, error } = await supabase.rpc("portal_pin_plain_available", {
      p_plain: pin,
    });
    if (error) {
      throw new Error(error.message);
    }
    if (data === true) {
      return pin;
    }
  }
  throw new Error("Could not allocate a unique PIN. Please try again.");
}
