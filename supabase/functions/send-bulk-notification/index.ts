import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  userTypes?: string[];
}

const FCM_BATCH = 1000;

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
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
  },
) => {
  const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");
  if (!fcmServerKey) {
    throw new Error("FCM_SERVER_KEY environment variable is not set");
  }

  const merged: Record<string, unknown> = {
    ...(notification.data || {}),
    timestamp: new Date().toISOString(),
  };

  const payload = {
    registration_ids: tokens,
    notification: {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/logo-placeholder.svg",
      badge: notification.badge || "/logo-placeholder.svg",
    },
    data: fcmStringData(merged),
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

/**
 * Collect unique FCM tokens: profiles.fcm_token plus guardian web tokens from
 * guardian_push_tokens (same logic as send-push-notification).
 */
async function collectAllTargetTokens(
  supabase: ReturnType<typeof createClient>,
  userTypes?: string[],
): Promise<string[]> {
  const out = new Set<string>();

  if (userTypes && userTypes.length > 0) {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, fcm_token")
      .in("user_type", userTypes);

    if (error) throw error;

    const ids: string[] = [];
    for (const p of profiles || []) {
      ids.push(p.id);
      if (p.fcm_token) out.add(p.fcm_token);
    }

    if (ids.length > 0) {
      const { data: gpts } = await supabase
        .from("guardian_push_tokens")
        .select("token")
        .in("profile_id", ids);

      for (const g of gpts || []) {
        if (g.token) out.add(g.token);
      }
    }
  } else {
    const { data: withFcm, error: e1 } = await supabase
      .from("profiles")
      .select("fcm_token")
      .not("fcm_token", "is", null);

    if (e1) throw e1;
    for (const p of withFcm || []) {
      if (p.fcm_token) out.add(p.fcm_token);
    }

    const { data: gpts, error: e2 } = await supabase
      .from("guardian_push_tokens")
      .select("token");

    if (e2) throw e2;
    for (const g of gpts || []) {
      if (g.token) out.add(g.token);
    }
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

    const requestBody: NotificationRequest = await req.json();
    const { title, body, icon, badge, data, userTypes } = requestBody;

    if (!title || !body) {
      return new Response(JSON.stringify({ error: "Title and body are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokens = await collectAllTargetTokens(supabaseClient, userTypes);

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No users found with FCM tokens",
          sent: 0,
          failed: 0,
          total_tokens: 0,
          total_users: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const notification = { title, body, icon, badge, data };
    const fcmResults: unknown[] = [];
    let failedCount = 0;

    for (let i = 0; i < tokens.length; i += FCM_BATCH) {
      const chunk = tokens.slice(i, i + FCM_BATCH);
      try {
        fcmResults.push(await sendFCMNotification(chunk, notification));
      } catch (e) {
        console.error("FCM batch error:", e);
        failedCount += chunk.length;
      }
    }

    const sentCount = tokens.length - failedCount;

    const { error: logError } = await supabaseClient.from("notification_logs").insert({
      title: `BULK: ${title}`,
      body,
      user_type: userTypes?.length ? userTypes.join(",") : "all",
      tokens_sent: sentCount,
      fcm_response: {
        total_tokens: tokens.length,
        batches: fcmResults.length,
        failed_tokens: failedCount,
        results: fcmResults,
      },
    });

    if (logError) {
      console.error("Error logging notification:", logError);
    }

    // total_users: legacy field for admin UI — same count as FCM endpoints (not unique people).
    return new Response(
      JSON.stringify({
        message: "Bulk notification completed",
        total_tokens: tokens.length,
        total_users: tokens.length,
        sent: sentCount,
        failed: failedCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Bulk notification error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
