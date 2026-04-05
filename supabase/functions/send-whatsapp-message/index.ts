import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessagePayload {
  userId?: string;
  userType?: string;
  mobileNumber?: string;
  message: {
    text: string;
    templateName?: string;
    templateParams?: string[];
  };
}

const sendWhatsAppMessage = async (phoneNumber: string, message: string) => {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');
  
  console.log('Twilio config check:', {
    hasSid: !!twilioAccountSid,
    hasAuth: !!twilioAuthToken,
    hasWhatsAppNumber: !!twilioWhatsAppNumber,
    whatsAppNumber: twilioWhatsAppNumber
  });
  
  if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
    throw new Error('Twilio credentials not configured');
  }

  // Format phone number for WhatsApp (ensure it starts with whatsapp: and has +91 for India)
  const normalizedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
  const formattedTo = normalizedPhone.startsWith('whatsapp:') ? normalizedPhone : `whatsapp:${normalizedPhone}`;
  const formattedFrom = twilioWhatsAppNumber.startsWith('whatsapp:') ? twilioWhatsAppNumber : `whatsapp:${twilioWhatsAppNumber}`;

  console.log('WhatsApp message formatting:', {
    originalTo: phoneNumber,
    formattedTo,
    originalFrom: twilioWhatsAppNumber,
    formattedFrom
  });

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  
  const body = new URLSearchParams({
    To: formattedTo,
    From: formattedFrom,
    Body: message,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Twilio API Response:', {
      status: response.status,
      statusText: response.statusText,
      error
    });
    throw new Error(`Twilio API error: ${response.status} - ${error}`);
  }

  return await response.json();
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, userType, mobileNumber, message }: WhatsAppMessagePayload = await req.json();

    let phoneNumbers: string[] = [];

    if (mobileNumber) {
      // Send to specific mobile number
      phoneNumbers = [mobileNumber];
    } else if (userId) {
      // Send to specific user
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('mobile_number')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (profile?.mobile_number) {
        phoneNumbers = [profile.mobile_number];
      }
    } else if (userType) {
      // Send to all users of a specific type
      const { data: profiles, error } = await supabaseClient
        .from('profiles')
        .select('mobile_number')
        .eq('user_type', userType)
        .not('mobile_number', 'is', null);

      if (error) throw error;
      phoneNumbers = profiles?.map(p => p.mobile_number).filter(Boolean) || [];
    }

    if (phoneNumbers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No phone numbers found for the specified recipients' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send WhatsApp messages
    const results = [];
    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await sendWhatsAppMessage(phoneNumber, message.text);
        results.push({ phoneNumber, success: true, result });
      } catch (error) {
        console.error(`Failed to send WhatsApp message to ${phoneNumber}:`, error);
        results.push({ phoneNumber, success: false, error: error.message });
      }
    }

    // Log message in database for tracking
    await supabaseClient
      .from('notification_logs')
      .insert({
        user_id: userId,
        user_type: userType,
        title: 'WhatsApp Message',
        body: message.text,
        tokens_sent: phoneNumbers.length,
        fcm_response: { whatsapp_results: results }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messages_sent: phoneNumbers.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('WhatsApp message error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});