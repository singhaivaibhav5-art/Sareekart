import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import {
  BellRing,
  Sparkles,
  Flame,
  X,
  ShoppingBag,
  ArrowDown,
  ChevronRight,
  TrendingDown,
  RefreshCw,
  Clock,
  Heart,
} from 'lucide-react';

interface WishlistPriceDropNotificationProps {
  products: Product[];
  wishlistIds: string[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenWishlist: () => void;
  onTriggerSimulatedDrop?: (productId: string, newPrice: number) => void;
}

export const WishlistPriceDropNotification: React.FC<WishlistPriceDropNotificationProps> = ({
  products,
  wishlistIds,
  onSelectProduct,
  onAddToCart,
  onOpenWishlist,
  onTriggerSimulatedDrop,
}) => {
  const [activeNotification, setActiveNotification] = useState<{
    product: Product;
    oldPrice: number;
    newPrice: number;
    savings: number;
    percentDrop: number;
    reason: 'PRICE_DROP' | 'FLASH_SALE';
  } | null>(null);

  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Find all wishlisted items with price drops or flash sale
  const wishlistedItems = products.filter((p) => wishlistIds.includes(p.id));

  // Auto-trigger a price drop notification when wishlist contains products with discounts or flash sale
  useEffect(() => {
    if (wishlistIds.length === 0) {
      setActiveNotification(null);
      return;
    }

    // Look for a wishlisted product with a significant price difference or flash sale flag
    const eligibleProducts = wishlistedItems.filter(
      (p) => !dismissedNotificationIds.includes(p.id) && (p.isFlashSale || p.mrp > p.salePrice)
    );

    if (eligibleProducts.length > 0 && !activeNotification) {
      // Pick the highest discount / flash sale item
      const topProduct = eligibleProducts.reduce((max, item) => {
        const itemSavings = item.mrp - item.salePrice;
        const maxSavings = max.mrp - max.salePrice;
        return itemSavings > maxSavings ? item : max;
      }, eligibleProducts[0]);

      const savings = topProduct.mrp - topProduct.salePrice;
      const percentDrop = Math.round((savings / topProduct.mrp) * 100);

      // Auto-popup after 1.5 seconds delay for realistic push notification feel
      const timer = setTimeout(() => {
        setActiveNotification({
          product: topProduct,
          oldPrice: topProduct.mrp,
          newPrice: topProduct.salePrice,
          savings,
          percentDrop,
          reason: topProduct.isFlashSale ? 'FLASH_SALE' : 'PRICE_DROP',
        });
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [wishlistIds, products, dismissedNotificationIds]);

  const handleDismiss = () => {
    if (activeNotification) {
      setDismissedNotificationIds((prev) => [...prev, activeNotification.product.id]);
      setActiveNotification(null);
    }
  };

  const handleManualSimulation = () => {
    if (wishlistedItems.length === 0) return;
    const target = wishlistedItems[Math.floor(Math.random() * wishlistedItems.length)];
    // Calculate new price with extra 15% discount
    const newPrice = Math.max(999, Math.round(target.salePrice * 0.85));
    const oldPrice = target.salePrice;
    const savings = target.mrp - newPrice;
    const percentDrop = Math.round((savings / target.mrp) * 100);

    if (onTriggerSimulatedDrop) {
      onTriggerSimulatedDrop(target.id, newPrice);
    }

    setDismissedNotificationIds((prev) => prev.filter((id) => id !== target.id));
    setActiveNotification({
      product: { ...target, salePrice: newPrice, isFlashSale: true },
      oldPrice: target.mrp,
      newPrice,
      savings,
      percentDrop,
      reason: 'FLASH_SALE',
    });
    setIsMinimized(false);
  };

  if (!activeNotification || wishlistIds.length === 0) {
    return (
      <div className="fixed top-16 right-4 z-40 pointer-events-auto">
        {wishlistIds.length > 0 && (
          <button
            onClick={handleManualSimulation}
            className="bg-[#9D174D] text-amber-300 hover:bg-[#831843] text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-amber-400/50 flex items-center gap-1.5 transition transform hover:scale-105"
            title="Simulate Price Drop Notification"
          >
            <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Simulate Price Drop 🔥</span>
          </button>
        )}
      </div>
    );
  }

  const { product, oldPrice, newPrice, savings, percentDrop, reason } = activeNotification;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-50 w-[94%] max-w-sm pointer-events-auto animate-in slide-in-from-top duration-300">
      <div className="bg-[#831843] text-white rounded-2xl p-3.5 shadow-2xl border-2 border-amber-400 relative overflow-hidden backdrop-blur-md">
        {/* Glow background accent */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-amber-400/30 pb-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-pink-950 font-bold shadow animate-bounce">
              <BellRing className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif-royal font-bold text-xs text-amber-300 tracking-wide flex items-center gap-1">
              {reason === 'FLASH_SALE' ? '⚡ Wishlist Flash Sale Alert!' : '🔥 Wishlist Price Drop Alert!'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="bg-amber-400 text-pink-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              SAVE ₹{savings.toLocaleString('en-IN')}
            </span>
            <button
              onClick={handleDismiss}
              className="p-1 text-amber-200/80 hover:text-white rounded-full transition hover:bg-white/10"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Details Card Content */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-14 h-18 object-cover rounded-xl border border-amber-300/80 shadow cursor-pointer"
              onClick={() => onSelectProduct(product)}
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shadow border border-white">
              -{percentDrop}%
            </span>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <h4
              onClick={() => onSelectProduct(product)}
              className="font-serif-royal text-xs font-bold text-white truncate cursor-pointer hover:text-amber-300 transition"
            >
              {product.name}
            </h4>

            <p className="text-[10px] text-amber-200 flex items-center gap-1 font-medium">
              <TrendingDown className="w-3 h-3 text-emerald-400" /> Price dropped in your wishlist!
            </p>

            {/* Price Difference Display */}
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-sm font-extrabold text-amber-300">
                ₹{newPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-300 line-through">
                ₹{oldPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/40">
                ₹{savings.toLocaleString('en-IN')} OFF
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-3 pt-2 border-t border-amber-400/20 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onSelectProduct(product);
              handleDismiss();
            }}
            className="text-[11px] font-bold text-amber-200 hover:text-white transition flex items-center gap-1"
          >
            <span>View Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSimulation}
              className="px-2 py-1 bg-black/30 hover:bg-black/50 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-400/30 flex items-center gap-1 transition"
              title="Test another price drop alert"
            >
              <RefreshCw className="w-3 h-3" /> Test Drop
            </button>

            <button
              onClick={() => {
                onAddToCart(product);
                handleDismiss();
              }}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-pink-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-pink-950" />
              <span>Claim Offer & Bag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
