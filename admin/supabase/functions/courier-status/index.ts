import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

interface SteadfastConfig {
  api_key: string;
  secret_key: string;
  is_enabled: boolean;
}

interface PathaoConfig {
  base_url?: string;
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
  is_enabled: boolean;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, trackingCode } = await req.json();

    if (!trackingCode) {
      throw new Error('Missing trackingCode');
    }

    // 1. Determine courier name
    let courierName = '';
    const { data: orderData } = await supabaseClient
      .from('orders')
      .select('courier_name')
      .eq('tracking_id', trackingCode)
      .maybeSingle();

    if (orderData?.courier_name) {
      courierName = orderData.courier_name;
    } else if (orderId) {
      const { data: orderDataById } = await supabaseClient
        .from('orders')
        .select('courier_name')
        .eq('id', orderId)
        .maybeSingle();
      if (orderDataById?.courier_name) {
        courierName = orderDataById.courier_name;
      }
    }

    const isPathao = String(courierName).toLowerCase() === 'pathao';

    if (isPathao) {
      // --- PATHAO TRACKING ---
      const { data: configData, error: configError } = await supabaseClient
        .from('system_configs')
        .select('value')
        .eq('key', 'courier_pathao')
        .single();

      if (configError || !configData) {
        throw new Error('Pathao configuration not found');
      }

      const config = configData.value as PathaoConfig;
      if (!config.is_enabled) {
        throw new Error('Pathao integration is disabled');
      }

      const baseUrl = config.base_url || 'https://courier-api.pathao.com';

      // Issue token
      const authRes = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: config.client_id,
          client_secret: config.client_secret,
          username: config.username,
          password: config.password
        })
      });

      if (!authRes.ok) {
        throw new Error(`Pathao token generation failed: ${authRes.statusText}`);
      }

      const authData = await authRes.json();
      const accessToken = authData.access_token;

      // Fetch order info
      const response = await fetch(`${baseUrl}/aladdin/api/v1/orders/${trackingCode}/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok && result.code === 200 && result.data) {
        const courierStatus = result.data.order_status || 'Pending';
        
        await supabaseClient
          .from('orders')
          .update({
            courier_status: courierStatus,
            updated_at: new Date().toISOString()
          })
          .eq('tracking_id', trackingCode);

        return new Response(JSON.stringify(result.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          error: result.message || 'Pathao Status Error',
          details: result 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

    } else {
      // --- STEADFAST TRACKING ---
      const { data: configData, error: configError } = await supabaseClient
        .from('system_configs')
        .select('value')
        .eq('key', 'courier_steadfast')
        .single();

      if (configError || !configData) {
        throw new Error('Steadfast configuration not found');
      }

      const config = configData.value as SteadfastConfig;

      const response = await fetch(`https://portal.steadfast.com.bd/api/v1/status_by_tracking/${trackingCode}`, {
        method: 'GET',
        headers: {
          'Api-Key': config.api_key,
          'Secret-Key': config.secret_key,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok && result.status === 200) {
        const courierStatus = result.delivery_status || 'pending';
        const consignmentId = result.consignment_id || result.id;

        const updatePayload: any = {
          courier_status: courierStatus,
          updated_at: new Date().toISOString()
        };

        if (consignmentId) {
          updatePayload.courier_assigned_id = String(consignmentId);
        }

        await supabaseClient
          .from('orders')
          .update(updatePayload)
          .eq('tracking_id', trackingCode);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          error: result.message || 'Steadfast Status Error',
          details: result 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Status Sync Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
