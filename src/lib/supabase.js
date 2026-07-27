import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const ordersUrl = import.meta.env.VITE_SUPABASE_ORDERS_URL;
const ordersAnonKey = import.meta.env.VITE_SUPABASE_ORDERS_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseOthers = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
});
const supabaseOrders = ordersUrl && ordersAnonKey ? createClient(ordersUrl, ordersAnonKey, {
  global: {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
}) : supabaseOthers;

// Transparent routing proxy to support multi-database split
export const supabase = new Proxy({}, {
  get(target, prop) {
    if (prop === 'from') {
      return (tableName) => {
        if (tableName === 'products') {
          return supabaseOthers.from('cb_products');
        }
        if (tableName === 'categories') {
          return supabaseOthers.from('cb_categories');
        }
        if (tableName === 'site_settings') {
          return supabaseOthers.from('cb_settings');
        }
        if (['orders', 'order_activity_logs', 'courier_ratio_cache', 'blocked_ip_addresses', 'retained_cancelled_ips'].includes(tableName)) {
          return supabaseOrders.from(tableName);
        }
        return supabaseOthers.from(tableName);
      };
    }
    const value = supabaseOthers[prop];
    if (typeof value === 'function') {
      return value.bind(supabaseOthers);
    }
    return value;
  }
});
