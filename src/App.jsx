import { useEffect, createContext, useContext, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import { supabase } from './lib/supabase';
import {
  loadTrackingConfig,
  injectGTM,
  injectMetaPixel,
  trackPageView,
} from './lib/tracking';

// Lazy-loaded secondary pages for route-level code splitting
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));

// Lazy-loaded info pages
const InfoPages = lazy(() => import('./pages/InfoPages'));
const ShippingInfo = lazy((props) => import('./pages/InfoPages').then(m => ({ default: m.ShippingInfo })));
const ReturnsExchanges = lazy((props) => import('./pages/InfoPages').then(m => ({ default: m.ReturnsExchanges })));
const ContactUs = lazy((props) => import('./pages/InfoPages').then(m => ({ default: m.ContactUs })));
const OurStory = lazy((props) => import('./pages/InfoPages').then(m => ({ default: m.OurStory })));
const PrivacyPolicy = lazy((props) => import('./pages/InfoPages').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy((props) => import('./pages/InfoPages').then(m => ({ default: m.TermsOfService })));
const CookiePolicy = lazy((props) => import('./pages/InfoPages').then(m => ({ default: m.CookiePolicy })));
const FAQ = lazy((props) => import('./pages/InfoPages').then(m => ({ default: m.FAQ })));

const RouteLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-[#C5A880] border-t-transparent rounded-full animate-spin" />
  </div>
);

/* ── Tracking Context ── */
const TrackingCtx = createContext(null);
export const useTracking = () => useContext(TrackingCtx);

/* ── Scroll to top on every route change ── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

/* ── Page View tracker (fires on every route change) ── */
function PageViewTracker() {
  const { pathname } = useLocation();
  const tracking = useTracking();

  useEffect(() => {
    if (tracking?.ready) {
      trackPageView();
    }
  }, [pathname, tracking?.ready]);

  return null;
}

/* ── Tracking Initializer (runs once on app mount) ── */
function TrackingProvider({ children }) {
  const [trackingState, setTrackingState] = useState({ ready: false });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const config = await loadTrackingConfig(supabase);

        if (cancelled) return;

        if (config?.gtm_id && config.tracking_enabled !== false) {
          injectGTM(config.gtm_id);
        }

        if (config?.pixel_id && config.tracking_enabled !== false) {
          if (!config.gtm_id) {
            injectMetaPixel(config.pixel_id);
          } else {
            window.fbq = window.fbq || function() {
              (window.fbq.q = window.fbq.q || []).push(arguments);
            };
          }
        }

        setTrackingState({ ready: true });
      } catch (e) {
        console.warn('[Tracking] Init failed:', e);
        setTrackingState({ ready: false });
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return (
    <TrackingCtx.Provider value={trackingState}>
      {children}
    </TrackingCtx.Provider>
  );
}

/* Frontend layout */
function FrontendLayout() {
  const location = useLocation();
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <PageViewTracker />
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Suspense fallback={<RouteLoader />}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/track" element={<TrackOrder />} />

                <Route path="/shipping-info" element={<ShippingInfo />} />
                <Route path="/returns-exchanges" element={<ReturnsExchanges />} />
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/our-story" element={<OurStory />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/faq" element={<FAQ />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

/* Redirection helper to decoupled admin sub-app */
function AdminRedirect() {
  useEffect(() => {
    if (window.location.port === '5173' || (window.location.hostname === 'localhost' && window.location.port !== '5174')) {
      window.location.href = 'http://localhost:5174/';
    } else {
      window.location.href = '/admin/index.html';
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#6366f1',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Redirecting to OrderFlow Dashboard...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TrackingProvider>
        <Routes>
          {/* Admin redirection routes */}
          <Route path="/admin" element={<AdminRedirect />} />
          <Route path="/admin/*" element={<AdminRedirect />} />
          {/* Frontend routes */}
          <Route path="/*" element={<FrontendLayout />} />
        </Routes>
      </TrackingProvider>
    </BrowserRouter>
  );
}
