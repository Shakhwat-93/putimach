import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronRight, Zap, Star, TrendingUp, Heart, MessageCircle, Sparkles, ExternalLink } from 'lucide-react';
import { getProducts, getCategories } from '../lib/api';
import { supabase } from '../lib/supabase';
import { collections } from '../data/products';
import ProductCard from '../components/shop/ProductCard';
import { AlertDialogDemo } from '../components/ui/AlertDialogDemo';

const InstagramIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const formatPrice = (p) => `৳${Number(p).toLocaleString('en-BD')}`;

const defaultHome = {
  heroBgImage: "/images/hero-banner.webp",
  heroBadge: "Vintage Weaves",
  heroSubBadge: "EST 2026",
  heroHeading: "WOVEN IN NOSTALGIA.\nTAILORED FOR TODAY.",
  heroSubtext: "Premium vintage fashion and heritage crafts. Handloomed yarns and organic dyes that whisper stories of the past.",
  heroButtonText: "Shop Now",

  collectionsLabel: "THE SECTIONS",
  collectionsTitle: "Browse Curated Archives",

  latestLabel: "New Arrivals",
  latestTitle: "Latest Collection",

  catalogLabel: "The Catalog",
  catalogTitle: "Most Wanted",
  catalogSubtext: "Hand-picked vintage classics, designed to transcend seasons.",

  brandStoryLabel: "OUR HERITAGE & STORIES",
  brandStoryImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
  brandStoryTitle: "Woven in Nostalgia,\nTailored for Today.",
  brandStoryText1: "PutiMach was born out of frustration — the frustration of losing our handloom heritage, and the rush of fast fashion that ignores stories and craft.",
  brandStoryText2: "Every weave carries the legacy of master weavers of Sonargaon and Tangail. Timeless patterns, handcrafted detail, made to age elegantly.",
  brandStoryStats: [
    { val: "100%", label: "Handloomed" },
    { val: "Organic", label: "Heritage Dyes" },
    { val: "Master", label: "Weavers" }
  ],

  instagramLabel: "#PUTIMACHSTORIES",
  instagramTitle: "ON INSTAGRAM",
  instagramSubtext: "Follow @putimachhh for style updates and heritage weaving documentation.",
  instagramUrl: "https://www.instagram.com/putimachhh?igsh=dnYxeXhhdHhodzdn",
  instagramProfileImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
  instagramImages: [
    { src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=70", likes: "1.2k", comments: "84" },
    { src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=70", likes: "956", comments: "42" },
    { src: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=400&q=70", likes: "2.4k", comments: "128" },
    { src: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=70", likes: "1.8k", comments: "96" },
  ]
};

/* ─── Scroll Reveal Wrapper ─────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────── */
function Hero({ settings }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center bg-[#9C8975] overflow-hidden border-b border-[#E9E2D2]" style={{ height: '100vh', minHeight: '100vh' }}>
      <motion.div style={{ y }} className="absolute inset-0 z-0 bg-[#9C8975]">
        <img
          src={settings.heroBgImage || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=75'}
          alt="Vintage Fashion Collection"
          className="w-full h-full object-cover"
          draggable="false"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FDFBF7]/20 via-transparent to-[#FDFBF7]/20"></div>
      </motion.div>
      
      <motion.div style={{ opacity }} className="relative z-10 text-center px-4 max-w-3xl mx-auto -translate-y-20">
        <div className="animate-fade-in-up">
          <Link 
            to="/shop" 
            className="border border-[#1C1613]/30 bg-[#9C8975]/35 backdrop-blur-sm text-[#1C1613] hover:bg-[#1C1613] hover:text-[#FDFBF7] hover:border-[#1C1613] font-black tracking-[0.25em] text-sm uppercase px-8 py-4 transition-all duration-300 inline-block cursor-pointer"
          >
            {settings.heroButtonText || 'Shop Now'}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Collections ────────────────────────────────────────────────────── */
function Collections({ settings, categories }) {
  if (!categories || categories.length === 0) return null;

  const list = categories.map(cat => ({
    id: cat.slug,
    label: cat.name,
    image: cat.image_url || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=650&q=70'
  }));

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
      <div className="flex items-baseline justify-between border-b border-[#E9E2D2] pb-3 mb-6">
        <div>
          <p className="text-[10px] font-bold text-[#C5A880] uppercase tracking-[0.25em] font-serif mb-1">
            {settings.collectionsLabel || 'THE SECTIONS'}
          </p>
          <h2 className="text-lg font-serif text-[#1C1613] uppercase tracking-wider">
            {settings.collectionsTitle || 'Browse Curated Archives'}
          </h2>
        </div>
        <Link 
          to="/shop" 
          className="text-xs font-semibold text-[#C5A880] uppercase tracking-widest hover:text-[#1C1613] transition-colors font-sans flex-shrink-0"
        >
          View All
        </Link>
      </div>
      
      {/* Horizontal Scroll Slider */}
      <div 
        className="flex gap-3 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {list.map((cat, idx) => (
          <Link
            key={idx}
            to={`/shop?category=${cat.id}`}
            style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
            className="relative w-32 sm:w-40 h-44 sm:h-52 rounded-xl overflow-hidden group border border-[#E9E2D2] block"
          >
            <img
              src={cat.image}
              alt={`${cat.label} Collection`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1613]/75 via-[#1C1613]/10 to-transparent group-hover:from-[#1C1613]/85 transition-all duration-300" />
            {/* Label */}
            <div className="absolute inset-0 flex flex-col justify-end p-3">
              <span className="text-[8px] font-bold text-[#C5A880] uppercase tracking-widest mb-0.5 font-serif leading-none">Explore</span>
              <h3 className="text-xs sm:text-sm font-serif text-white uppercase tracking-wide leading-tight">{cat.label}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── Recommended For You ────────────────────────────────────────────── */
function Recommended({ products, settings }) {
  const recommended = products.slice(0, 4);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between border-b border-[#E9E2D2] pb-3 mb-8">
        <h2 className="text-lg font-serif font-semibold uppercase tracking-vintage text-[#1C1613]">
          Recommended For You
        </h2>
        <Link 
          to="/shop?sort=popular" 
          className="text-xs font-semibold text-[#C5A880] uppercase tracking-vintage hover:text-[#1C1613] transition-colors font-sans"
        >
          View All
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        {recommended.map((prod, idx) => (
          <ProductCard key={prod.id} product={prod} index={idx} />
        ))}
      </div>
    </section>
  );
}

/* ─── Brand Story ────────────────────────────────────────────────────── */
function BrandStory({ settings }) {
  const img1 = settings.brandStoryImage || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80';
  const img2 = settings.brandStoryImage2 || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80';

  return (
    <section className="bg-[#F5F2EB] py-20 border-y border-[#E9E2D2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Story Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-80 overflow-hidden border border-[#E9E2D2]">
              <img 
                src={img1} 
                alt="Handcrafted details" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
                loading="lazy" 
              />
            </div>
            <div className="h-80 overflow-hidden border border-[#E9E2D2] mt-8">
              <img 
                src={img2} 
                alt="Fine weaves" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
                loading="lazy" 
              />
            </div>
          </div>
          
          {/* Story Content */}
          <div className="space-y-6 lg:pl-8">
            <p className="text-[10px] font-bold text-[#C5A880] uppercase tracking-[0.25em] font-serif">
              {settings.brandStoryLabel || 'OUR HERITAGE & STORIES'}
            </p>
            <h2 className="text-3xl md:text-5xl font-serif text-[#1C1613] tracking-wide uppercase leading-tight whitespace-pre-line">
              {settings.brandStoryTitle || "Woven in Nostalgia,\nTailored for Today."}
            </h2>
            <p className="text-xs text-[#7C6E65] uppercase tracking-wider leading-relaxed">
              {settings.brandStoryText1 || 'At PutiMach, we reject the noise of fast fashion. Our collection is built upon the rhythm of antique wooden looms, handloomed yarns, and organic dyes that whisper stories of the past.'}
            </p>
            <p className="text-xs text-[#7C6E65] uppercase tracking-wider leading-relaxed">
              {settings.brandStoryText2 || 'Every button is selected to age, every stitch is positioned to hold, and every weave carries the legacy of master weavers of Sonargaon and Tangail.'}
            </p>
            <div className="pt-4">
              <Link 
                to="/shop" 
                className="border border-[#C5A880] bg-transparent text-[#1C1613] hover:bg-[#C5A880] hover:text-[#FDFBF7] font-semibold tracking-[0.2em] text-[10px] uppercase px-8 py-3.5 transition-all duration-300 inline-block cursor-pointer font-sans"
              >
                {settings.brandStoryButtonText || 'Explore Our Craft'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── New Arrivals ───────────────────────────────────────────────────── */
function NewArrivals({ products, settings }) {
  const newArrivals = products.filter(p => p.is_new || p.badge === 'NEW' || p.badge === 'NEW DROP').slice(0, 4);
  const list = newArrivals.length > 0 ? newArrivals : products.slice(4, 8);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between border-b border-[#E9E2D2] pb-3 mb-8">
        <h2 className="text-lg font-serif font-semibold uppercase tracking-vintage text-[#1C1613]">
          New Arrivals
        </h2>
        <Link 
          to="/shop?sort=newest" 
          className="text-xs font-semibold text-[#C5A880] uppercase tracking-vintage hover:text-[#1C1613] transition-colors font-sans"
        >
          Explore All
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        {list.map((prod, idx) => (
          <ProductCard key={prod.id} product={prod} index={idx} />
        ))}
      </div>
    </section>
  );
}

/* ─── Vintage Instagram Gallery ──────────────────────────────────────── */
function InstagramSection({ settings }) {
  const instaUrl = settings.instagramUrl || 'https://www.instagram.com/putimachhh?igsh=dnYxeXhhdHhodzdn';
  const img1 = settings.instagramImage1 || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=70';
  const img2 = settings.instagramImage2 || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=70';
  const img3 = settings.instagramImage3 || 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=400&q=70';
  const img4 = settings.instagramImage4 || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=70';
  const img5 = settings.instagramImage5 || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=70';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <a href={instaUrl} target="_blank" rel="noopener noreferrer" className="block text-center space-y-3 mb-12 group">
        <p className="text-[9px] font-bold text-[#C5A880] uppercase tracking-[0.25em] font-serif">
          {settings.instagramLabel || '#PUTIMACHSTORIES'}
        </p>
        <h2 className="text-2xl sm:text-4xl font-serif text-[#1C1613] group-hover:text-[#C5A880] uppercase tracking-wider transition-colors">
          {settings.instagramTitle || 'ON INSTAGRAM'}
        </h2>
      </a>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="h-64 overflow-hidden border border-[#E9E2D2] relative group">
          <img src={img1} alt="Instagram style 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div className="absolute inset-0 bg-[#1C1613]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs tracking-widest font-sans uppercase animate-fade-in">VIEW STYLING</div>
        </div>
        <div className="h-64 overflow-hidden border border-[#E9E2D2] md:mt-6 relative group">
          <img src={img2} alt="Instagram style 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div className="absolute inset-0 bg-[#1C1613]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs tracking-widest font-sans uppercase animate-fade-in">VIEW WEAVE</div>
        </div>
        <div className="h-64 overflow-hidden border border-[#E9E2D2] relative group">
          <img src={img3} alt="Instagram style 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div className="absolute inset-0 bg-[#1C1613]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs tracking-widest font-sans uppercase animate-fade-in">VIEW FABRIC</div>
        </div>
        <div className="h-64 overflow-hidden border border-[#E9E2D2] md:mt-6 relative group">
          <img src={img4} alt="Instagram style 4" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div className="absolute inset-0 bg-[#1C1613]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs tracking-widest font-sans uppercase animate-fade-in">VIEW DETAIL</div>
        </div>
        <div className="h-64 overflow-hidden border border-[#E9E2D2] relative group">
          <img src={img5} alt="Instagram style 5" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div className="absolute inset-0 bg-[#1C1613]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs tracking-widest font-sans uppercase animate-fade-in">VIEW EDIT</div>
        </div>
      </div>
    </section>
  );
}

/* ─── Cache helpers ──────────────────────────────────────────────────── */
const CACHE_KEY = 'rr_home_cache';
const CACHE_TTL = 10 * 1000; // 10 seconds

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

/* ─── Home Page ──────────────────────────────────────────────────────── */
export default function Home() {
  // Seed state from cache synchronously so first paint uses real data
  const cached = readCache();
  const [loading, setLoading] = useState(!cached);
  const [products, setProducts] = useState(cached?.products || []);
  const [categories, setCategories] = useState(cached?.categories || []);
  const [topSellingProduct, setTopSellingProduct] = useState(cached?.topSellingProduct || null);
  const [settings, setSettings] = useState(cached?.settings ? { ...defaultHome, ...cached.settings } : defaultHome);

  useEffect(() => {
    const fetchWithTimeout = (url, ms = 1500) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), ms);
      return fetch(url, { signal: controller.signal })
        .then(res => { clearTimeout(id); return res; })
        .catch(err => { clearTimeout(id); throw err; });
    };

    async function load() {
      try {
        let siteData = null;
        try {
          const { data: homeSettingDb } = await supabase
            .from('cb_settings')
            .select('data')
            .eq('id', 'home_page')
            .maybeSingle();
          if (homeSettingDb && homeSettingDb.data) {
            siteData = homeSettingDb.data;
          }
        } catch (dbErr) {
          console.warn('Supabase cb_settings fetch error:', dbErr);
        }

        if (!siteData) {
          const siteRes = await fetchWithTimeout(`/admin-api/site-settings/home_page?t=${Date.now()}`)
            .then(r => r.ok ? r.json().catch(() => null) : null)
            .catch(() => null);
          if (siteRes?.success) siteData = siteRes.data;
        }

        const [prodData, catData] = await Promise.all([
          getProducts().catch(err => { console.error('Failed to load products:', err); return []; }),
          getCategories().catch(err => { console.error('Failed to load categories:', err); return []; })
        ]);

        const freshSettings = siteData ? { ...defaultHome, ...siteData } : defaultHome;

        if (prodData?.length) setProducts(prodData);
        if (catData?.length) setCategories(catData);
        setSettings(freshSettings);

        const topProduct = prodData?.find(p => p.badge?.toLowerCase() === 'featured' || p.badge?.toLowerCase() === 'hot')
          || prodData?.[0];
        setTopSellingProduct(topProduct || null);

        // Update cache with latest data
        writeCache({
          settings: siteData || null,
          products: prodData || [],
          categories: catData || [],
          topSellingProduct: topProduct || null,
        });
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#C5A880] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#C5A880] text-xs font-serif tracking-widest uppercase animate-pulse">Loading PutiMach...</p>
      </div>
    );
  }

  return (
    <main className="space-y-20 pb-20 bg-[#FDFBF7] vintage-grain">
      <Hero settings={settings} />
      <Collections settings={settings} categories={categories} />
      {products.length > 0 && (
        <>
          <Recommended products={products} settings={settings} />
          <BrandStory settings={settings} />
          <NewArrivals products={products} settings={settings} />
        </>
      )}

      {/* Shadcn Alert Dialog Test Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-6 border-t border-[#E9E2D2]">
        <h3 className="text-sm font-serif font-semibold uppercase tracking-vintage text-[#1C1613] mb-4">
          Shadcn Alert Dialog Demo
        </h3>
        <div className="inline-block">
          <AlertDialogDemo />
        </div>
      </section>

      <InstagramSection settings={settings} />
    </main>
  );
}
