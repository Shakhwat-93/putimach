import { createClient } from '@supabase/supabase-js';
import { isNativeApp } from '../platform/runtime';
import { getLocalStorage } from '../platform/storage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const ordersUrl = import.meta.env.VITE_SUPABASE_ORDERS_URL;
const ordersAnonKey = import.meta.env.VITE_SUPABASE_ORDERS_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel Project Settings.");
}

const supabaseOthers = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !isNativeApp(),
    storage: getLocalStorage()
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
});

const supabaseOrders = ordersUrl && ordersAnonKey ? createClient(ordersUrl, ordersAnonKey) : supabaseOthers;

// Tables that live in the ORDERS database (tvoxogfqxxilvudtdfdj)
const ORDERS_DB_TABLES = new Set([
  'orders',
  'order_activity_logs',
  'courier_ratio_cache',
  'blocked_ip_addresses',
  'retained_cancelled_ips',
  'users',
  'user_roles',
  'inventory',
  'toy_box_inventory',
  'daily_tasks',
  'task_completions',
  'assigned_tasks',
  'task_activity_logs',
  'notifications',
  'system_configs',
  'ads_campaigns',
  'content_plans',
  'content_activity_logs',
  'finance_planning',
  'factory_logs',
]);

// Transparent routing proxy to support multi-database split
export const supabase = new Proxy({}, {
  get(target, prop) {
    if (prop === 'from') {
      return (tableName) => {
        // Canonical name aliases for catalog tables
        if (tableName === 'products') {
          return supabaseOthers.from('cb_products');
        }
        if (tableName === 'categories') {
          return supabaseOthers.from('cb_categories');
        }
        if (tableName === 'site_settings') {
          return supabaseOthers.from('cb_settings');
        }
        // Route order-specific tables to orders DB
        if (ORDERS_DB_TABLES.has(tableName)) {
          return supabaseOrders.from(tableName);
        }
        // All other tables (users, user_roles, inventory, system_configs,
        // notifications, ads_campaigns, content_plans, content_activity_logs,
        // task_activity_logs, cb_products, cb_categories, cb_settings, etc.)
        // live in the catalog DB (supabaseOthers)
        return supabaseOthers.from(tableName);
      };
    }
    if (prop === 'functions') {
      return {
        invoke: (functionName, options) => {
          if (functionName === 'admin-auth-actions') {
            return supabaseOthers.functions.invoke(functionName, options);
          }
          return supabaseOrders.functions.invoke(functionName, options);
        }
      };
    }
    const value = supabaseOthers[prop];
    if (typeof value === 'function') {
      return value.bind(supabaseOthers);
    }
    return value;
  }
});
