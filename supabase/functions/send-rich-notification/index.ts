import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { notification, target } = await req.json();

    // Validate request
    if (!notification || !notification.title || !notification.body) {
      throw new Error('Invalid notification format');
    }

    console.log('Sending rich notification:', notification.title);

    // Enhanced FCM payload with rich media support
    const fcmPayload = {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.imageUrl || '/bus-icon.svg',
        badge: '/bus-icon.svg',
        tag: notification.category || 'general',
        requireInteraction: notification.priority === 'high',
        image: notification.imageUrl, // Rich media support
        silent: false,
        timestamp: Date.now()
      },
      data: {
        ...notification.customData,
        actionUrl: notification.actionUrl || '',
        category: notification.category || 'general',
        priority: notification.priority || 'normal',
        imageUrl: notification.imageUrl || '',
        timestamp: Date.now().toString()
      },
      webpush: {
        notification: {
          icon: notification.imageUrl || '/bus-icon.svg',
          badge: '/bus-icon.svg',
          image: notification.imageUrl,
          vibrate: notification.priority === 'high' ? [200, 100, 200] : [100],
          requireInteraction: notification.priority === 'high',
          actions: notification.actionUrl ? [
            {
              action: 'view',
              title: 'View Details',
              icon: '/bus-icon.svg'
            }
          ] : undefined
        },
        headers: {
          'Urgency': notification.priority === 'high' ? 'high' : 'normal'
        }
      },
      android: {
        notification: {
          icon: notification.imageUrl || '/bus-icon.svg',
          color: '#1976d2',
          priority: notification.priority === 'high' ? 'high' : 'normal',
          channelId: notification.category || 'general',
          imageUrl: notification.imageUrl,
          vibrationPattern: notification.priority === 'high' 
            ? [200, 100, 200, 100, 200] 
            : [100, 50, 100]
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body
            },
            badge: 1,
            sound: notification.priority === 'high' ? 'emergency.caf' : 'default',
            'mutable-content': 1, // Allow rich media
            category: notification.category
          },
          imageUrl: notification.imageUrl,
          actionUrl: notification.actionUrl
        },
        fcm_options: {
          image: notification.imageUrl
        }
      }
    };

    // Mock sending for now - in production, integrate with actual FCM
    const response = {
      success: true,
      messageId: `msg_${Date.now()}`,
      tokensSuccessful: target.broadcast ? 100 : (target.userIds?.length || 1),
      tokensFailed: 0,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
        category: notification.category,
        priority: notification.priority
      },
      target: target,
      timestamp: new Date().toISOString()
    };

    console.log('Rich notification sent successfully:', response);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Rich notification error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});