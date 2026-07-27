import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import TrackOrder from './pages/TrackOrder';
import { ShippingInfo, ReturnsExchanges, ContactUs, OurStory, PrivacyPolicy, TermsOfService, CookiePolicy, FAQ } from './pages/InfoPages';

/* ── Scroll to top on every route change ── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

/* Frontend layout */
function FrontendLayout() {
  const location = useLocation();
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
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
    window.location.href = '/admin/';
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
      <Routes>
        {/* Admin redirection routes */}
        <Route path="/admin" element={<AdminRedirect />} />
        <Route path="/admin/*" element={<AdminRedirect />} />
        {/* Frontend routes */}
        <Route path="/*" element={<FrontendLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
