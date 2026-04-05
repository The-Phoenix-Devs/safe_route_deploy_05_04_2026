import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentActionSMSRequest {
  student_name: string;
  guardian_name: string;
  guardian_mobile: string;
  action: 'pickup' | 'drop';
  time: string;
  bus_number: string;
  driver_name: string;
  pickup_point: string;
}

const sendStudentActionSMS = async (data: StudentActionSMSRequest) => {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
  
  console.log('Student SMS Twilio config check:', {
    hasSid: !!twilioAccountSid,
    hasAuth: !!twilioAuthToken,
    hasPhoneNumber: !!twilioPhoneNumber,
    phoneNumber: twilioPhoneNumber
  });
  
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    throw new Error('Twilio SMS credentials not configured');
  }

  const actionText = data.action === 'pickup' ? 'picked up' : 'dropped off';
  const actionPast = data.action === 'pickup' ? 'Picked Up' : 'Dropped Off';
  
  const message = `🚌 Student ${actionPast}

Dear ${data.guardian_name}, your child ${data.student_name} has been ${actionText} by Bus #${data.bus_number} (Driver: ${data.driver_name}) at ${data.time}.

${data.action === 'pickup' ? `📍 Pickup location: ${data.pickup_point}` : '✅ Drop-off completed.'}

- Sishu Tirtha Safe Route`;

  // Format phone number for SMS (ensure it starts with +91 for India)
  const formattedTo = data.guardian_mobile.startsWith('+91') ? data.guardian_mobile : `+91${data.guardian_mobile}`;

  console.log('Student SMS formatting:', {
    originalTo: data.guardian_mobile,
    formattedTo,
    from: twilioPhoneNumber,
    messageLength: message.length,
    action: data.action
  });

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  
  const body = new URLSearchParams({
    To: formattedTo,
    From: twilioPhoneNumber,
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
    console.error('Student SMS API Response:', {
      status: response.status,
      statusText: response.statusText,
      error
    });
    throw new Error(`Twilio SMS API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  console.log(`Student action SMS sent successfully to ${formattedTo}: ${actionText}`);
  
  return {
    success: true,
    message: 'Student action SMS sent successfully',
    to: formattedTo,
    content: message,
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

    const data: StudentActionSMSRequest = await req.json();

    if (!data.student_name || !data.guardian_name || !data.guardian_mobile || !data.action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send student action SMS
    const smsResult = await sendStudentActionSMS(data);

    // Log the SMS in user_logs table
    await supabaseClient
      .from('user_logs')
      .insert({
        user_id: data.guardian_mobile,
        user_type: 'guardian',
        user_name: data.guardian_name,
        location: 'SMS Service',
        ip_address: 'Edge Function',
        device_info: `Student ${data.action} SMS sent`
      });

    console.log('Student action SMS sent successfully:', smsResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: smsResult,
        message: 'Student action SMS sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Student action SMS error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});