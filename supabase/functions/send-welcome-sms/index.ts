import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeSMSRequest {
  mobileNumber: string;
  userName: string;
  userType: 'driver' | 'guardian';
}

const sendWelcomeSMS = async (to: string, userName: string, userType: string) => {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
  
  console.log('SMS Twilio config check:', {
    hasSid: !!twilioAccountSid,
    hasAuth: !!twilioAuthToken,
    hasPhoneNumber: !!twilioPhoneNumber,
    phoneNumber: twilioPhoneNumber
  });
  
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    throw new Error('Twilio SMS credentials not configured');
  }

  const welcomeMessage = userType === 'driver' 
    ? `Welcome ${userName}! You're now registered as a driver in Sishu Tirtha Safe Route system. Safe travels ahead!`
    : `Welcome ${userName}! You're now connected to Sishu Tirtha Safe Route system. Track your child's bus safely!`;

  // Format phone number for SMS (ensure it starts with +91 for India)
  const formattedTo = to.startsWith('+91') ? to : `+91${to}`;
  
  // Format the from number (ensure it starts with + for international format)
  const formattedFrom = twilioPhoneNumber.startsWith('+') ? twilioPhoneNumber : `+91${twilioPhoneNumber}`;

  console.log('SMS formatting:', {
    originalTo: to,
    formattedTo,
    from: twilioPhoneNumber,
    messageLength: welcomeMessage.length
  });

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  
  const body = new URLSearchParams({
    To: formattedTo,
    From: formattedFrom,
    Body: welcomeMessage,
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
    console.error('Twilio SMS API Response:', {
      status: response.status,
      statusText: response.statusText,
      error
    });
    throw new Error(`Twilio SMS API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  console.log(`SMS sent successfully to ${formattedTo}: ${welcomeMessage}`);
  
  return {
    success: true,
    message: 'Welcome SMS sent successfully',
    to: formattedTo,
    content: welcomeMessage,
    timestamp: new Date().toISOString(),
    twilioResponse: result
  };
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

    const { mobileNumber, userName, userType }: WelcomeSMSRequest = await req.json();

    if (!mobileNumber || !userName || !userType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: mobileNumber, userName, userType' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format phone number
    const formattedPhone = mobileNumber.startsWith('+91') ? mobileNumber : `+91${mobileNumber}`;

    // Send welcome SMS
    const smsResult = await sendWelcomeSMS(formattedPhone, userName, userType);

    // Log the SMS in user_logs table
    await supabaseClient
      .from('user_logs')
      .insert({
        user_id: mobileNumber, // Using mobile as user_id since it's unique
        user_type: userType,
        user_name: userName,
        location: 'SMS Service',
        ip_address: 'Edge Function',
        device_info: `Welcome SMS sent to ${formattedPhone}`
      });

    console.log('Welcome SMS sent successfully:', smsResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: smsResult,
        message: 'Welcome SMS sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Welcome SMS error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});