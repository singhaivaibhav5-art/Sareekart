import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface Props { products: Product[]; onSelectProduct: (p: Product) => void; }

export const AIRecommendationEngineWidget: React.FC<Props> = ({ products, onSelectProduct }) => {
  const [recs, setRecs] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safe Fetch with Fallback
    fetch('/api/ai/recommendations')
     .then(res => { if (!res.ok) throw new Error('API 404'); return res.json(); })
     .then(data => {
        if (Array.isArray(data) && data.length > 0) setRecs(data.slice(0,4));
        else setRecs(products.slice(0,4));
      })
     .catch(() => setRecs(products.slice(0,4)))
     .finally(() => setLoading(false));
  }, [products]);

  if (loading) return <div className="px-4 py-3 bg-white border border-amber-200 rounded-2xl mx-4 text-xs">AI Curated Picks Loading...</div>;
  if (recs.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <h3 className="font-bold text-pink-950 text-sm mb-2">✨ AI Recommended For You</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recs.map(p => {
          const sale = Number(p.salePrice?? 0);
          const mrp = Number(p.mrp?? 0);
          return (
            <div key={p.id} onClick={()=>onSelectProduct(p)} className="min-w-[140px] bg-white border rounded-2xl overflow-hidden cursor-pointer">
              <img src={p.images?.[0] || 'https://via.placeholder.com/300'} className="h-32 w-full object-cover" alt={p.name} />
              <div className="p-2"><p className="text-[11px] font-bold truncate">{p.name}</p><p className="text-xs font-extrabold text-[#9D174D]">₹{sale.toLocaleString('en-IN')}</p><p className="text-[10px] line-through text-slate-400">₹{mrp.toLocaleString('en-IN')}</p></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
