import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

type Supabase = ReturnType<typeof createClient>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  userId?: string;
  userType?: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
  };
}

const FCM_BATCH = 1000;

/** Legacy FCM HTTP API requires string values in `data`. */
function fcmStringData(
  data?: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!data) return out;
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}

const sendFCMNotification = async (
  tokens: string[],
  notification: NotificationPayload["notification"],
) => {
  const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");

  if (!fcmServerKey) {
    throw new Error("FCM_SERVER_KEY environment variable is not set");
  }

  const payload = {
    registration_ids: tokens,
    notification: {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/bus-icon.svg",
      badge: notification.badge || "/bus-icon.svg",
    },
    data: fcmStringData(notification.data),
  };

  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${fcmServerKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`FCM request failed: ${response.statusText}`);
  }

  return await response.json();
};

/** Legacy FCM HTTP API allows up to 1000 registration_ids per request. */
async function sendFCMChunked(
  tokens: string[],
  notification: NotificationPayload["notification"],
) {
  const results: unknown[] = [];
  for (let i = 0; i < tokens.length; i += FCM_BATCH) {
    const chunk = tokens.slice(i, i + FCM_BATCH);
    results.push(await sendFCMNotification(chunk, notification));
  }
  return results.length === 1 ? results[0] : results;
}

async function collectTokensForUserId(
  supabase: Supabase,
  userId: string,
): Promise<string[]> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("fcm_token")
    .eq("id", userId)
    .single();

  if (error) throw error;

  const out = new Set<string>();
  if (profile?.fcm_token) out.add(profile.fcm_token);

  const { data: gpt } = await supabase
    .from("guardian_push_tokens")
    .select("token")
    .eq("profile_id", userId)
    .maybeSingle();

  if (gpt?.token) out.add(gpt.token);

  return [...out];
}

async function collectTokensForUserType(
  supabase: Supabase,
  userType: string,
): Promise<string[]> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, fcm_token")
    .eq("user_type", userType);

  if (error) throw error;

  const out = new Set<string>();
  const ids: string[] = [];

  for (const p of profiles || []) {
    ids.push(p.id);
    if (p.fcm_token) out.add(p.fcm_token);
  }

  if (ids.length === 0) return [];

  const { data: gpts } = await supabase
    .from("guardian_push_tokens")
    .select("token")
    .in("profile_id", ids);

  for (const g of gpts || []) {
    if (g.token) out.add(g.token);
  }

  return [...out];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { userId, userType, notification }: NotificationPayload =
      await req.json();

    let tokens: string[] = [];

    if (userId) {
      tokens = await collectTokensForUserId(supabaseClient, userId);
    } else if (userType) {
      tokens = await collectTokensForUserType(supabaseClient, userType);
    }

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No FCM tokens found for the specified recipients",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await sendFCMChunked(tokens, notification);

    await supabaseClient.from("notification_logs").insert({
      user_id: userId,
      user_type: userType,
      title: notification.title,
      body: notification.body,
      tokens_sent: tokens.length,
      fcm_response: result,
    });

    return new Response(
      JSON.stringify({
        success: true,
        tokens_sent: tokens.length,
        fcm_result: result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
