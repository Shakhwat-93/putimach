import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search, ChevronDown, Grid2X2, Grid3X3, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProducts, getCategories } from '../lib/api';
import ProductCard from '../components/shop/ProductCard';
import { trackSearch } from '../lib/tracking';

const sortOptions = [
  { val: 'featured', label: 'Featured' },
  { val: 'price-asc', label: 'Price: Low to High' },
  { val: 'price-desc', label: 'Price: High to Low' },
  { val: 'newest', label: 'Newest' },
  { val: 'rating', label: 'Top Rated' },
];

const priceRanges = [
  { val: 'all', label: 'All Prices' },
  { val: '0-1500', label: 'Under ৳1,500' },
  { val: '1500-3000', label: '৳1,500 – ৳3,000' },
  { val: '3000-5000', label: '৳3,000 – ৳5,000' },
  { val: '5000+', label: 'Above ৳5,000' },
];

/* ─── Shop Banner Slider ─────────────────────────────────────────────── */
function ShopBannerSlider({ slides }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  // Normalize slides format (handles simple string arrays or object arrays)
  const normalizedSlides = useMemo(() => {
    if (!slides) return [];
    return slides.map((slide, idx) => {
      if (typeof slide === 'string') {
        return { id: idx, image: slide, title: '', subtitle: '', cta_text: '', cta_link: '' };
      }
      return {
        id: slide.id || idx,
        image: slide.image || '',
        title: slide.title || '',
        subtitle: slide.subtitle || '',
        cta_text: slide.cta_text || '',
        cta_link: slide.cta_link || ''
      };
    });
  }, [slides]);

  useEffect(() => {
    if (normalizedSlides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % normalizedSlides.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [normalizedSlides]);

  if (normalizedSlides.length === 0) return null;

  const prev = () => { clearInterval(timerRef.current); setCurrent(c => (c - 1 + normalizedSlides.length) % normalizedSlides.length); };
  const next = () => { clearInterval(timerRef.current); setCurrent(c => (c + 1) % normalizedSlides.length); };

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '21/6', maxHeight: '320px', minHeight: '160px' }}>
      <AnimatePresence mode="wait">
        {normalizedSlides.map((slide, idx) =>
          idx === current ? (
            <motion.div
              key={slide.id || idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <img
                src={slide.image}
                alt={slide.title || `Slide ${idx + 1}`}
                className="w-full h-full object-cover"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              {(slide.title || slide.subtitle || slide.cta_text) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
                  style={{ background: 'linear-gradient(to right, rgba(28,22,19,0.45), rgba(28,22,19,0.18), rgba(28,22,19,0.45))' }}>
                  {slide.subtitle && <p className="text-[10px] font-bold text-[#C5A880] uppercase tracking-[0.3em] mb-2 font-serif">{slide.subtitle}</p>}
                  {slide.title && <h2 className="text-2xl sm:text-4xl font-serif text-white uppercase tracking-widest mb-3">{slide.title}</h2>}
                  {slide.cta_text && slide.cta_link && (
                    <a href={slide.cta_link}
                      className="border border-white/80 bg-transparent text-white hover:bg-white hover:text-[#1C1613] font-semibold tracking-[0.2em] text-[10px] uppercase px-8 py-3 transition-all duration-300 inline-block mt-2">
                      {slide.cta_text}
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          ) : null
        )}
      </AnimatePresence>

      {normalizedSlides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all duration-200 rounded-full z-10">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all duration-200 rounded-full z-10">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {normalizedSlides.map((_, i) => (
              <button key={i} onClick={() => { clearInterval(timerRef.current); setCurrent(i); }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-5' : 'bg-white/50 hover:bg-white/80'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shopSlider, setShopSlider] = useState([]);
  const [shopSettings, setShopSettings] = useState({
    title: 'Shop All',
    subtitle: 'The Catalog',
  });
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [grid, setGrid] = useState('3');

  const activeCategory = searchParams.get('cat') || 'all';
  const activePrice = searchParams.get('price') || 'all';
  const activeSort = searchParams.get('sort') || 'featured';
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    const fetchWithTimeout = (url, ms = 1500) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), ms);
      return fetch(url, { signal: controller.signal })
        .then(res => { clearTimeout(id); return res; })
        .catch(err => { clearTimeout(id); throw err; });
    };

    async function loadData() {
      setLoading(true);
      try {
        const t = Date.now();
        const [prodList, catList, shopSiteRes, sliderRes] = await Promise.all([
          getProducts().catch(err => { console.error('Failed to load products:', err); return []; }),
          getCategories().catch(err => { console.error('Failed to load categories:', err); return []; }),
          fetchWithTimeout(`/admin-api/site-settings/shop_page?t=${t}`)
            .then(r => r.ok ? r.json().catch(() => null) : null)
            .catch(() => null),
          fetchWithTimeout(`/admin-api/site-settings/shop_slider?t=${t}`)
            .then(r => r.ok ? r.json().catch(() => null) : null)
            .catch(() => null),
        ]);
        setProducts(prodList);
        setCategories(catList);
        if (shopSiteRes?.success && shopSiteRes.data) {
          setShopSettings({ title: 'Shop All', subtitle: 'The Catalog', ...shopSiteRes.data });
        }
        if (sliderRes?.success && Array.isArray(sliderRes.data) && sliderRes.data.length > 0) {
          setShopSlider(sliderRes.data);
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Fire Search tracking event when user searches (debounced to avoid firing on every keystroke)
  useEffect(() => {
    if (!searchQuery) return;
    const timer = setTimeout(() => {
      trackSearch(searchQuery);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery]);


  const updateParam = (key, val) => {
    const params = new URLSearchParams(searchParams);
    if (val === 'all' || val === '' || val === 'featured') params.delete(key);
    else params.set(key, val);
    setSearchParams(params);
  };

  const computedCategories = useMemo(() => {
    const allCount = products.length;
    const catCounts = { all: allCount };

    categories.forEach((c) => {
      catCounts[c.slug] = products.filter((p) => p.category === c.slug).length;
    });

    return [
      { id: 'all', label: 'All Items', count: allCount },
      ...categories.map((c) => ({
        id: c.slug,
        label: c.name,
        count: catCounts[c.slug] || 0,
      })),
    ];
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category
    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Price
    if (activePrice !== 'all') {
      const [min, max] = activePrice === '5000+' ? [5000, Infinity] : activePrice.split('-').map(Number);
      result = result.filter((p) => p.price >= min && p.price <= max);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q))) ||
          p.slug.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (activeSort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 5) - (a.rating || 5));
        break;
    }

    return result;
  }, [products, activeCategory, activePrice, activeSort, searchQuery]);

  const activeFiltersCount = [
    activeCategory !== 'all',
    activePrice !== 'all',
    searchQuery !== '',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen pt-20 pb-20">
      {/* ─── Page Header ─── */}
      <div className="container-site py-10 lg:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="section-label mb-2">{shopSettings.subtitle}</p>
          <h1 className="font-black text-h1 mb-2">{shopSettings.title}</h1>
          <p className="text-surface-secondary">
            {loading ? 'Loading catalog...' : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'} found`}
          </p>
        </motion.div>
      </div>

      {/* ─── Shop Banner Slider (from DB) ─── */}
      {shopSlider.length > 0 && (
        <div className="mb-8">
          <ShopBannerSlider slides={shopSlider} />
        </div>
      )}

      <div className="container-site">
        {/* ─── Toolbar ─── */}
        <div className="flex items-center justify-between gap-4 mb-8">
          {/* Left: Filter + Search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Filter Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 text-small font-medium flex-shrink-0 ${
                sidebarOpen || activeFiltersCount > 0
                  ? 'border-brand/40 text-brand bg-brand/10'
                  : 'border-base-300 text-surface-secondary hover:border-brand/30 hover:text-surface-primary'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-xs hidden sm:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => updateParam('q', e.target.value)}
                className="input pl-9 py-2.5"
                id="shop-search"
              />
            </div>
          </div>

          {/* Right: Sort + Grid Toggle */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-base-300 text-small text-surface-secondary hover:border-brand/30 hover:text-surface-primary transition-all duration-200"
              >
                {sortOptions.find((o) => o.val === activeSort)?.label}
                <ChevronDown size={14} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 glass-dark rounded-xl border border-base-300 overflow-hidden z-20 shadow-card-lg"
                  >
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => {
                          updateParam('sort', opt.val);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-small transition-colors duration-150 ${
                          activeSort === opt.val
                            ? 'text-brand bg-brand/10'
                            : 'text-surface-secondary hover:text-surface-primary hover:bg-base-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Grid Toggle */}
            <div className="hidden lg:flex items-center gap-1 p-1 rounded-lg glass">
              <button
                onClick={() => setGrid('3')}
                className={`p-1.5 rounded transition-colors ${grid === '3' ? 'text-brand bg-brand/15' : 'text-surface-muted hover:text-surface-primary'}`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setGrid('2')}
                className={`p-1.5 rounded transition-colors ${grid === '2' ? 'text-brand bg-brand/15' : 'text-surface-muted hover:text-surface-primary'}`}
              >
                <Grid2X2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Category Chips ─── */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 mb-8">
          {computedCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam('cat', cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-small font-medium transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-brand text-white shadow-glow-sm'
                  : 'glass text-surface-secondary hover:text-surface-primary hover:border-brand/30'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        <div className="flex gap-8">
          {/* ─── Sidebar ─── */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ opacity: 0, width: 0, x: -20 }}
                animate={{ opacity: 1, width: 240, x: 0 }}
                exit={{ opacity: 0, width: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="hidden lg:block flex-shrink-0 overflow-hidden"
              >
                <div className="w-60 glass rounded-xl p-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-small">Filters</span>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={() => setSearchParams({})}
                        className="text-xs text-brand hover:text-brand-400 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-surface-muted mb-3">Category</p>
                    <div className="space-y-1">
                      {computedCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => updateParam('cat', cat.id)}
                          className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-small transition-colors duration-150 ${
                            activeCategory === cat.id
                              ? 'text-brand bg-brand/10'
                              : 'text-surface-secondary hover:text-surface-primary hover:bg-base-500'
                          }`}
                        >
                          {cat.label}
                          <span className="text-xs text-surface-muted">{cat.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divider" />

                  {/* Price Filter */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-surface-muted mb-3">Price Range</p>
                    <div className="space-y-1">
                      {priceRanges.map((range) => (
                        <button
                          key={range.val}
                          onClick={() => updateParam('price', range.val)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-small transition-colors duration-150 ${
                            activePrice === range.val
                              ? 'text-brand bg-brand/10'
                              : 'text-surface-secondary hover:text-surface-primary hover:bg-base-500'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ─── Product Grid ─── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 size={36} className="text-brand animate-spin" />
                <p className="text-surface-muted text-small font-mono uppercase tracking-widest">Fetching Catalog...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {filteredProducts.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 gap-4 text-center"
                  >
                    <div className="text-4xl">🔍</div>
                    <h3 className="font-bold text-h4">No products found</h3>
                    <p className="text-surface-muted text-small">Try adjusting your filters</p>
                    <button onClick={() => setSearchParams({})} className="btn-primary mt-2">
                      Clear Filters
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`grid-${activeCategory}-${activeSort}-${grid}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`grid gap-4 sm:gap-5 lg:gap-6 ${
                      grid === '2' ? 'grid-cols-2 lg:grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'
                    }`}
                  >
                    {filteredProducts.map((product, i) => (
                      <ProductCard key={product.id} product={product} index={i} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
