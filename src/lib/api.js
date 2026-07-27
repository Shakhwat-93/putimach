import { supabase } from './supabase';

// ==================== AUTH ====================
export async function loginAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function logoutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ==================== CATEGORIES ====================
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, data, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    created_at: row.created_at,
    ...row.data
  }));
}

export async function createCategory(categoryData) {
  const payload = {
    id: categoryData.slug || 'cat-' + Date.now(),
    data: categoryData,
    created_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('categories')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, created_at: data.created_at, ...data.data };
}

export async function updateCategory(id, categoryData) {
  const { data, error } = await supabase
    .from('categories')
    .update({ data: categoryData })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, created_at: data.created_at, ...data.data };
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ==================== PRODUCTS ====================
export async function getProducts(options = {}) {
  const { data, error } = await supabase
    .from('products')
    .select('id, data, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;

  let list = (data || []).map(row => ({
    id: row.id,
    created_at: row.created_at,
    ...row.data
  }));

  // Fetch corresponding inventory items to sync stock status
  const inventoryIds = list.map(p => p.inventory_id).filter(Boolean);
  if (inventoryIds.length > 0) {
    try {
      const { data: invData, error: invErr } = await supabase
        .from('inventory')
        .select('id, current_stock')
        .in('id', inventoryIds);
      
      if (!invErr && invData) {
        const invMap = {};
        invData.forEach(item => {
          invMap[item.id] = item;
        });
        list = list.map(p => {
          if (p.inventory_id && invMap[p.inventory_id]) {
            p.inventory = invMap[p.inventory_id];
          }
          return p;
        });
      }
    } catch (e) {
      console.error('Error syncing inventory for products:', e);
    }
  }

  if (options.category && options.category !== 'all') {
    list = list.filter(p => p.category === options.category);
  }

  return list;
}

export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select('id, data, created_at')
    .eq('data->>slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const product = { id: data.id, created_at: data.created_at, ...data.data };

  if (product.inventory_id) {
    try {
      const { data: invData, error: invErr } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', product.inventory_id)
        .maybeSingle();
      if (!invErr && invData) {
        product.inventory = invData;
      }
    } catch (e) {
      console.error('Error syncing inventory for product details:', e);
    }
  }
  return product;
}

export async function createProduct(productData) {
  const payload = {
    id: productData.slug || 'prod-' + Date.now(),
    data: productData,
    created_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('products')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, created_at: data.created_at, ...data.data };
}

export async function updateProduct(id, productData) {
  const { data, error } = await supabase
    .from('products')
    .update({ data: productData })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, created_at: data.created_at, ...data.data };
}

export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ==================== SITE SETTINGS ====================
export async function getSiteSettings(key) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('data')
    .eq('id', key)
    .maybeSingle();
  if (error) throw error;
  return data?.data || null;
}

export async function updateSiteSettings(key, value) {
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({ id: key, data: value, created_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data?.data || value;
}

// ==================== ORDERS ====================
export async function createOrder(orderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
