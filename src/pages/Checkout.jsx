// src/pages/Checkout.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, MapPin, MessageSquare, ShoppingBag,
  CheckCircle, Loader2, ChevronRight, Tag, Truck, CreditCard,
  ArrowLeft, Zap, Package, Mail,
} from 'lucide-react';
import useCartStore from '../store/cartStore';
import { supabase } from '../lib/supabase';
import { trackInitiateCheckout, trackPurchase } from '../lib/tracking';

const formatPrice = (p) => `৳${Number(p).toLocaleString('en-BD')}`;

const DEFAULT_SHIPPING = {
  inside: 80,
  sub: 100,
  outside: 150
};

function generateOrderNumber() {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RR-${now}-${rand}`;
}

// Get Client IP Address with fast timeout & fallback API using AbortController
async function getClientIp() {
  const fetchWithTimeout = async (url, ms = 1200) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ms);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.ip || null;
    } catch {
      return null;
    }
  };

  const ip = await fetchWithTimeout('https://api.ipify.org?format=json', 1000);
  if (ip) return ip;
  return await fetchWithTimeout('https://ipapi.co/json/', 1000);
}

// Normalize variant values for reliable case-insensitive matching
const normalizeVal = (val) => {
  if (!val) return '';
  const s = String(val).trim().toLowerCase();
  return (s === 'none' || s === 'one size' || s === 'standard') ? '' : s;
};

// Get traffic source/UTM medium from URL or referrer
function getTrafficSource() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = params.get('utm_source') || params.get('source') || params.get('ref');
    if (utm) return utm;

    const referrer = document.referrer;
    if (referrer) {
      if (referrer.includes('facebook.com') || referrer.includes('fb.me')) return 'Facebook';
      if (referrer.includes('instagram.com')) return 'Instagram';
      if (referrer.includes('tiktok.com')) return 'TikTok';
      if (referrer.includes('google.com')) return 'Google';
      return new URL(referrer).hostname;
    }
  } catch {}
  return 'Direct';
}

/* ─── Order Summary Sidebar ─────────────────────────────────────────────── */
function OrderSummary({ items, subtotal, shipping, total }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-widest text-surface-muted">
        Order Summary
      </h3>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-3">
            <div className="relative w-14 h-16 rounded-lg overflow-hidden bg-base-500 flex-shrink-0 border border-base-300">
              <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand text-white text-[10px] font-black flex items-center justify-center shadow-lg">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-surface-primary line-clamp-2">{item.product.name}</p>
              <p className="text-[10px] text-surface-muted mt-0.5">
                Size: {item.size}{item.color && item.color !== 'None' ? ` / Color: ${item.color}` : ''}
              </p>
            </div>
            <span className="text-sm font-black text-surface-primary flex-shrink-0">
              {formatPrice(item.product.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="divider" />

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-surface-muted">Subtotal</span>
          <span className="font-semibold">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-surface-muted">
            <Truck size={13} />
            <span>Delivery</span>
          </div>
          <span className={`font-semibold ${shipping === 0 ? 'text-emerald-400' : ''}`}>
            {shipping === 0 ? 'FREE' : formatPrice(shipping)}
          </span>
        </div>
      </div>

      <div className="divider" />

      <div className="flex items-center justify-between">
        <span className="font-bold text-surface-primary">Total</span>
        <span className="font-black text-xl text-brand">{formatPrice(total)}</span>
      </div>

      {/* Trust badges */}
      <div className="mt-4 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-start gap-2.5">
        <CheckCircle size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-emerald-300 leading-relaxed">
          Cash on Delivery available. Pay when your order arrives at your door.
        </p>
      </div>
    </div>
  );
}

/* ─── Field Component ───────────────────────────────────────────────────── */
function Field({ label, icon: Icon, required, children, hint }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-surface-secondary mb-1.5">
        <Icon size={11} className="text-brand" />
        {label} {required && <span className="text-brand">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-surface-muted mt-1">{hint}</p>}
    </div>
  );
}

/* ─── Success Screen ────────────────────────────────────────────────────── */
function SuccessScreen({ orderNumber, items, total, onContinue }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-16 pb-20 px-4 relative overflow-hidden">
      {/* Ambient glows — lightweight radial gradient behind page to prevent WebKit blur filter lag */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(circle 500px at 50% 15%, rgba(197, 168, 128, 0.06), transparent 70%), radial-gradient(circle 400px at 25% 85%, rgba(16, 185, 129, 0.05), transparent 70%)'
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto">

        {/* ── Icon ── */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center mb-6"
        >
          <CheckCircle size={32} className="text-emerald-400" strokeWidth={2} />
        </motion.div>

        {/* ── Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand mb-3">
            Order Confirmed
          </p>
          <h1 className="font-black text-4xl text-surface-primary mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Thank you! 🔥
          </h1>
          <p className="text-surface-muted text-sm">
            Your order has been placed successfully.
          </p>
        </motion.div>

        {/* ── Order Number Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="card p-4 mb-3"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-muted mb-1">Order Number</p>
              <p className="font-mono font-black text-lg text-brand tracking-wide">{orderNumber}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-brand/12 border border-brand/20 flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-brand" />
            </div>
          </div>
          <div className="pt-3 border-t border-base-300/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-surface-muted">
              <Truck size={12} />
              <span className="text-xs">Cash on Delivery</span>
            </div>
            <span className="font-black text-base text-surface-primary">{formatPrice(total)}</span>
          </div>
        </motion.div>

        {/* ── Items ── */}
        {items && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
            className="card p-4 mb-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-surface-muted mb-3">
              What you ordered
            </p>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <div className="w-10 h-11 rounded-lg overflow-hidden bg-base-500 flex-shrink-0 border border-base-300">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-surface-primary line-clamp-1">{item.product.name}</p>
                    <p className="text-[11px] text-surface-muted mt-0.5">
                      Size {item.size}{item.color && item.color !== 'None' ? ` · Color ${item.color}` : ''} · ×{item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-black text-surface-primary flex-shrink-0">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── What Happens Next ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-4 mb-6"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-surface-muted mb-4">
            What happens next
          </p>
          <div className="space-y-3">
            {[
              { icon: Phone,       label: 'Confirmation call',  desc: 'We\'ll call you shortly to confirm.',   color: 'text-brand bg-brand/10 border-brand/20' },
              { icon: Package,     label: 'Packing',            desc: 'Order packed & ready for dispatch.',   color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
              { icon: Truck,       label: 'Out for delivery',   desc: '2–4 business days to your door.',      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
              { icon: CheckCircle, label: 'Pay on arrival',     desc: 'Pay cash when order arrives.',         color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            ].map(({ icon: Icon, label, desc, color }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={12} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-surface-primary">{label}</p>
                  <p className="text-[11px] text-surface-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46 }}
        >
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl bg-brand hover:bg-brand-400 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shadow-glow mb-3"
          >
            Continue Shopping
            <ChevronRight size={15} />
          </motion.button>
          <p className="text-center text-[10px] text-surface-muted leading-relaxed">
            Save your order number <span className="font-mono text-brand font-bold">{orderNumber}</span> for reference.
          </p>
        </motion.div>

      </div>
    </div>
  );
}

/* ─── Main Checkout Page ───────────────────────────────────────────────── */
export default function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderedItems, setOrderedItems] = useState([]);

  const [shippingRates, setShippingRates] = useState(DEFAULT_SHIPPING);
  const [shippingArea, setShippingArea] = useState('inside'); // 'inside' | 'sub' | 'outside'

  // Pre-fetch Client IP in background on mount so checkout submission is instant
  const cachedIpRef = useRef(null);
  useEffect(() => {
    getClientIp().then(ip => {
      if (ip) cachedIpRef.current = ip;
    });
  }, []);

  useEffect(() => {
    async function loadRates() {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('data')
          .eq('id', 'shipping_rates')
          .maybeSingle();
        if (data && data.data) {
          setShippingRates({
            inside: Number(data.data.inside ?? DEFAULT_SHIPPING.inside),
            sub: Number(data.data.sub ?? DEFAULT_SHIPPING.sub),
            outside: Number(data.data.outside ?? DEFAULT_SHIPPING.outside)
          });
        }
      } catch (err) {
        console.warn('Failed to load dynamic shipping rates, using defaults:', err);
      }
    }
    loadRates();
  }, []);

  // Fire InitiateCheckout when user arrives on checkout page (once, when items are ready)
  const initiateCheckoutFired = useRef(false);
  useEffect(() => {
    if (items.length > 0 && !initiateCheckoutFired.current) {
      initiateCheckoutFired.current = true;
      trackInitiateCheckout(items, subtotal);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const shipping = shippingArea === 'inside'
    ? shippingRates.inside
    : shippingArea === 'sub'
      ? shippingRates.sub
      : shippingRates.outside;
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const total = subtotal + shipping;

  const setField = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setError('');
    setSubmitting(true);

    const num = generateOrderNumber();

    // 0. Stock Availability Check (Overselling Prevention across exact Colour + Size variants)
    try {
      for (const item of items) {
        const { data: dbProductRow } = await supabase
          .from('products')
          .select('id, data')
          .eq('id', item.product.id)
          .maybeSingle();

        if (dbProductRow?.data) {
          const productData = dbProductRow.data;
          const variants = Array.isArray(productData.variants) ? productData.variants : [];

          if (variants.length > 0) {
            const targetSize = normalizeVal(item.size);
            const targetColor = normalizeVal(item.color);

            const matchedVariant = variants.find(v => {
              const vSize = normalizeVal(v.size);
              const vColor = normalizeVal(v.color);
              const matchSize = (!targetSize && !vSize) || (vSize === targetSize);
              const matchColor = (!targetColor && !vColor) || (vColor === targetColor);
              return matchSize && matchColor;
            });

            if (matchedVariant) {
              const currentStock = Number(matchedVariant.stock) || 0;
              if (currentStock < item.quantity) {
                const varLabel = [
                  item.size && item.size !== 'One Size' ? `Size: ${item.size}` : '',
                  item.color && item.color !== 'None' ? `Color: ${item.color}` : ''
                ].filter(Boolean).join(', ');

                setError(
                  currentStock <= 0
                    ? `Sorry, "${item.product.name}"${varLabel ? ` (${varLabel})` : ''} is currently out of stock.`
                    : `Sorry, only ${currentStock} unit(s) available for "${item.product.name}"${varLabel ? ` (${varLabel})` : ''}. Please adjust your quantity.`
                );
                setSubmitting(false);
                return;
              }
            }
          } else if (productData.in_stock === false) {
            setError(`Sorry, "${item.product.name}" is currently out of stock.`);
            setSubmitting(false);
            return;
          }
        }
      }
    } catch (stockCheckErr) {
      console.warn('Pre-order stock verification check error:', stockCheckErr);
    }

    // 1. IP Capture & Traffic Source (Instant via background prefetch)
    const ipAddress = cachedIpRef.current || await getClientIp();
    const trafficSource = getTrafficSource();

    // 2. Blocked IP Addresses Guard (Fake Order Protection)
    if (ipAddress) {
      try {
        const { data: blockedIpData } = await supabase
          .from('blocked_ip_addresses')
          .select('ip_address, reason')
          .eq('ip_address', ipAddress)
          .eq('is_active', true)
          .maybeSingle();

        if (blockedIpData) {
          setError('Your IP address has been restricted from placing orders due to suspicious activity. Please contact support.');
          setSubmitting(false);
          return;
        }
      } catch (ipCheckErr) {
        console.warn('Failed to verify IP blocklist:', ipCheckErr);
      }
    }

    // 3. Duplicate Order Check (Spam Prevention)
    try {
      const cleanPhone = form.phone.trim();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      let duplicateQuery = supabase
        .from('orders')
        .select('id, created_at')
        .gte('created_at', fiveMinutesAgo);

      if (ipAddress) {
        duplicateQuery = duplicateQuery.or(`phone.eq.${cleanPhone},ip_address.eq.${ipAddress}`);
      } else {
        duplicateQuery = duplicateQuery.eq('phone', cleanPhone);
      }

      const { data: recentOrders } = await duplicateQuery;

      if (recentOrders && recentOrders.length > 0) {
        setError('A similar order has already been placed recently. Please wait a few minutes before trying again.');
        setSubmitting(false);
        return;
      }
    } catch (dupCheckErr) {
      console.warn('Failed to verify duplicate orders:', dupCheckErr);
    }

    const orderPayload = {
      id: num,
      customer_name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      address: `${form.address.trim()}, ${form.city.trim()}`,
      notes: form.note.trim() || null,
      ordered_items: items.map(i => ({
        id: i.product.id,
        name: i.product.name,
        slug: i.product.slug,
        image: i.product.image,
        price: i.product.price,
        size: i.size,
        color: i.color || null,
        quantity: i.quantity,
        line_total: i.product.price * i.quantity,
      })),
      amount: total,
      items: items.reduce((sum, i) => sum + i.quantity, 0),
      product_name: items[0]?.product.name || '',
      size: items[0]?.size || '',
      quantity: items[0]?.quantity || 1,
      shipping_zone: shippingArea === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka',
      source: 'Website',
      status: 'New',
      payment_status: 'Unpaid',
      ip_address: ipAddress,
      traffic_source: trafficSource,
    };

    try {
      let { error: dbError } = await supabase.from('orders').insert([orderPayload]);

      // Zero-downtime DB Schema Fallback: If DB does not have the email column, insert without it and prepend to notes
      if (dbError && (dbError.message?.toLowerCase().includes('email') || dbError.code === 'PGRST204')) {
        console.warn('Orders table does not support email column. Retrying with email in notes...');
        const fallbackPayload = { ...orderPayload };
        delete fallbackPayload.email;
        fallbackPayload.notes = `[Email: ${orderPayload.email}]` + (orderPayload.notes ? `\nNote: ${orderPayload.notes}` : '');
        
        const { error: retryError } = await supabase.from('orders').insert([fallbackPayload]);
        dbError = retryError;
      }

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Snapshot items BEFORE clearing cart so success screen can show them
      const orderedItems = [...items];

      // Decrement inventory stock and product variant stock for items
      for (const item of orderedItems) {
        try {
          // 1. Fetch latest product details — cb_products stores all fields inside a JSON `data` column
          const { data: dbProductRow } = await supabase
            .from('products')
            .select('id, data')
            .eq('id', item.product.id)
            .single();

          if (dbProductRow && dbProductRow.data) {
            const productData = dbProductRow.data;
            let updatedVariants = Array.isArray(productData.variants) ? [...productData.variants] : [];

            if (updatedVariants.length > 0) {
              const targetSize = normalizeVal(item.size);
              const targetColor = normalizeVal(item.color);

              updatedVariants = updatedVariants.map(v => {
                const vSize = normalizeVal(v.size);
                const vColor = normalizeVal(v.color);
                const sizeMatch = (!targetSize && !vSize) || (vSize === targetSize);
                const colorMatch = (!targetColor && !vColor) || (vColor === targetColor);

                if (sizeMatch && colorMatch) {
                  const currentStock = Math.max(0, Number(v.stock) || 0);
                  const newQty = Math.max(0, currentStock - item.quantity);
                  return { ...v, stock: newQty };
                }
                return v;
              });
            }

            // Recalculate total product stock across variants
            const totalStock = updatedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
            const inStock = updatedVariants.length > 0 ? (totalStock > 0) : (productData.in_stock !== false);

            // 2. Save updated variants & in_stock status back into the product's data JSONB column
            await supabase
              .from('products')
              .update({
                data: {
                  ...productData,
                  variants: updatedVariants,
                  in_stock: inStock
                }
              })
              .eq('id', dbProductRow.id);

            // 3. Decrement linked inventory item stock level if exists
            const targetInventoryId = productData.inventory_id;
            if (targetInventoryId) {
              if (updatedVariants.length > 0) {
                // If it has variants, inventory stock is the sum of variants
                await supabase
                  .from('inventory')
                  .update({ current_stock: totalStock })
                  .eq('id', targetInventoryId);
              } else {
                // Otherwise, just decrement the inventory directly
                const { data: invItem } = await supabase
                  .from('inventory')
                  .select('current_stock')
                  .eq('id', targetInventoryId)
                  .single();
                if (invItem) {
                  const newStock = Math.max(0, (invItem.current_stock || 0) - item.quantity);
                  await supabase
                    .from('inventory')
                    .update({ current_stock: newStock })
                    .eq('id', targetInventoryId);
                }
              }
            }
          }
        } catch (e) {
          console.error('Failed to update variant stock for item:', item.product.id, e);
        }
      }

      setOrderNumber(num);
      clearCart();
      setOrderedItems(orderedItems);

      // Fire Purchase tracking event
      trackPurchase(
        { ...orderPayload, ordered_items: orderedItems.map(i => ({
            id: i.product.id,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
            size: i.size,
          })),
          shipping_fee: shipping,
        },
        { phone: form.phone, email: form.email }
      );

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return <SuccessScreen orderNumber={orderNumber} items={orderedItems} total={total} onContinue={() => navigate('/')} />;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <ShoppingBag size={48} className="text-surface-muted mx-auto" />
          <h2 className="font-black text-2xl">Your cart is empty</h2>
          <p className="text-surface-muted text-sm">Add products before checking out.</p>
          <button onClick={() => navigate('/shop')} className="btn-primary mx-auto">
            Browse Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Subtle background glows — using pure CSS radial gradient in -z-10 to prevent WebKit blur filter lag and pointer obstruction */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" 
        aria-hidden="true"
        style={{
          background: 'radial-gradient(circle 500px at 95% 10%, rgba(197, 168, 128, 0.05), transparent 70%), radial-gradient(circle 450px at 5% 90%, rgba(139, 69, 19, 0.04), transparent 70%)'
        }}
      />

      <div className="container-site py-8 lg:py-12 relative z-10">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-surface-muted hover:text-surface-primary text-sm font-medium transition-colors mb-8 group cursor-pointer"
          style={{ touchAction: 'manipulation' }}
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Page heading */}
        <div className="mb-8">
          <p className="section-label mb-1">Secure Checkout</p>
          <h1 className="font-black text-3xl sm:text-4xl text-surface-primary">Complete Your Order</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-8 xl:gap-12 relative z-10 pointer-events-auto">
          {/* ── Left: Form ───────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-5">
            {/* Delivery Info Card */}
            <div className="card p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-lg bg-brand/15 border border-brand/20 flex items-center justify-center">
                  <Truck size={14} className="text-brand" />
                </div>
                <h2 className="font-black text-base text-surface-primary">Delivery Information</h2>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  ⚠️ {error}
                </div>
              )}

              <Field label="Full Name" icon={User} required>
                <input
                  required
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Arif Hossain"
                  value={form.name}
                  onChange={setField('name')}
                  className="input text-base sm:text-small"
                  id="checkout-name"
                  style={{ touchAction: 'manipulation' }}
                />
              </Field>

              <Field label="Phone Number" icon={Phone} required hint="11-digit mobile number for delivery contact">
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder="e.g. 01712345678"
                  value={form.phone}
                  onChange={setField('phone')}
                  className="input font-mono text-base sm:text-small"
                  id="checkout-phone"
                  style={{ touchAction: 'manipulation' }}
                />
              </Field>

              <Field label="Email Address" icon={Mail} hint="Optional — For order updates and confirmations">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. arif@email.com"
                  value={form.email}
                  onChange={setField('email')}
                  className="input text-base sm:text-small"
                  id="checkout-email"
                  style={{ touchAction: 'manipulation' }}
                />
              </Field>

              <Field label="Shipping Area" icon={Truck} required>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'inside', label: 'Inside Dhaka', fee: shippingRates.inside },
                    { id: 'sub', label: 'Sub Dhaka', subtitle: 'Narayanganj, Gazipur, Keraniganj', fee: shippingRates.sub },
                    { id: 'outside', label: 'Outside Dhaka', fee: shippingRates.outside }
                  ].map((area) => {
                    const isSelected = shippingArea === area.id;
                    return (
                      <button
                        type="button"
                        key={area.id}
                        onClick={() => setShippingArea(area.id)}
                        className={`text-left p-4 rounded-xl border-2 transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-[0.98] ${
                          isSelected
                            ? 'border-brand bg-brand/5 shadow-glow-sm'
                            : 'border-base-300 bg-base-950/40 hover:border-base-400'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        <div>
                          <p className="font-bold text-xs text-surface-primary">{area.label}</p>
                          {area.subtitle && (
                            <p className="text-[10px] font-semibold text-brand mt-0.5 leading-tight">{area.subtitle}</p>
                          )}
                        </div>
                        <p className="font-black text-sm text-brand mt-3">৳{area.fee}</p>
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="City / District" icon={MapPin} required hint="Enter your specific district or city name">
                <input
                  required
                  type="text"
                  autoComplete="address-level2"
                  placeholder="e.g. Dhaka, Chittagong, Sylhet, Savar..."
                  value={form.city}
                  onChange={setField('city')}
                  className="input text-base sm:text-small"
                  id="checkout-city"
                  style={{ touchAction: 'manipulation' }}
                />
              </Field>

              <Field label="Full Address" icon={MapPin} required hint="House/flat no., road, area">
                <textarea
                  required
                  rows={2}
                  autoComplete="street-address"
                  placeholder="House 12, Road 5, Mirpur-10..."
                  value={form.address}
                  onChange={setField('address')}
                  className="input resize-none text-base sm:text-small"
                  id="checkout-address"
                  style={{ touchAction: 'manipulation' }}
                />
              </Field>

              <Field label="Order Note" icon={MessageSquare}>
                <textarea
                  rows={2}
                  placeholder="Any special instructions? (optional)"
                  value={form.note}
                  onChange={setField('note')}
                  className="input resize-none text-base sm:text-small"
                  id="checkout-note"
                  style={{ touchAction: 'manipulation' }}
                />
              </Field>
            </div>

            {/* Payment Method Card */}
            <div className="card p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-brand/15 border border-brand/20 flex items-center justify-center">
                  <CreditCard size={14} className="text-brand" />
                </div>
                <h2 className="font-black text-base text-surface-primary">Payment Method</h2>
              </div>

              <div className="p-4 rounded-xl border-2 border-brand/40 bg-brand/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center flex-shrink-0">
                  <Zap size={18} className="text-brand" />
                </div>
                <div>
                  <p className="font-bold text-sm text-surface-primary">Cash on Delivery</p>
                  <p className="text-[10px] text-surface-muted mt-0.5">Pay when you receive your order</p>
                </div>
                <div className="ml-auto w-5 h-5 rounded-full border-2 border-brand flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Order Summary (Desktop & Mobile) ───────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="card p-5 sm:p-6 sticky top-24 space-y-5">
              <OrderSummary items={items} subtotal={subtotal} shipping={shipping} total={total} />

              {/* Submit Place Order Button */}
              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="w-full py-4 rounded-xl bg-brand hover:bg-brand-400 active:scale-[0.98] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 shadow-glow hover:shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{ touchAction: 'manipulation' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Place Order · {formatPrice(total)}
                    <ChevronRight size={16} />
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-surface-muted">
                By placing your order you agree to our Terms & Privacy Policy.
                Your data is secure and encrypted.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
