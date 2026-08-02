import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── SIMPLE ZERO-DEPENDENCY .ENV PARSER ──
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      // Remove surrounding quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

// Initialize Supabase Clients using process.env
const catalogUrl = process.env.VITE_SUPABASE_URL;
const catalogKey = process.env.VITE_SUPABASE_ANON_KEY;
const ordersUrl = process.env.VITE_SUPABASE_ORDERS_URL;
const ordersKey = process.env.VITE_SUPABASE_ORDERS_ANON_KEY;

if (!catalogUrl || !catalogKey) {
  console.warn('Warning: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY variables in .env file.');
}

const supabaseOthers = createClient(catalogUrl || '', catalogKey || '');
const supabaseOrders = ordersUrl && ordersKey ? createClient(ordersUrl, ordersKey) : supabaseOthers;

const getOrderById = async (orderId) => {
  const { data, error } = await supabaseOrders
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (error) throw error;
  return data;
};

const getSystemConfig = async (key) => {
  // 1. Try cb_settings (id, data) in catalog DB
  try {
    const { data } = await supabaseOthers
      .from('cb_settings')
      .select('data')
      .eq('id', key)
      .maybeSingle();

    if (data && data.data) {
      return data.data;
    }
  } catch (e) {
    console.warn('[getSystemConfig] cb_settings query failed:', e.message);
  }

  // 2. Try site_settings (id, data)
  try {
    const { data } = await supabaseOthers
      .from('site_settings')
      .select('data')
      .eq('id', key)
      .maybeSingle();

    if (data && data.data) {
      return data.data;
    }
  } catch (e) {
    console.warn('[getSystemConfig] site_settings query failed:', e.message);
  }

  // 3. Fallback to legacy system_configs (key, value)
  try {
    const { data } = await supabaseOthers
      .from('system_configs')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (data && data.value) {
      return data.value;
    }
  } catch (e) {
    console.warn('[getSystemConfig] system_configs query failed:', e.message);
  }

  return null;
};


const updateOrderCourierDetails = async (orderId, updates) => {
  const { error } = await supabaseOrders
    .from('orders')
    .update(updates)
    .eq('id', orderId);
  if (error) throw error;
  return true;
};

const addOrderActivityLog = async (logData) => {
  const { error } = await supabaseOrders
    .from('order_activity_logs')
    .insert([logData]);
  if (error) throw error;
  return true;
};

// ── COURIER DISPATCH PROXY ──
app.post('/admin-api/courier-dispatch', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Missing orderId' });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: `Order not found: ${orderId}` });
    }

    const config = await getSystemConfig('courier_steadfast');
    if (!config || !config.is_enabled) {
      return res.status(400).json({ success: false, error: 'Steadfast integration is disabled or not configured.' });
    }

    const payload = {
      invoice: order.id,
      recipient_name: order.customer_name,
      recipient_phone: order.phone,
      recipient_address: order.address || 'Dhaka, Bangladesh',
      cod_amount: parseFloat(String(order.amount || 0)),
      note: `${order.product_name || ''} ${order.size ? `(Size: ${order.size})` : ''}`.slice(0, 250)
    };

    console.log(`Submitting order ${orderId} to Steadfast via proxy...`);
    console.log('Payload:', JSON.stringify(payload));

    // Official Steadfast API base URL: https://portal.packzy.com/api/v1
    let response;
    try {
      response = await fetch('https://portal.packzy.com/api/v1/create_order', {
        method: 'POST',
        headers: {
          'Api-Key': config.api_key,
          'Secret-Key': config.secret_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (fetchErr) {
      console.error('Primary Steadfast URL failed, trying alternate...', fetchErr.message);
      response = await fetch('https://portal.steadfast.com.bd/api/v1/create_order', {
        method: 'POST',
        headers: {
          'Api-Key': config.api_key,
          'Secret-Key': config.secret_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Steadfast API returned non-JSON response (HTTP ${response.status}): ${responseText.slice(0, 300)}`);
    }

    if (response.ok && (result.status === 200 || result.status === 201)) {
      const consignment = result.consignment || result;
      const trackingCode = consignment.tracking_code;
      const consignmentId = consignment.consignment_id || consignment.id;

      await updateOrderCourierDetails(orderId, {
        tracking_id: trackingCode,
        courier_assigned_id: consignmentId ? String(consignmentId) : null,
        courier_name: 'Steadfast',
        status: 'Courier Submitted',
        updated_at: new Date().toISOString()
      });

      // Log activity (non-fatal if it fails)
      try {
        await addOrderActivityLog({
          order_id: orderId,
          action_type: 'COURIER_DISPATCH',
          action_description: `Order successfully submitted to Steadfast. Consignment ID: ${consignmentId}, Tracking: ${trackingCode}`,
          changed_by_user_name: 'Steadfast Automation'
        });
      } catch (logErr) {
        console.warn('Activity log insert failed (non-fatal):', logErr.message);
      }

      return res.json({
        success: true,
        trackingCode,
        consignmentId,
        details: result
      });
    } else {
      const errorMsg = result.errors ? JSON.stringify(result.errors) : (result.message || 'Unknown Courier Error');
      console.error('Steadfast API Error:', errorMsg, '| Full response:', JSON.stringify(result));

      // Log activity (non-fatal if it fails)
      try {
        await addOrderActivityLog({
          order_id: orderId,
          action_type: 'COURIER_ERROR',
          action_description: `Failed to submit to Steadfast: ${errorMsg}`,
          changed_by_user_name: 'Steadfast Automation'
        });
      } catch (logErr) {
        console.warn('Activity log insert failed (non-fatal):', logErr.message);
      }

      return res.status(400).json({
        success: false,
        error: `Steadfast Dispatch Failed: ${errorMsg}`,
        details: result
      });
    }
  } catch (error) {
    console.error('Proxy Courier Dispatch Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ── COURIER STATUS PROXY ──
app.post('/admin-api/courier-status', async (req, res) => {
  try {
    const { orderId, trackingCode } = req.body;
    if (!trackingCode) {
      return res.status(400).json({ success: false, error: 'Missing trackingCode' });
    }

    let courierName = 'Steadfast';
    if (orderId) {
      const order = await getOrderById(orderId);
      if (order?.courier_name) courierName = order.courier_name;
    }

    const isPathao = String(courierName).toLowerCase() === 'pathao';

    if (isPathao) {
      const config = await getSystemConfig('courier_pathao');
      if (!config || !config.is_enabled) {
        return res.status(400).json({ success: false, error: 'Pathao integration is disabled.' });
      }

      const baseUrl = config.base_url || 'https://courier-api.pathao.com';

      const authRes = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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

      const response = await fetch(`${baseUrl}/aladdin/api/v1/orders/${trackingCode}/info`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
      });

      const result = await response.json();

      if (response.ok && result.code === 200 && result.data) {
        const courierStatus = result.data.order_status || 'Pending';
        if (orderId) {
          await updateOrderCourierDetails(orderId, {
            courier_status: courierStatus,
            updated_at: new Date().toISOString()
          });
        }
        return res.json(result.data);
      } else {
        return res.status(400).json({ success: false, error: result.message || 'Pathao Status Error', details: result });
      }
    } else {
      const config = await getSystemConfig('courier_steadfast');
      if (!config) {
        return res.status(400).json({ success: false, error: 'Steadfast configuration not found.' });
      }

      let response;
      try {
        response = await fetch(`https://steadfast.com.bd/api/v1/status_by_tracking/${trackingCode}`, {
          method: 'GET',
          headers: {
            'Api-Key': config.api_key,
            'Secret-Key': config.secret_key,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        response = await fetch(`https://portal.steadfast.com.bd/api/v1/status_by_tracking/${trackingCode}`, {
          method: 'GET',
          headers: {
            'Api-Key': config.api_key,
            'Secret-Key': config.secret_key,
            'Content-Type': 'application/json'
          }
        });
      }

      const result = await response.json();

      if (response.ok && result.status === 200) {
        const courierStatus = result.delivery_status || 'pending';
        const consignmentId = result.consignment_id || result.id;

        if (orderId) {
          const updatePayload = {
            courier_status: courierStatus,
            updated_at: new Date().toISOString()
          };
          if (consignmentId) {
            updatePayload.courier_assigned_id = String(consignmentId);
          }
          await updateOrderCourierDetails(orderId, updatePayload);
        }
        return res.json(result);
      } else {
        return res.status(400).json({ success: false, error: result.message || 'Steadfast Status Error', details: result });
      }
    }
  } catch (error) {
    console.error('Proxy Courier Status Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ── COURIER RATIO CHECK PROXY ──
app.post('/admin-api/courier-ratio-check', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Missing phone' });
    }

    const fraudConfig = await getSystemConfig('fraud_checker_bd');
    let response = null;
    let isFraudCheckerUsed = false;
    let lastError = '';

    if (fraudConfig && fraudConfig.is_enabled && fraudConfig.api_key) {
      isFraudCheckerUsed = true;
      const token = fraudConfig.api_key;
      const baseUrl = fraudConfig.api_url || 'https://api.bdcourier.com/courier-check';
      const isBdCourier = baseUrl.includes('api.bdcourier.com') || baseUrl.includes('courier-check');

      try {
        if (isBdCourier) {
          response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ phone })
          });
        } else {
          let url = baseUrl;
          if (url.includes('{phone}')) {
            url = url.replace('{phone}', phone);
          } else {
            url = url.endsWith('/') ? `${url}${phone}` : `${url}/${phone}`;
          }
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'api-key': token,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }

        if (response && response.ok) {
          const bodyJson = await response.clone().json().catch(() => null);
          if (bodyJson && (bodyJson.status === 'error' || bodyJson.success === false)) {
            lastError = `BD Courier App Error: ${bodyJson.message || bodyJson.error}`;
            response = null;
          }
        } else {
          lastError = `BD Courier HTTP Error ${response ? response.status : 'Unknown'}`;
          response = null;
        }
      } catch (err) {
        lastError = `BD Courier Request Failed: ${err.message}`;
      }
    }

    if (!isFraudCheckerUsed || !response || !response.ok) {
      try {
        const config = await getSystemConfig('courier_steadfast');
        if (config && config.is_enabled && config.api_key) {
          try {
            response = await fetch(`https://steadfast.com.bd/api/v1/fraud_check/${phone}`, {
              method: 'GET',
              headers: {
                'Api-Key': config.api_key,
                'Secret-Key': config.secret_key,
                'Content-Type': 'application/json'
              }
            });
          } catch (err) {
            response = await fetch(`https://portal.steadfast.com.bd/api/v1/fraud_check/${phone}`, {
              method: 'GET',
              headers: {
                'Api-Key': config.api_key,
                'Secret-Key': config.secret_key,
                'Content-Type': 'application/json'
              }
            });
          }
        }
      } catch (err) {
        lastError = lastError ? `${lastError}. Steadfast error: ${err.message}` : `Steadfast error: ${err.message}`;
      }
    }

    if (!response) {
      return res.status(400).json({ success: false, error: lastError || 'No response from courier provider' });
    }

    const result = await response.json();
    return res.json({
      success: true,
      stats: result,
      isLimitReached: result.message?.toLowerCase().includes('limit') || false
    });
  } catch (error) {
    console.error('Proxy Courier Ratio Check Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ── IMAGE UPLOAD HANDLING ──
const UPLOADS_DIR_DEV = path.join(__dirname, 'public', 'uploads');
const UPLOADS_DIR_PROD = path.join(__dirname, 'dist', 'uploads');

if (!fs.existsSync(UPLOADS_DIR_DEV)) {
  fs.mkdirSync(UPLOADS_DIR_DEV, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR_PROD)) {
  fs.mkdirSync(UPLOADS_DIR_PROD, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR_DEV);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webp';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `img_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

app.post(['/admin-api/upload', '/admin-api/upload-local'], upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const filename = req.file.filename;
    
    // Copy the file to the prod directory so it's instantly served
    const sourcePath = path.join(UPLOADS_DIR_DEV, filename);
    const destPath = path.join(UPLOADS_DIR_PROD, filename);
    
    fs.copyFileSync(sourcePath, destPath);

    const publicUrl = `/uploads/${filename}`;
    console.log(`Successfully uploaded image and copied to build: ${publicUrl}`);
    
    return res.json({
      success: true,
      url: publicUrl
    });
  } catch (err) {
    console.error('File upload route error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── SITE SETTINGS API (bypasses browser auth/cache completely) ──
app.get('/admin-api/site-settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { data, error } = await supabaseOthers
      .from('cb_settings')
      .select('data')
      .eq('id', key)
      .maybeSingle();
    if (error) throw error;
    
    // Completely disable caching for settings
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.json({ success: true, data: data?.data || null });
  } catch (err) {
    console.error('site-settings GET error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/admin-api/site-settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { data: newData } = req.body;
    
    console.log(`\n=== SERVER POST API: /admin-api/site-settings/${key} ===`);
    console.log('Received payload data:', JSON.stringify(newData));

    if (!newData) {
      console.log('Error: Missing data');
      return res.status(400).json({ success: false, error: 'Missing data' });
    }

    // Try update first
    const { data: upd, error: updErr } = await supabaseOthers
      .from('cb_settings')
      .update({ data: newData, created_at: new Date().toISOString() })
      .eq('id', key)
      .select();
    
    console.log('Update query returned error:', updErr);
    console.log('Update query returned data (upd):', JSON.stringify(upd));

    if (updErr) throw updErr;

    if (!upd || upd.length === 0) {
      console.log('Update affected 0 rows. Row does not exist. Attempting Insert.');
      // Row doesn't exist, insert it
      const { error: insErr } = await supabaseOthers
        .from('cb_settings')
        .insert({ id: key, data: newData, created_at: new Date().toISOString() });
      console.log('Insert query returned error:', insErr);
      if (insErr) throw insErr;
    }

    // Verify what was saved
    const { data: verified, error: verErr } = await supabaseOthers
      .from('cb_settings')
      .select('data')
      .eq('id', key)
      .maybeSingle();
    
    console.log('Verify select query returned error:', verErr);
    console.log('Verify select query returned data:', JSON.stringify(verified));

    if (verErr) throw verErr;

    return res.json({ success: true, data: verified?.data || newData });
  } catch (err) {
    console.error('site-settings POST error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── SERVE STATIC SPA ASSETS ──
// Serve uploaded images from public/uploads (dev) and dist/uploads (prod)
app.use('/uploads', express.static(UPLOADS_DIR_DEV));
app.use('/uploads', express.static(UPLOADS_DIR_PROD));

// Serve the compiled storefront SPA and admin sub-app from dist/
const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

// Serve admin sub-app index for /admin and /admin/* routes
app.get(['/admin', '/admin/*'], (req, res) => {
  const adminIndex = path.join(__dirname, 'dist', 'admin', 'index.html');
  if (fs.existsSync(adminIndex)) {
    res.sendFile(adminIndex);
  } else {
    res.status(404).send('Admin panel not built. Run: npm run build');
  }
});

// Fallback for storefront SPA routes (like /shop, /checkout, /product/:slug, etc.)
app.get('*', (req, res) => {
  const storefrontIndex = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(storefrontIndex)) {
    res.sendFile(storefrontIndex);
  } else {
    res.status(404).send('Storefront not built. Run: npm run build');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Pure React SPA Server running locally on http://localhost:${PORT}`);
});
