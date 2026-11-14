import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ShoppingBag, Heart, Star, Check, ChevronDown,
  Zap, ArrowRight, X, Ruler, Loader2, Layers, Table
} from 'lucide-react';
import { getProductBySlug, getProducts } from '../lib/api';
import { reviews } from '../data/products';
import ProductCard from '../components/shop/ProductCard';
import useCartStore from '../store/cartStore';
import { trackViewContent, trackAddToCart } from '../lib/tracking';

const formatPrice = (p) => `৳${Number(p).toLocaleString('en-BD')}`;

// Case-insensitive normalization for variant size & color matching
const normalizeVal = (val) => {
  if (!val) return '';
  const s = String(val).trim().toLowerCase();
  return (s === 'none' || s === 'one size' || s === 'standard') ? '' : s;
};

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [descOpen, setDescOpen] = useState(true);
  const [featOpen, setFeatOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const { addItem, openCart } = useCartStore();

  const mainImage = product?.image || (Array.isArray(product?.images) && product.images[0]);
  const otherImages = Array.isArray(product?.images) ? product.images.filter(img => img && img !== mainImage) : [];
  const images = product ? [mainImage, ...otherImages].filter(Boolean) : [];
  const sliderRef = useRef(null);
  
  const handleScroll = (e) => {
    const width = e.currentTarget.offsetWidth;
    if (width <= 0) return;
    const scrollLeft = e.currentTarget.scrollLeft;
    const page = Math.round(scrollLeft / width);
    if (page !== activeImg && page >= 0 && page < images.length) {
      setActiveImg(page);
    }
  };

  const handleThumbnailClick = (index) => {
    setActiveImg(index);
    if (sliderRef.current) {
      const width = sliderRef.current.offsetWidth;
      sliderRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
    }
  };

  // Auto-slide on desktop view (screens >= 1024px)
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      if (window.innerWidth >= 1024) {
        const nextIndex = (activeImg + 1) % images.length;
        setActiveImg(nextIndex);
        if (sliderRef.current) {
          const width = sliderRef.current.offsetWidth;
          sliderRef.current.scrollTo({
            left: width * nextIndex,
            behavior: 'smooth'
          });
        }
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [activeImg, images.length]);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      // If we already have the product in state/cache, don't trigger full screen loading
      setLoading(true);
      try {
        const prod = await getProductBySlug(slug);
        if (!isMounted) return;

        if (prod) {
          setProduct(prod);
          const defaultColor = prod?.colors?.[0] || null;
          setSelectedColor(defaultColor);

          // Select first available size that has positive stock for the default color
          const hasVars = Array.isArray(prod?.variants) && prod.variants.length > 0;
          if (hasVars && prod?.sizes?.length > 0) {
            const firstInStockSize = prod.sizes.find(sz => {
              const v = prod.variants.find(variant => {
                const targetSize = normalizeVal(sz);
                const targetColor = normalizeVal(defaultColor);
                const vSize = normalizeVal(variant.size);
                const vColor = normalizeVal(variant.color);
                return ((!targetSize && !vSize) || vSize === targetSize) &&
                       ((!targetColor && !vColor) || vColor === targetColor);
              });
              return v && Number(v.stock) > 0;
            });
            setSelectedSize(firstInStockSize || null);
          } else {
            setSelectedSize(prod?.sizes?.[0] || null);
          }

          trackViewContent(prod);
          setLoading(false); // Paint main product immediately!

          // Fetch related products concurrently in background
          if (prod?.category) {
            getProducts({ category: prod.category })
              .then(rel => {
                if (isMounted) {
                  setRelatedProducts(rel.filter((p) => p.id !== prod.id).slice(0, 4));
                }
              })
              .catch(err => console.warn('Error fetching related products:', err));
          }
        } else {
          setProduct(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching product detail:', err);
        if (isMounted) {
          setProduct(null);
          setLoading(false);
        }
      }
    }
    loadProduct();
    return () => { isMounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="text-brand animate-spin" />
        <p className="text-surface-muted text-small font-mono tracking-widest uppercase">Loading Product Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center gap-4">
        <h1 className="text-h3 font-bold">Product Not Found</h1>
        <Link to="/shop" className="btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const originalPrice = product.original_price || product.originalPrice;
  const reviewsCount = product.reviews_count || product.reviews || 0;
  const rating = product.rating || 5.0;
  const longDesc = product.long_description || product.longDescription || product.description;
  const featuresList = Array.isArray(product.features) && product.features.length > 0 
    ? product.features.filter(Boolean) 
    : ['100% Premium Material', 'Custom Oversized Fit', 'Garment Washed'];

  // Enforce variant-level inventory stock control
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  // Helper to find matching variant by size and color
  const findVariant = (size, color) => {
    if (!hasVariants) return null;
    const targetSize = normalizeVal(size);
    const targetColor = normalizeVal(color);
    return product.variants.find(v => {
      const vSize = normalizeVal(v.size);
      const vColor = normalizeVal(v.color);
      const matchSize = (!targetSize && !vSize) || (vSize === targetSize);
      const matchColor = (!targetColor && !vColor) || (vColor === targetColor);
      return matchSize && matchColor;
    });
  };

  // Helper to get stock quantity for a given size and color
  const getVariantStock = (size, color) => {
    if (!hasVariants) {
      if (product.inventory_id && product.inventory?.current_stock !== undefined) {
        return Math.max(0, Number(product.inventory.current_stock) || 0);
      }
      return product.in_stock === false ? 0 : 999;
    }
    const v = findVariant(size, color);
    return v ? Math.max(0, Number(v.stock) || 0) : 0;
  };

  // Helper to check if a color has any available stock in any size
  const isColorInStock = (color) => {
    if (!hasVariants) return product.in_stock !== false;
    const targetColor = normalizeVal(color);
    const colorVariants = product.variants.filter(v => {
      const vColor = normalizeVal(v.color);
      return (!targetColor && !vColor) || (vColor === targetColor);
    });
    if (colorVariants.length === 0) return true;
    return colorVariants.some(v => (Number(v.stock) || 0) > 0);
  };

  const selectedVariant = hasVariants ? findVariant(selectedSize, selectedColor) : null;
  const currentSelectedStock = hasVariants
    ? (selectedSize ? getVariantStock(selectedSize, selectedColor) : 0)
    : (product.inventory_id ? Math.max(0, Number(product.inventory?.current_stock) || 0) : (product.in_stock !== false ? 0 : 999));

  const isVariantOutOfStock = hasVariants && selectedSize ? currentSelectedStock <= 0 : false;
  
  const inStock = hasVariants
    ? (selectedSize ? currentSelectedStock > 0 : true)
    : (product.inventory_id
        ? (Number(product.inventory?.current_stock) > 0)
        : (product.in_stock !== false));

  const productReviews = reviews.filter((r) => r.productId === product.id || r.productId === product.slug);
  const discount = (originalPrice && Number(originalPrice) > Number(product.price))
    ? Math.round(((Number(originalPrice) - Number(product.price)) / Number(originalPrice)) * 100)
    : null;

  // Dynamically update available sizes and clear selection if unavailable in new color
  const handleColorChange = (newColor) => {
    setSelectedColor(newColor);
    setSizeError(false);

    if (hasVariants && selectedSize) {
      const stockInNewColor = getVariantStock(selectedSize, newColor);
      if (stockInNewColor <= 0) {
        // Requirement 8: If the previously selected size is unavailable in the new colour, automatically clear that selection
        setSelectedSize(null);
      }
    }
  };

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }
    if (hasVariants && currentSelectedStock <= 0) return;
    if (!inStock) return;

    setAdding(true);
    addItem(product, selectedSize || 'One Size', selectedColor || 'None', 1);
    // Fire AddToCart tracking event
    trackAddToCart(product, 1, selectedSize || 'One Size');
    setTimeout(() => {
      setAdding(false);
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        openCart();
      }, 800);
    }, 500);
  };

  const handleBuyNow = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }
    if (hasVariants && currentSelectedStock <= 0) return;
    if (!inStock) return;

    addItem(product, selectedSize || 'One Size', selectedColor || 'None', 1);
    navigate('/checkout');
  };



  // ─── Extract Size Guide Multi-Column Data ───
  const sizeGuide = product.size_guide;
  const isAdvanced = sizeGuide?.columns && sizeGuide?.rows;
  const materialText = product.material || sizeGuide?.material || "Cotton 100%";
  const sizeChartImageUrl = sizeGuide?.image_url || sizeGuide?.chart_image || product.size_chart_image || null;
  const cols = isAdvanced ? sizeGuide.columns : ["Size", "Dimensions"];
  const rows = isAdvanced
    ? sizeGuide.rows
    : Object.entries(sizeGuide || {}).filter(([k]) => k !== 'material' && k !== 'image_url' && k !== 'chart_image').map(([sz, dim]) => ({ "Size": sz, "Dimensions": String(dim) }));

  return (
    <div className="min-h-screen pt-20 pb-20">
      {/* Breadcrumb */}
      <div className="container-site py-4">
        <nav className="flex items-center gap-2 text-xs text-surface-muted">
          <Link to="/" className="hover:text-surface-primary transition-colors">Home</Link>
          <ChevronLeft size={12} className="rotate-180" />
          <Link to="/shop" className="hover:text-surface-primary transition-colors">Shop</Link>
          <ChevronLeft size={12} className="rotate-180" />
          <span className="text-surface-primary capitalize">{product.category}</span>
          <ChevronLeft size={12} className="rotate-180" />
          <span className="text-surface-secondary line-clamp-1">{product.name}</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="container-site py-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">

          {/* ─── Image Gallery Slider ─── */}
          <div className="space-y-4">
            {/* Main Image Slider */}
            <div className="relative w-full rounded-2xl bg-base-950/20 border border-base-300 overflow-hidden flex items-center justify-center">
              {/* Swiper Container */}
              <div 
                ref={sliderRef}
                onScroll={handleScroll}
                className="w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {images.map((img, i) => (
                  <div 
                    key={i} 
                    className="w-full flex-shrink-0 snap-start flex items-center justify-center p-2"
                  >
                    <img
                      src={img}
                      alt={`${product.name} - ${i + 1}`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-auto max-h-[70vh] object-contain rounded-xl select-none"
                    />
                  </div>
                ))}
              </div>

              {/* Dots / Pagination indicator for mobile/desktop slider */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        activeImg === i ? 'bg-brand w-4' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product.badge && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    product.badge === 'LIMITED' ? 'bg-brand text-white' :
                    product.badge === 'NEW DROP' ? 'bg-emerald-500 text-white' :
                    product.badge === 'SALE' ? 'bg-red-500 text-white' :
                    'bg-base-400 text-surface-primary'
                  }`}>
                    {product.badge}
                  </span>
                )}
                {discount && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                    -{discount}%
                  </span>
                )}
                {!inStock && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                    STOCK OUT
                  </span>
                )}
              </div>

              {/* Wishlist */}
              <button
                onClick={() => setLiked(!liked)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center hover:border-red-400/50 transition-colors z-10"
              >
                <Heart
                  size={16}
                  className={`transition-colors ${liked ? 'fill-red-400 text-red-400' : 'text-surface-secondary'}`}
                />
              </button>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => handleThumbnailClick(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
                      activeImg === i ? 'border-brand shadow-glow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Product Info ─── */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="section-label mb-2 capitalize"
              >
                {product.category}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="font-black text-h2 mb-3"
              >
                {product.name}
              </motion.h1>

              {/* Rating */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.floor(rating) ? 'fill-brand text-brand' : 'text-base-300'}
                    />
                  ))}
                </div>
                <span className="text-small text-surface-secondary">{rating} ({reviewsCount} reviews)</span>
                {inStock ? (
                  <span className="badge-success">In Stock</span>
                ) : (
                  <span className="badge-danger font-bold">{isVariantOutOfStock ? 'Size Sold Out' : 'Sold Out'}</span>
                )}
              </motion.div>
            </div>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-end gap-3"
            >
              <span className="font-black text-[2rem] text-surface-primary leading-none">
                {formatPrice(product.price)}
              </span>
              {originalPrice && (
                <>
                  <span className="text-h4 text-surface-muted line-through leading-none mb-1">
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="badge-brand leading-none mb-1">Save {discount}%</span>
                </>
              )}
            </motion.div>

            <div className="divider" />

            {/* Color Selector */}
            {product.colors?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-small">Select Color</p>
                  {selectedColor && (
                    <span className="text-xs font-bold text-brand uppercase tracking-wider">{selectedColor}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor === color;
                    const colorStockAvailable = isColorInStock(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        className={`px-4 py-2 rounded-lg border font-semibold text-xs transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-brand bg-brand text-white shadow-glow-sm'
                            : !colorStockAvailable
                              ? 'border-base-300 text-surface-muted/60 bg-base-900/40 line-through'
                              : 'border-base-300 text-surface-secondary hover:border-brand/50 hover:text-surface-primary'
                        }`}
                        title={!colorStockAvailable ? `${color} (All sizes out of stock)` : color}
                      >
                        {color} {!colorStockAvailable && '(Sold Out)'}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Size Selector */}
            {product.sizes?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-small">Select Size</p>
                    {selectedSize && (
                      <span className="text-xs font-bold text-brand uppercase">({selectedSize})</span>
                    )}
                  </div>
                  {/* Noticeably Enlarged & Highly Visible Size Chart Button */}
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-xs sm:text-sm font-bold text-brand hover:text-white transition-all duration-200 flex items-center gap-2 bg-brand/10 hover:bg-brand border-2 border-brand/40 hover:border-brand px-4 sm:px-5 py-2 sm:py-2.5 rounded-full active:scale-95 duration-200 cursor-pointer shadow-sm hover:shadow-glow group shrink-0"
                    title="Open Size Chart & Detailed Fit Guide"
                  >
                    <Ruler size={16} className="text-brand group-hover:text-white transition-colors shrink-0" />
                    <span className="tracking-wide">Size Chart & Fit Guide</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((size) => {
                    const sizeStock = hasVariants ? getVariantStock(size, selectedColor) : 999;
                    const isOutOfStock = hasVariants && sizeStock <= 0;
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                          if (isOutOfStock) return;
                          setSelectedSize(size);
                          setSizeError(false);
                        }}
                        title={
                          isOutOfStock
                            ? `${size} is Out of Stock in ${selectedColor || 'this color'}`
                            : `${size} (${sizeStock} in stock)`
                        }
                        className={`min-w-[52px] h-12 px-3.5 rounded-lg border font-semibold text-small transition-all duration-200 relative flex items-center justify-center ${
                          isOutOfStock
                            ? 'opacity-40 cursor-not-allowed bg-base-900/40 text-surface-muted/60 border-base-300 line-through'
                            : isSelected
                              ? 'border-brand bg-brand text-white shadow-glow-sm cursor-pointer'
                              : 'border-base-300 text-surface-secondary hover:border-brand/50 hover:text-surface-primary cursor-pointer'
                        }`}
                      >
                        <span>{size}</span>
                        {isOutOfStock && (
                          <span className="sr-only">(Out of Stock)</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Live Variant Stock Status Indicator */}
                {selectedSize && (
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    {currentSelectedStock > 0 ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {currentSelectedStock <= 5
                          ? `Only ${currentSelectedStock} unit${currentSelectedStock > 1 ? 's' : ''} left in stock - order soon`
                          : `In Stock (${currentSelectedStock} available)`}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-500 font-bold">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Out of Stock in {selectedColor || 'selected color'}
                      </span>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {sizeError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-red-400 mt-2 font-medium"
                    >
                      Please select a size to continue
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Add to Cart & Buy Now Buttons */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="flex flex-col sm:flex-row gap-3">
              {/* Add to Cart */}
              <button
                disabled={!inStock || (hasVariants && selectedSize && currentSelectedStock <= 0)}
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 border-2 ${
                  (!inStock || (hasVariants && selectedSize && currentSelectedStock <= 0))
                    ? 'border-base-300 text-surface-muted bg-base-600/20 cursor-not-allowed'
                    : added
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-brand text-brand hover:bg-brand hover:text-white shadow-glow-sm cursor-pointer'
                }`}
              >
                {(!inStock || (hasVariants && selectedSize && currentSelectedStock <= 0)) ? (
                  'Stock Out'
                ) : added ? (
                  <>
                    <Check size={16} />
                    Added!
                  </>
                ) : adding ? (
                  'Adding...'
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    Add To Cart
                  </>
                )}
              </button>

              {/* Buy Now */}
              <button
                disabled={!inStock || (hasVariants && selectedSize && currentSelectedStock <= 0)}
                onClick={handleBuyNow}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 shadow-glow hover:shadow-glow-lg ${
                  (!inStock || (hasVariants && selectedSize && currentSelectedStock <= 0))
                    ? 'bg-base-600 text-surface-muted cursor-not-allowed border border-base-300'
                    : 'bg-brand text-white hover:bg-brand-400 cursor-pointer'
                }`}
              >
                <Zap size={16} />
                Buy Now
              </button>
            </motion.div>


            {/* Size Notice — clickable to open size guide */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="w-full glass rounded-xl p-4 border-2 border-dashed border-brand/30 flex items-center justify-between gap-3 hover:border-brand/70 hover:bg-brand/5 transition-all duration-300 group cursor-pointer shadow-glow-sm hover:shadow-glow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <Ruler size={18} className="text-brand" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black text-surface-primary tracking-wide uppercase">Size Chart & Fit Guide</p>
                      <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                    </div>
                    <p className="text-[11px] text-surface-muted mt-0.5">
                      Kindly check the measurements before ordering.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-brand hover:bg-brand-400 text-white px-3 py-2 rounded-lg uppercase tracking-wider transition-colors duration-200 shrink-0">
                  View Chart
                </span>
              </button>
            </motion.div>


            <div className="divider" />

            {/* Description Accordion */}
            <div className="space-y-2">
              {/* Description */}
              <div className="rounded-xl border border-base-300 overflow-hidden">
                <button
                  onClick={() => setDescOpen(!descOpen)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-small font-semibold text-surface-primary hover:bg-base-500/50 transition-colors"
                >
                  Description
                  <ChevronDown size={16} className={`transition-transform ${descOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {descOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-small text-surface-secondary leading-relaxed whitespace-pre-line">
                        {longDesc}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Features */}
              <div className="rounded-xl border border-base-300 overflow-hidden">
                <button
                  onClick={() => setFeatOpen(!featOpen)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-small font-semibold text-surface-primary hover:bg-base-500/50 transition-colors"
                >
                  Features & Materials
                  <ChevronDown size={16} className={`transition-transform ${featOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {featOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <ul className="px-4 pb-4 space-y-2">
                        {featuresList.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-small text-surface-secondary">
                            <Check size={13} className="text-brand flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Reviews ─── */}
        {productReviews.length > 0 && (
          <div className="mt-20">
            <div className="flex items-end justify-between mb-8">
               <div>
                <p className="section-label mb-2">Reviews</p>
                <h2 className="font-bold text-h3">What people say</h2>
              </div>
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-brand text-brand" />
                ))}
                <span className="font-bold text-surface-primary">{rating}</span>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {productReviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass rounded-xl p-5 border border-base-300"
                >
                  <div className="flex items-center gap-0.5 mb-3">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} size={12} className="fill-brand text-brand" />
                    ))}
                  </div>
                  <p className="text-small text-surface-secondary leading-relaxed mb-4">
                    "{review.comment}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-xs font-bold text-brand">
                        {review.avatar}
                      </div>
                      <span className="text-xs font-semibold">{review.name}</span>
                    </div>
                    <span className="text-[10px] text-surface-muted">{review.date}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Related Products ─── */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="section-label mb-2">You Might Also Like</p>
                <h2 className="font-bold text-h3">Related Products</h2>
              </div>
              <Link to={`/shop?cat=${product.category}`} className="btn-ghost hidden sm:flex items-center gap-1 group">
                View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Elite Multi-Column Size Guide Modal ─── */}
      <AnimatePresence>
        {sizeGuideOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
              onClick={() => setSizeGuideOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
            >
              <div className="glass-dark rounded-3xl p-5 sm:p-8 max-w-3xl sm:max-w-4xl w-full border border-base-300 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-base-300/80">
                  <div className="flex items-center gap-3 text-brand font-bold">
                    <div className="w-11 h-11 rounded-2xl bg-brand/20 flex items-center justify-center shrink-0">
                      <Ruler size={22} className="text-brand" />
                    </div>
                    <div>
                      <h3 className="text-h5 sm:text-h4 font-black text-surface-primary">Size Chart & Fit Guide</h3>
                      <p className="text-xs text-surface-muted font-normal">All measurements are in inches unless specified</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSizeGuideOpen(false)}
                    className="btn-icon rounded-full hover:bg-base-900"
                    title="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Material Info */}
                <div className="mb-6 p-4 rounded-2xl bg-base-900/80 border border-base-300/80 flex items-center gap-3">
                  <Layers size={20} className="text-brand flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-surface-secondary uppercase tracking-wider">Material / Composition</p>
                    <p className="text-sm font-bold text-surface-primary mt-0.5">{materialText}</p>
                  </div>
                </div>

                {/* ── Dynamic Measurement Table ── */}
                {rows && rows.length > 0 && (
                  <div className="mb-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-surface-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Table size={15} className="text-brand" />
                        Measurement Dimensions (Inches)
                      </p>
                      <span className="text-[10px] text-surface-muted font-medium">Swipe horizontally to see all columns</span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-950/70 shadow-inner">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-base-300/80 bg-base-900/90">
                            {cols.map((col, idx) => (
                              <th
                                key={idx}
                                className="px-4 py-3.5 font-bold uppercase tracking-wider text-brand text-[11px] sm:text-xs whitespace-nowrap"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-base-300/40">
                          {rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-brand/5 transition-colors">
                              {cols.map((col, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`px-4 py-3.5 whitespace-nowrap ${
                                    cIdx === 0
                                      ? 'text-surface-primary font-black text-sm bg-base-900/40'
                                      : 'text-surface-secondary font-medium'
                                  }`}
                                >
                                  {row[col] ?? row[col.toLowerCase()] ?? '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Uploaded Size Chart Image / Diagram ── */}
                {sizeChartImageUrl && (
                  <div className="mb-6 rounded-2xl overflow-hidden border border-base-300 bg-base-950/80 p-4 text-center">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <p className="text-xs font-bold text-surface-primary uppercase tracking-wider">Size Chart Diagram</p>
                      <a
                        href={sizeChartImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand font-bold hover:underline flex items-center gap-1"
                      >
                        Open Full View ↗
                      </a>
                    </div>
                    <div className="w-full overflow-x-auto">
                      <img 
                        src={sizeChartImageUrl} 
                        alt="Size Chart Diagram" 
                        className="w-full h-auto max-h-[460px] object-contain mx-auto rounded-xl shadow-md border border-base-300/50"
                      />
                    </div>
                  </div>
                )}

                {/* ── Standard Fallback Measurement Guide if neither table nor image configured ── */}
                {!sizeChartImageUrl && (!rows || rows.length === 0) && (
                  <div className="mb-6 rounded-2xl border border-base-300 bg-base-950/50 p-6 space-y-4">
                    <div className="text-center">
                      <Ruler size={30} className="mx-auto text-brand mb-2 opacity-90" />
                      <p className="text-sm font-bold text-surface-primary">Standard Apparel Sizing Guide</p>
                      <p className="text-xs text-surface-muted mt-0.5">Approximate body & garment measurements for Putimach garments</p>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-900/70">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-base-300 text-brand bg-base-900">
                            <th className="px-4 py-3 font-bold uppercase">Size</th>
                            <th className="px-4 py-3 font-bold uppercase">Chest (in)</th>
                            <th className="px-4 py-3 font-bold uppercase">Length (in)</th>
                            <th className="px-4 py-3 font-bold uppercase">Shoulder (in)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-base-300/50 text-surface-secondary">
                          {(product.sizes?.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL']).map((sz, idx) => {
                            const chestMap = { 'S': '38"', 'M': '40"', 'L': '42"', 'XL': '44"', 'XXL': '46"' };
                            const lenMap = { 'S': '27"', 'M': '28"', 'L': '29"', 'XL': '30"', 'XXL': '31"' };
                            const shMap = { 'S': '17.5"', 'M': '18.5"', 'L': '19.5"', 'XL': '20.5"', 'XXL': '21.5"' };
                            return (
                              <tr key={idx} className="hover:bg-brand/5">
                                <td className="px-4 py-3 font-bold text-surface-primary">{sz}</td>
                                <td className="px-4 py-3 font-medium">{chestMap[sz] || `${36 + idx * 2}"`}</td>
                                <td className="px-4 py-3 font-medium">{lenMap[sz] || `${26 + idx}"`}</td>
                                <td className="px-4 py-3 font-medium">{shMap[sz] || `${17 + idx}"`}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Measurement Guide / Fit Tips ── */}
                <div className="p-4 rounded-2xl bg-base-900/50 border border-base-300/70 grid sm:grid-cols-3 gap-3 text-xs mb-6">
                  <div>
                    <p className="font-bold text-surface-primary">Chest</p>
                    <p className="text-[11px] text-surface-muted mt-0.5 leading-relaxed">
                      Measure horizontally around the fullest part of the chest, under the armpits.
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-surface-primary">Length</p>
                    <p className="text-[11px] text-surface-muted mt-0.5 leading-relaxed">
                      Measure from the highest point of the shoulder down to the bottom hem.
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-surface-primary">Fit Guidance</p>
                    <p className="text-[11px] text-surface-muted mt-0.5 leading-relaxed">
                      Designed with a modern silhouette. For an oversized drape, select one size up.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSizeGuideOpen(false)}
                  className="w-full py-4 rounded-xl bg-brand hover:bg-brand-400 text-white font-bold text-sm shadow-glow transition-all duration-200 cursor-pointer"
                >
                  Close Size Chart
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Sticky Mobile ATC & Buy Now ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden p-3 glass-dark border-t border-base-300">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {/* Info */}
          <div className="flex-1 min-w-0 pr-2">
            <p className="font-bold text-xs line-clamp-1">{product.name}</p>
            <p className="text-brand font-black text-sm mt-0.5">{formatPrice(product.price)}</p>
          </div>
          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button
              disabled={!inStock || (hasVariants && selectedSize && currentSelectedStock <= 0)}
              onClick={handleAddToCart}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 border-2 ${
                (!inStock || (hasVariants && selectedSize && currentSelectedStock <= 0))
                  ? 'border-base-300 text-surface-muted bg-base-600/10 cursor-not-allowed'
                  : added
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-brand text-brand hover:bg-brand hover:text-white cursor-pointer'
              }`}
            >
              {(!inStock || (hasVariants && selectedSize && currentSelectedStock <= 0)) ? 'Out' : added ? 'Added' : 'Add'}
            </button>
            <button
              disabled={!inStock || (hasVariants && selectedSize && currentSelectedStock <= 0)}
              onClick={handleBuyNow}
              className={`flex items-center gap-1 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                (!inStock || (hasVariants && selectedSize && currentSelectedStock <= 0))
                  ? 'bg-base-600 text-surface-muted cursor-not-allowed'
                  : 'bg-brand text-white shadow-glow-sm cursor-pointer'
              }`}
            >
              <Zap size={11} />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
