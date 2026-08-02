import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Heart, Star, Sparkles, Coins, ShoppingBag, ArrowUpDown } from 'lucide-react';

export type SortOption = 'featured' | 'lowToHigh' | 'highToLow' | 'newest';

interface ProductGridProps {
  products: Product[];
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  selectedCategory: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  wishlistIds,
  onToggleWishlist,
  onSelectProduct,
  onAddToCart,
  selectedCategory,
}) => {
  const [animatingIds, setAnimatingIds] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'lowToHigh') {
      return list.sort((a, b) => (Number(a.salePrice?? 0)) - (Number(b.salePrice?? 0)));
    }
    if (sortBy === 'highToLow') {
      return list.sort((a, b) => (Number(b.salePrice?? 0)) - (Number(a.salePrice?? 0)));
    }
    if (sortBy === 'newest') {
      return list.sort((a, b) => {
        if (a.isNewArrival &&!b.isNewArrival) return -1;
        if (!a.isNewArrival && b.isNewArrival) return 1;
        return b.id.localeCompare(a.id);
      });
    }
    return list;
  }, [products, sortBy]);

  const handleWishlistClick = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(productId);
    setAnimatingIds((prev) => ({...prev, [productId]: true }));
    setTimeout(() => {
      setAnimatingIds((prev) => ({...prev, [productId]: false }));
    }, 600);
  };

  return (
    <div id="product-catalog" className="w-full px-4 pt-3 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="font-serif-royal text-base font-bold text-pink-950 flex items-center gap-1.5 uppercase tracking-wide">
            <span className="text-amber-500">👑</span> {selectedCategory === 'All'? 'Royal Saree Collection' : `${selectedCategory} Sarees`}
          </h2>
          <p className="text-[11px] text-slate-500">
            {sortedProducts.length} Authentic Heritage Pieces Available
          </p>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white border border-amber-300/80 rounded-xl px-2.5 py-1.5 shadow-sm text-xs text-pink-950">
          <ArrowUpDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <label htmlFor="product-sort-select" className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
            Sort By:
          </label>
          <select
            id="product-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent font-semibold text-xs text-pink-950 focus:outline-none cursor-pointer pr-1"
          >
            <option value="featured">Featured</option>
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
            <option value="newest">Newest Arrivals</option>
          </select>
        </div>
      </div>

      {sortedProducts.length === 0? (
        <div className="text-center py-10 bg-white rounded-2xl border border-amber-200/60 p-6 shadow-sm">
          <p className="text-pink-900 font-serif-royal text-base font-semibold mb-1">No Sarees Found</p>
          <p className="text-slate-500 text-xs">Try selecting another category or clearing your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {sortedProducts.map((product) => {
            const isWishlisted = wishlistIds.includes(product.id);
            const mrp = Number(product.mrp?? 0);
            const salePrice = Number(product.salePrice?? mrp);
            const discountPct = mrp > 0? Math.round(((mrp - salePrice) / mrp) * 100) : 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-amber-200/70 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between group"
              >
                <div
                  className="relative w-full aspect-[3/4] overflow-hidden bg-slate-100 cursor-pointer"
                  onClick={() => onSelectProduct(product)}
                >
                  <img
                    src={product.images?.[0] || 'https://via.placeholder.com/300x400?text=Saree'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    {product.isBestseller && (
                      <span className="bg-[#9D174D] text-amber-300 font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Bestseller
                      </span>
                    )}
                    {product.isFlashSale && (
                      <span className="bg-amber-500 text-pink-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow">
                        Flash Deal
                      </span>
                    )}
                    {discountPct > 0 && (
                      <span className="bg-emerald-700 text-white font-bold text-[9px] px-1.5 py-0.5 rounded">
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleWishlistClick(product.id, e)}
                    className={`absolute top-2 right-2 p-1.5 rounded-full shadow transition-all transform active:scale-75 ${
                      isWishlisted? 'bg-pink-900 text-amber-300' : 'bg-white/90 text-slate-600 hover:text-pink-900'
                    } ${animatingIds[product.id]? 'scale-125 ring-2 ring-pink-500/50 shadow-lg' : 'scale-100'}`}
                    title="Toggle Wishlist"
                  >
                    <Heart
                      className={`w-4 h-4 transition-transform duration-300 ${
                        isWishlisted? 'fill-amber-300' : ''
                      } ${animatingIds[product.id]? 'scale-125 animate-bounce text-pink-400' : ''}`}
                    />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-pink-950/85 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur border border-amber-400/30 flex items-center gap-1 shadow">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span>Earn {Number(product.rewardPoints?? 0)} Coins</span>
                  </div>
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold uppercase text-amber-700 tracking-wider">
                        {product.category}
                      </span>
                      <div className="flex items-center gap-0.5 font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{Number(product.rating?? 5).toFixed(1)}</span>
                        <span className="text-slate-400 font-normal">({Number(product.reviewCount?? 0)})</span>
                      </div>
                    <h3
                      onClick={() => onSelectProduct(product)}
                      className="font-serif-royal text-xs font-bold text-slate-900 line-clamp-2 leading-snug cursor-pointer hover:text-[#9D174D] transition mb-2"
                    >
                      {product.name}
                    </h3>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5 mb-2.5">
                      <span className="text-sm sm:text-base font-extrabold text-[#9D174D]">
                        ₹{salePrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹{mrp.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      onClick={() => onAddToCart(product)}
                      className="w-full py-1.5 bg-[#9D174D] hover:bg-[#831843] text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1 active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                      <span>Add to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
