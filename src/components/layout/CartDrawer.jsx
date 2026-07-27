// src/components/layout/CartDrawer.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../../store/cartStore';

const formatPrice = (p) => `৳${p.toLocaleString('en-BD')}`;

export default function CartDrawer() {
  const navigate = useNavigate();
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCartStore();
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-[#FDFBF7] border-l border-[#E9E2D2] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-base-300">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-brand" />
                <span className="font-semibold">Your Cart</span>
                {items.length > 0 && (
                  <span className="badge-brand">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                )}
              </div>
              <button onClick={closeCart} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar">
              <AnimatePresence mode="popLayout">
                {items.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full gap-4 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-base-500 flex items-center justify-center">
                      <ShoppingBag size={28} className="text-surface-muted" />
                    </div>
                    <div>
                      <p className="font-semibold text-surface-primary mb-1">Your cart is empty</p>
                      <p className="text-small text-surface-muted">Add something fire to the bag</p>
                    </div>
                    <button onClick={closeCart} className="btn-primary mt-2">
                      Browse Shop
                    </button>
                  </motion.div>
                ) : (
                  items.map((item) => (
                    <motion.div
                      key={item.key}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-4 py-4 border-b border-base-400/50"
                    >
                      {/* Image */}
                      <div className="w-20 h-24 rounded-lg overflow-hidden bg-base-500 flex-shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${item.product.slug}`}
                          onClick={closeCart}
                          className="font-semibold text-small text-surface-primary hover:text-brand transition-colors line-clamp-1"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-surface-muted mt-0.5">
                          Size: {item.size}{item.color && item.color !== 'None' && item.color !== 'None' ? ` / Color: ${item.color}` : ''}
                        </p>
                        <p className="text-brand font-semibold text-small mt-1">
                          {formatPrice(item.product.price)}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          {/* Qty Controls */}
                          <div className="flex items-center gap-1 glass rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item.key, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center rounded text-surface-secondary hover:text-surface-primary transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-small font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.key, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center rounded text-surface-secondary hover:text-surface-primary transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.key)}
                            className="text-surface-muted hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-base-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-surface-secondary text-small">Subtotal</span>
                  <span className="font-bold text-lg">{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-surface-muted mb-4 text-center">
                  Shipping & taxes calculated at checkout
                </p>
                <button
                  onClick={() => { closeCart(); navigate('/checkout'); }}
                  className="btn-primary w-full justify-between group"
                >
                  <span>Checkout</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
