import React, { useState } from 'react';
import { Product } from '../types';
import { X, Heart, ShoppingBag, Trash2, Flame, TrendingDown, CheckCircle2, ArrowRight } from 'lucide-react';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onTriggerSimulatedDrop?: (productId: string, newPrice: number) => void;
  onOpenCart?: () => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  products,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  onTriggerSimulatedDrop,
  onOpenCart,
}) => {
  const [moveAllSuccess, setMoveAllSuccess] = useState(false);

  if (!isOpen) return null;

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

  // Find price drop / flash sale items in wishlist
  const priceDropItems = wishlistedProducts.filter((p) => p.isFlashSale || p.mrp > p.salePrice);
  const totalWishlistSavings = priceDropItems.reduce((acc, p) => acc + (p.mrp - p.salePrice), 0);

  const handleSimulateDrop = () => {
    if (wishlistedProducts.length === 0) return;
    const target = wishlistedProducts[Math.floor(Math.random() * wishlistedProducts.length)];
    const newPrice = Math.max(999, Math.round(target.salePrice * 0.82));
    if (onTriggerSimulatedDrop) {
      onTriggerSimulatedDrop(target.id, newPrice);
    }
  };

  const handleMoveAllToCart = () => {
    if (wishlistedProducts.length === 0) return;
    
    // Move all items to cart
    wishlistedProducts.forEach((product) => {
      onAddToCart(product);
    });

    setMoveAllSuccess(true);
    setTimeout(() => {
      setMoveAllSuccess(false);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/70 backdrop-blur-sm flex justify-end">
      <div className="bg-[#FDFBF7] w-full max-w-md h-full shadow-2xl flex flex-col border-l border-amber-500/40 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 bg-[#9D174D] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-amber-300 fill-amber-300" />
            <div>
              <h2 className="font-serif-royal text-base font-bold text-white leading-tight">
                My Wishlist ({wishlistedProducts.length})
              </h2>
              {priceDropItems.length > 0 && (
                <p className="text-[10px] text-amber-200">
                  🔥 {priceDropItems.length} Saree(s) on Price Drop / Flash Sale!
                </p>
              )}
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {moveAllSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-300 p-3 flex items-center justify-between gap-2 text-emerald-900 text-xs font-bold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All {wishlistedProducts.length} saree(s) added to your Bag successfully!</span>
            </div>
            {onOpenCart && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                className="text-[11px] bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-emerald-800 transition flex items-center gap-1 shrink-0"
              >
                <span>View Bag</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Wishlist Summary / Price Drop Highlight Alert */}
        {wishlistedProducts.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-pink-50 p-3 border-b border-amber-300/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-pink-950 flex items-center justify-center font-bold shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-pink-950 block leading-tight">
                  Total Potential Savings: ₹{totalWishlistSavings.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-600">
                  Real-time price drop notifications enabled
                </span>
              </div>
            </div>

            <button
              onClick={handleSimulateDrop}
              className="bg-[#9D174D] text-amber-300 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-amber-400 shadow hover:bg-[#831843] transition shrink-0 flex items-center gap-1"
            >
              <Flame className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>Simulate Drop</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {wishlistedProducts.length === 0 ? (
            <div className="text-center py-16 space-y-3 text-slate-500">
              <Heart className="w-12 h-12 text-pink-300 mx-auto" />
              <p className="font-serif-royal text-base font-semibold text-slate-800">Your Wishlist is Empty</p>
              <p className="text-xs">Save your favorite Banarasi & Kanjivaram sarees to buy later and get instant price drop alerts.</p>
            </div>
          ) : (
            wishlistedProducts.map((product) => {
              const savings = product.mrp - product.salePrice;
              const percentDrop = Math.round((savings / product.mrp) * 100);
              const isDropped = product.isFlashSale || savings > 0;

              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 bg-white rounded-2xl border transition shadow-sm relative overflow-hidden ${
                    isDropped ? 'border-amber-400 bg-amber-50/30' : 'border-amber-200/80'
                  }`}
                >
                  {/* Flash sale / Price Drop Tag */}
                  {isDropped && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-pink-700 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-bl-xl shadow-sm flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                      <span>SAVE ₹{savings.toLocaleString('en-IN')} (-{percentDrop}%)</span>
                    </div>
                  )}

                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-16 h-22 object-cover rounded-xl shrink-0 cursor-pointer"
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                  />

                  <div className="flex-1 min-w-0 space-y-1 pt-1">
                    <h4
                      onClick={() => {
                        onSelectProduct(product);
                        onClose();
                      }}
                      className="font-serif-royal text-xs font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-[#9D174D]"
                    >
                      {product.name}
                    </h4>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-700 font-semibold">{product.category}</span>
                      {product.isFlashSale && (
                        <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded border border-red-300">
                          ⚡ Flash Sale
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-extrabold text-[#9D174D]">
                        ₹{product.salePrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 line-through">
                        ₹{product.mrp.toLocaleString('en-IN')}
                      </span>
                      {savings > 0 && (
                        <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                          ₹{savings.toLocaleString('en-IN')} OFF
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onAddToCart(product)}
                        className="px-3 py-1 bg-[#9D174D] text-white font-bold text-[11px] rounded-lg shadow hover:bg-[#831843] transition flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3 text-amber-300" />
                        Move to Bag
                      </button>

                      <button
                        onClick={() => onToggleWishlist(product.id)}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Action Footer */}
        {wishlistedProducts.length > 0 && (
          <div className="p-3 bg-white border-t border-amber-300/80 shadow-lg space-y-2">
            <button
              onClick={handleMoveAllToCart}
              className="w-full py-3 bg-gradient-to-r from-[#9D174D] via-pink-900 to-amber-800 text-amber-300 font-extrabold text-xs rounded-2xl shadow-md border border-amber-400 hover:brightness-110 transition flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span>Move All Wishlist Items ({wishlistedProducts.length}) to Cart</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

