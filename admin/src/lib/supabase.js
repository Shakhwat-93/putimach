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

// Transparent routing proxy to support multi-database split
export const supabase = new Proxy({}, {
  get(target, prop) {
    if (prop === 'from') {
      return (tableName) => {
        // 1. Catalog DB tables (supabaseOthers: nmomvkssloqnhogndlwg)
        if (tableName === 'products' || tableName === 'cb_products') {
          return supabaseOthers.from('cb_products');
        }
        if (tableName === 'categories' || tableName === 'cb_categories') {
          return supabaseOthers.from('cb_categories');
        }
        if (tableName === 'site_settings' || tableName === 'system_configs' || tableName === 'cb_settings') {
          return supabaseOthers.from('cb_settings');
        }

        // 2. All operational & management tables (orders, users, user_roles, inventory,
        // toy_box_inventory, daily_tasks, task_completions, assigned_tasks, notifications, etc.)
        // live in the ORDERS database (supabaseOrders: tvoxogfqxxilvudtdfdj)
        return supabaseOrders.from(tableName);
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
    const value = supabaseOrders[prop] || supabaseOthers[prop];
    if (typeof value === 'function') {
      return value.bind(supabaseOrders);
    }
    return value;
  }
});
