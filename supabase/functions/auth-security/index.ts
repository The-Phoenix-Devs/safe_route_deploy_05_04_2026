import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityEvent {
  action: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  details?: any;
}

interface RateLimitRecord {
  attempts: number;
  first_attempt: number;
  locked_until?: number;
}

// In-memory rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, RateLimitRecord>();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, identifier, user_id, user_agent } = await req.json();
    const ip_address = req.headers.get('x-forwarded-for') || 'unknown';

    console.log(`Security check for action: ${action}, identifier: ${identifier}`);

    // Rate limiting configuration
    const MAX_LOGIN_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

    // Check rate limiting
    const now = Date.now();
    const rateLimitKey = `${action}_${identifier}_${ip_address}`;
    let record = rateLimitStore.get(rateLimitKey);

    if (!record) {
      record = { attempts: 0, first_attempt: now };
      rateLimitStore.set(rateLimitKey, record);
    }

    // Check if locked out
    if (record.locked_until && now < record.locked_until) {
      const lockTimeRemaining = Math.ceil((record.locked_until - now) / 1000 / 60);
      
      await logSecurityEvent(supabase, {
        action: `${action}_blocked`,
        user_id,
        ip_address,
        user_agent,
        success: false,
        details: { 
          reason: 'rate_limit_exceeded',
          attempts: record.attempts,
          lock_time_remaining: lockTimeRemaining
        }
      });

      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: 'Too many attempts',
          lockTimeRemaining: lockTimeRemaining
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Reset if window has passed
    if (now - record.first_attempt > RATE_LIMIT_WINDOW) {
      record.attempts = 0;
      record.first_attempt = now;
      delete record.locked_until;
    }

    // Check if rate limit exceeded
    if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
      record.locked_until = now + LOCKOUT_DURATION;
      
      await logSecurityEvent(supabase, {
        action: `${action}_locked`,
        user_id,
        ip_address,
        user_agent,
        success: false,
        details: { 
          reason: 'max_attempts_exceeded',
          attempts: record.attempts
        }
      });

      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: 'Account temporarily locked due to too many failed attempts',
          lockTimeRemaining: Math.ceil(LOCKOUT_DURATION / 1000 / 60)
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For failed login attempts, increment counter
    if (action === 'login_attempt' && !user_id) {
      record.attempts++;
      
      await logSecurityEvent(supabase, {
        action: 'failed_login_attempt',
        ip_address,
        user_agent,
        success: false,
        details: { 
          identifier,
          attempt_number: record.attempts
        }
      });
    }

    // For successful login, clear rate limit
    if (action === 'login_success' && user_id) {
      rateLimitStore.delete(rateLimitKey);
      
      await logSecurityEvent(supabase, {
        action: 'successful_login',
        user_id,
        ip_address,
        user_agent,
        success: true,
        details: { identifier }
      });

      // Check for suspicious login patterns
      await checkSuspiciousActivity(supabase, user_id, ip_address, user_agent);
    }

    return new Response(
      JSON.stringify({ 
        allowed: true,
        remaining_attempts: MAX_LOGIN_ATTEMPTS - record.attempts
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in auth-security function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function logSecurityEvent(supabase: any, event: SecurityEvent) {
  try {
    const { error } = await supabase
      .from('security_audit_log')
      .insert({
        action: event.action,
        user_id: event.user_id,
        table_name: 'auth_events',
        old_values: null,
        new_values: event.details,
        ip_address: event.ip_address,
        user_agent: event.user_agent
      });

    if (error) {
      console.error('Failed to log security event:', error);
    }
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

async function checkSuspiciousActivity(supabase: any, user_id: string, ip_address: string, user_agent: string) {
  try {
    // Check for logins from multiple IPs in short time
    const { data: recentLogins, error } = await supabase
      .from('security_audit_log')
      .select('ip_address, created_at')
      .eq('user_id', user_id)
      .eq('action', 'successful_login')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error checking suspicious activity:', error);
      return;
    }

    if (recentLogins && recentLogins.length > 1) {
      const uniqueIPs = new Set(recentLogins.map(login => login.ip_address));
      
      if (uniqueIPs.size > 2) {
        // Multiple IPs in short time - suspicious
        await logSecurityEvent(supabase, {
          action: 'suspicious_login_pattern',
          user_id,
          ip_address,
          user_agent,
          success: false,
          details: {
            reason: 'multiple_ips_short_time',
            unique_ips: uniqueIPs.size,
            recent_ips: Array.from(uniqueIPs)
          }
        });
      }
    }
  } catch (error) {
    console.error('Error in suspicious activity check:', error);
  }
}