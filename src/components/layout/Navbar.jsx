// src/components/layout/Navbar.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, Search, Zap } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import CartDrawer from './CartDrawer';
import { getCategories } from '../../lib/api';
import { supabase } from '../../lib/supabase';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop', hasDropdown: true },
  { to: '/track', label: 'Track Order' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items, openCart } = useCartStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        // cb_products stores all fields inside a JSONB `data` column
        // Use PostgREST text filter on the JSONB field
        const { data, error } = await supabase
          .from('products')
          .select('id, data')
          .ilike('data->>name', `%${searchQuery.trim()}%`)
          .limit(5);
        if (!error && data) {
          // Map JSONB rows to flat product objects
          setSearchResults(data.map(row => ({
            id: row.id,
            name: row.data?.name || '',
            slug: row.data?.slug || row.id,
            price: row.data?.price || 0,
            image: row.data?.image || row.data?.images?.[0] || '',
          })));
        }
      } catch (err) {
        console.error('Real-time search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const [categories, setCategories] = useState([]);
  const [navMenu, setNavMenu] = useState([]);
  const [activeAccordion, setActiveAccordion] = useState(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();
        if (data) {
          setCategories(data);
        }
      } catch (err) {
        console.error('Error fetching navbar categories:', err);
      }
    }
    async function fetchNavMenu() {
      try {
        const { data, error } = await supabase
          .from('cb_settings')
          .select('data')
          .eq('id', 'nav_menu')
          .single();
        if (!error && data?.data) {
          setNavMenu(data.data);
        }
      } catch (err) {
        console.error('Error fetching nav menu:', err);
      }
    }
    fetchCategories();
    fetchNavMenu();
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const [announcementText, setAnnouncementText] = useState('');

  const displayMenu = useMemo(() => {
    let list = Array.isArray(navMenu) ? [...navMenu] : [];

    // Filter out category items whose category no longer exists in cb_categories
    list = list.filter((item) => {
      if (item.type === 'category') {
        if (!categories || categories.length === 0) return false;
        return categories.some(
          (c) =>
            (c.slug && c.slug === item.slug) ||
            (c.name && c.name.toLowerCase() === item.label?.toLowerCase())
        );
      }
      return true;
    });

    // If list has no categories, but categories exist in DB, inject live categories dynamically
    const hasCategoryInMenu = list.some((item) => item.type === 'category');
    if (!hasCategoryInMenu && Array.isArray(categories) && categories.length > 0) {
      const catMenuItems = categories.map((cat) => ({
        type: 'category',
        label: cat.name,
        slug: cat.slug,
        url: `/shop?cat=${cat.slug}`,
        subs: []
      }));
      const shopAllIdx = list.findIndex((i) => i.label?.toLowerCase() === 'shop all');
      const insertAt = shopAllIdx >= 0 ? shopAllIdx + 1 : 1;
      list.splice(insertAt, 0, ...catMenuItems);
    }

    // Default fallback if list is empty
    if (list.length === 0) {
      list = [
        { url: '/', type: 'link', label: 'Home' },
        { url: '/shop', type: 'link', label: 'Shop All' },
        { url: '/track', type: 'link', label: 'Track Order' }
      ];
    }

    return list;
  }, [navMenu, categories]);

  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const { data, error } = await supabase
          .from('cb_settings')
          .select('data')
          .eq('id', 'contact_info')
          .maybeSingle();
        if (data && data.data?.announcement) {
          setAnnouncementText(data.data.announcement);
        }
      } catch (err) {
        console.error('Failed to load announcement:', err);
      }
    }
    loadAnnouncement();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E9E2D2]' : 'bg-transparent border-transparent'
        }`}
      >
        {announcementText && (
          <div className="bg-[#1C1613] text-[#C5A880] text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] py-2 px-4 text-center border-b border-[#C5A880]/15">
            {announcementText}
          </div>
        )}
        <div className="container-site">
          <div className="relative flex items-center justify-between h-16 lg:h-20">
            
            {/* Left: Hamburger menu toggle button */}
            <div className="flex items-center">
              <button 
                onClick={() => setMobileOpen(true)}
                className="flex items-center gap-2 text-[#1C1613] hover:text-[#C5A880] transition-colors focus:outline-none cursor-pointer group" 
                aria-label="Open menu"
              >
                <span className="relative flex flex-col gap-1 w-6">
                  <span className="h-[2.5px] w-6 bg-[#1C1613] group-hover:bg-[#C5A880] transition-all"></span>
                  <span className="h-[2.5px] w-4 bg-[#1C1613] group-hover:bg-[#C5A880] transition-all"></span>
                  <span className="h-[2.5px] w-6 bg-[#1C1613] group-hover:bg-[#C5A880] transition-all"></span>
                </span>
                <span className="hidden md:inline text-xs font-bold uppercase tracking-vintage mt-0.5 font-sans">Menu</span>
              </button>
            </div>

            {/* Center: PUTIMACH text logo */}
            <div className="flex-1 flex justify-center items-center">
              <Link to="/" className="text-xl sm:text-2xl font-serif font-bold tracking-[0.2em] text-[#1C1613] hover:opacity-80 transition-opacity">
                PUTIMACH
              </Link>
            </div>

            {/* Right: Shopping Cart Trigger & Search */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSearchOpen(true)}
                className="text-[#1C1613] hover:text-[#C5A880] transition-colors focus:outline-none cursor-pointer"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              <button 
                onClick={openCart}
                className="flex items-center gap-2 text-[#1C1613] hover:text-[#C5A880] transition-colors focus:outline-none cursor-pointer group"
                aria-label="Open cart"
              >
                <span className="hidden md:inline text-xs font-bold uppercase tracking-vintage mt-0.5 font-sans">Bag</span>
                <span className="relative">
                  <svg className="h-5 w-5 stroke-[2.5] group-hover:scale-105 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#C5A880] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center font-sans">
                      {totalItems}
                    </span>
                  )}
                </span>
              </button>
            </div>

          </div>
        </div>
      </motion.header>

      {/* Fullscreen Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] flex justify-start bg-black/40 backdrop-blur-xs">
            {/* Backdrop click close */}
            <div onClick={() => setMobileOpen(false)} className="absolute inset-0 cursor-pointer animate-fade-in"></div>

            {/* Navigation Panel (Slides from left) */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative w-[85%] sm:max-w-xs h-full bg-[#FDFBF7] p-6 border-r border-[#E9E2D2] shadow-2xl flex flex-col justify-between z-10"
            >
              <div>
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E9E2D2]">
                  <span className="font-serif font-bold text-lg tracking-wider text-[#1C1613]">PUTIMACH</span>
                  <button onClick={() => setMobileOpen(false)} className="p-2 text-[#7C6E65] hover:text-[#1C1613] focus:outline-none cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                {/* Dynamic Navigation Menu */}
                <nav className="mt-6 flex flex-col max-h-[60vh] overflow-y-auto hide-scrollbar">
                  {displayMenu.map((item, idx) => {
                    const hasSubs = item.type === 'category' && item.subs && item.subs.length > 0;
                    if (hasSubs) {
                      const isAccordionOpen = activeAccordion === idx;
                      return (
                        <div key={idx} className="border-b border-[#E9E2D2]/50">
                          <button
                            onClick={() => setActiveAccordion(isAccordionOpen ? null : idx)}
                            className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-semibold uppercase tracking-vintage text-[#1C1613] hover:text-[#C5A880] transition-all focus:outline-none cursor-pointer"
                          >
                            <span>{item.label}</span>
                            <svg className={`w-3.5 h-3.5 text-[#7C6E65] transition-transform duration-300 ${isAccordionOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                            </svg>
                          </button>
                          <AnimatePresence>
                            {isAccordionOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pl-6 pr-4 py-1.5 flex flex-col gap-2 bg-[#F5F2EB]/30 overflow-hidden"
                              >
                                <Link
                                  to={item.url || '/shop'}
                                  onClick={() => setMobileOpen(false)}
                                  className="text-[11px] uppercase tracking-wider py-1.5 text-[#7C6E65] hover:text-[#C5A880]"
                                >
                                  View All {item.label}
                                </Link>
                                {item.subs.map((sub, sIdx) => (
                                  <Link
                                    key={sIdx}
                                    to={sub.url || '#'}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-[11px] uppercase tracking-wider py-1.5 text-[#7C6E65] hover:text-[#C5A880]"
                                  >
                                    {sub.label}
                                  </Link>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="border-b border-[#E9E2D2]/50">
                        <Link
                          to={item.url || '/'}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-4 py-3.5 text-xs font-semibold uppercase tracking-vintage text-[#1C1613] hover:text-[#C5A880] transition-colors"
                        >
                          <span>{item.label}</span>
                        </Link>
                      </div>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Drawer Footer Info */}
              <div className="pt-6 border-t border-[#E9E2D2] space-y-4">
                <Link
                  to="/track"
                  onClick={() => setMobileOpen(false)}
                  className="border border-[#E9E2D2] text-[#1C1613] hover:border-[#C5A880] w-full text-center flex items-center justify-center gap-2 text-xs py-3.5 bg-[#F5F2EB]/20 transition-all font-semibold uppercase tracking-vintage"
                >
                  <svg className="w-4 h-4 text-[#C5A880]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <span>Track My Order</span>
                </Link>
                <Link
                  to="/shop"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full text-center flex items-center justify-center gap-2 text-xs py-3.5"
                >
                  <svg className="w-4 h-4 text-base-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span>Enter Store</span>
                </Link>
                <p className="text-[9px] text-[#7C6E65] font-semibold uppercase tracking-vintage text-center">PUTIMACH EST. 2026</p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CartDrawer />

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 glass-dark flex items-start justify-center pt-24 sm:pt-32 px-4"
          >
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full max-w-xl bg-[#FDFBF7] border border-[#E9E2D2] rounded-none shadow-premium p-6 relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSearchOpen(false)}
                className="absolute top-4 right-4 text-surface-secondary hover:text-surface-primary cursor-pointer p-1 rounded-none hover:bg-base-700 transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="font-serif font-bold text-lg text-surface-primary mb-4 uppercase tracking-wider">Search Products</h3>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-secondary" size={18} />
                  <input
                    type="text"
                    placeholder="Search for sarees, panjabis, clutches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-11 w-full bg-[#F5F2EB] border border-[#E9E2D2]"
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-primary px-6 py-2 text-xs">
                  Search
                </button>
              </form>

              {/* Real-time Results Dropdown */}
              {(searchQuery.trim() || searchLoading) && (
                <div className="mt-4 max-h-60 overflow-y-auto space-y-1 border-t border-[#E9E2D2] pt-3 text-left">
                  {searchLoading && (
                    <p className="text-xs text-surface-secondary animate-pulse px-2 py-1">Searching...</p>
                  )}
                  
                  {!searchLoading && searchResults.length === 0 && (
                    <p className="text-xs text-surface-secondary px-2 py-1">No products found matching "{searchQuery}"</p>
                  )}

                  {!searchLoading && searchResults.map(prod => (
                    <Link
                      key={prod.id}
                      to={`/product/${prod.slug}`}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="flex items-center gap-3 p-2 rounded-none hover:bg-[#F5F2EB] transition-colors"
                    >
                      {prod.image && (
                        <img src={prod.image} alt={prod.name} className="w-10 h-10 object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-surface-primary truncate font-serif uppercase">{prod.name}</p>
                        <p className="text-xs text-brand font-sans">৳ {prod.price?.toLocaleString('en-BD')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
