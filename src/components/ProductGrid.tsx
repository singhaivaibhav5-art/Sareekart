import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Heart, Star, Sparkles, Coins, ShoppingBag, ArrowUpDown } from 'lucide-react';
export type SortOption = 'featured' | 'lowToHigh' | 'highToLow' | 'newest';
interface ProductGridProps { products: Product[]; wishlistIds: string[]; onToggleWishlist: (id: string) => void; onSelectProduct: (p: Product) => void; onAddToCart: (p: Product) => void; selectedCategory: string; }

export const ProductGrid: React.FC<ProductGridProps> = ({ products, wishlistIds, onToggleWishlist, onSelectProduct, onAddToCart, selectedCategory }) => {
  const [animatingIds, setAnimatingIds] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'lowToHigh') return list.sort((a, b) => (Number(a.salePrice??0)) - (Number(b.salePrice??0)));
    if (sortBy === 'highToLow') return list.sort((a, b) => (Number(b.salePrice??0)) - (Number(a.salePrice??0)));
    return list;
  }, [products, sortBy]);

  return (
    <div id="product-catalog" className="w-full px-4 pt-3 pb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-pink-950 text-sm uppercase">👑 {selectedCategory === 'All'? 'Royal Saree Collection' : selectedCategory}</h2>
        <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-xl px-2 py-1 text-xs"><ArrowUpDown className="w-3 h-3" /><select value={sortBy} onChange={e=>setSortBy(e.target.value as SortOption)} className="bg-transparent font-semibold"><option value="featured">Featured</option><option value="lowToHigh">Low to High</option><option value="highToLow">High to Low</option></select></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sortedProducts.map((product) => {
          const mrp = Number(product.mrp??0); const sale = Number(product.salePrice??mrp); const discount = mrp>0? Math.round(((mrp-sale)/mrp)*100) : 0; const isWishlisted = wishlistIds.includes(product.id);
          return (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-amber-200/70 shadow-sm flex flex-col group">
              <div className="relative aspect-[3/4] bg-slate-100 cursor-pointer" onClick={()=>onSelectProduct(product)}>
                <img src={product.images?.[0] || 'https://via.placeholder.com/300'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute top-2 left-2 flex flex-col gap-1">{product.isBestseller && <span className="bg-[#9D174D] text-amber-300 text-[9px] px-2 py-0.5 rounded-full font-bold">Bestseller</span>}{discount>0 && <span className="bg-emerald-700 text-white text-[9px] px-1.5 py-0.5 rounded">{discount}% OFF</span>}</div>
                <button onClick={e=>{e.stopPropagation(); onToggleWishlist(product.id); setAnimatingIds(p=>({...p,[product.id]:true})); setTimeout(()=>setAnimatingIds(p=>({...p,[product.id]:false})),600);}} className={`absolute top-2 right-2 p-1.5 rounded-full ${isWishlisted?'bg-pink-900 text-amber-300':'bg-white/90'}`}><Heart className={`w-4 h-4 ${isWishlisted?'fill-amber-300':''}`} /></button>
                <div className="absolute bottom-2 left-2 bg-pink-950/85 text-amber-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Coins className="w-3 h-3" />Earn {Number(product.rewardPoints??0)}</div>
              </div>
              <div className="p-3 flex flex-col flex-1 justify-between">
                <div><div className="flex justify-between text-[10px] text-slate-500"><span className="uppercase font-semibold text-amber-700">{product.category}</span><span className="flex items-center gap-0.5 font-bold text-amber-600"><Star className="w-3 h-3 fill-amber-500" />{Number(product.rating??5).toFixed(1)}</span></div><h3 onClick={()=>onSelectProduct(product)} className="font-bold text-xs line-clamp-2 mt-1 cursor-pointer hover:text-[#9D174D]">{product.name}</h3></div>
                <div><div className="flex gap-1.5 items-baseline mt-2"><span className="font-extrabold text-[#9D174D] text-sm">₹{sale.toLocaleString('en-IN')}</span><span className="text-xs line-through text-slate-400">₹{mrp.toLocaleString('en-IN')}</span></div><button onClick={()=>onAddToCart(product)} className="w-full mt-2 py-1.5 bg-[#9D174D] text-white text-xs rounded-xl flex justify-center items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" />Add to Bag</button></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
