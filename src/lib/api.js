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

// Global in-memory cache for 0ms route transitions
let productsCache = { data: null, time: 0 };
let categoriesCache = { data: null, time: 0 };
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes TTL

export function invalidateCache() {
  productsCache = { data: null, time: 0 };
  categoriesCache = { data: null, time: 0 };
}

// ==================== CATEGORIES ====================
export async function getCategories(options = {}) {
  if (!options.forceRefresh && categoriesCache.data && (Date.now() - categoriesCache.time < CACHE_TTL_MS)) {
    return categoriesCache.data;
  }

  const { data, error } = await supabase
    .from('categories')
    .select('id, data, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;

  const list = (data || []).map(row => ({
    id: row.id,
    created_at: row.created_at,
    ...row.data
  }));

  categoriesCache = { data: list, time: Date.now() };
  return list;
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
  invalidateCache();
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
  invalidateCache();
  return { id: data.id, created_at: data.created_at, ...data.data };
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
  invalidateCache();
}

// ==================== PRODUCTS ====================
export async function getProducts(options = {}) {
  if (!options.forceRefresh && productsCache.data && (Date.now() - productsCache.time < CACHE_TTL_MS)) {
    let list = productsCache.data;
    if (options.category && options.category !== 'all') {
      list = list.filter(p => p.category === options.category);
    }
    return list;
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, data, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;

  let list = (data || []).map(row => ({
    id: row.id,
    created_at: row.created_at,
    slug: row.data?.slug || row.id,
    ...row.data
  }));

  productsCache = { data: list, time: Date.now() };

  // Fetch corresponding inventory items in background without blocking initial paint
  const inventoryIds = list.map(p => p.inventory_id).filter(Boolean);
  if (inventoryIds.length > 0) {
    supabase
      .from('inventory')
      .select('id, current_stock')
      .in('id', inventoryIds)
      .then(({ data: invData, error: invErr }) => {
        if (!invErr && invData) {
          const invMap = {};
          invData.forEach(item => { invMap[item.id] = item; });
          list.forEach(p => {
            if (p.inventory_id && invMap[p.inventory_id]) {
              p.inventory = invMap[p.inventory_id];
            }
          });
        }
      })
      .catch(e => console.warn('Background inventory sync notice:', e));
  }

  if (options.category && options.category !== 'all') {
    list = list.filter(p => p.category === options.category);
  }

  return list;
}

export async function getProductBySlug(slug) {
  if (!slug) return null;

  // 1. Instant Memory Cache Hit (0ms)
  if (productsCache.data) {
    const cached = productsCache.data.find(
      p => p.id === slug || p.slug === slug || p.id?.toLowerCase() === slug?.toLowerCase() || p.slug?.toLowerCase() === slug?.toLowerCase()
    );
    if (cached) return cached;
  }

  // 2. Primary Key Direct Lookup (1ms Postgres Index Query)
  let { data, error } = await supabase
    .from('products')
    .select('id, data, created_at')
    .eq('id', slug)
    .maybeSingle();

  // 3. Fallback to data->>slug query
  if (!data && !error) {
    const res = await supabase
      .from('products')
      .select('id, data, created_at')
      .eq('data->>slug', slug)
      .maybeSingle();
    data = res.data;
  }

  if (!data) return null;
  const product = { id: data.id, created_at: data.created_at, slug: data.data?.slug || data.id, ...data.data };

  if (product.inventory_id) {
    supabase
      .from('inventory')
      .select('*')
      .eq('id', product.inventory_id)
      .maybeSingle()
      .then(({ data: invData }) => {
        if (invData) product.inventory = invData;
      })
      .catch(() => {});
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
  invalidateCache();
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
  invalidateCache();
  return { id: data.id, created_at: data.created_at, ...data.data };
}

export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  if (error) throw error;
  invalidateCache();
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
