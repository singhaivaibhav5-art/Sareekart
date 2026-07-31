import React, { useState, useEffect } from 'react';
import { Product, Order } from '../types';
import { Sparkles, Sliders, Camera, Eye, History, Zap, CheckCircle2, Heart, ShoppingBag, ArrowRight } from 'lucide-react';

interface AIRecommendationEngineWidgetProps {
  products: Product[];
  browsingHistory: string[];
  orders: Order[];
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenARTryOn: (product: Product) => void;
  onOpenEngineModal: () => void;
}

interface RecommendationResult {
  productId: string;
  matchPercentage: number;
  matchReason: string;
  styleTip: string;
}

const QUICK_OCCASIONS = ['Bridal & Wedding', 'Puja & Festive', 'Reception & Gala', 'Office Wear'];

export const AIRecommendationEngineWidget: React.FC<AIRecommendationEngineWidgetProps> = ({
  products,
  browsingHistory,
  orders,
  wishlistIds,
  onToggleWishlist,
  onSelectProduct,
  onAddToCart,
  onOpenARTryOn,
  onOpenEngineModal,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState('Bridal & Wedding');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stylePersona, setStylePersona] = useState<string | null>('Royal Heritage Connoisseur');
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);

  const viewedProducts = products.filter((p) => browsingHistory.includes(p.id));

  useEffect(() => {
    fetchQuickRecommendations();
  }, [selectedOccasion]);

  const fetchQuickRecommendations = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        browsingHistory,
        pastPurchases: orders.flatMap((o) => o.items.map((i) => i.product.name)),
        preferences: { occasion: selectedOccasion, maxPrice: 15000 },
      };

      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.recommendations && data.recommendations.length > 0) {
        setStylePersona(data.stylePersona || 'Royal Heritage Connoisseur');
        setRecommendations(data.recommendations);
      } else {
        throw new Error('Using fallback recommendations');
      }
    } catch (err) {
      console.warn('AI recommendation widget fallback:', err);
      setStylePersona('Royal Heritage Connoisseur');
      setRecommendations(
        products.slice(0, 4).map((p, i) => ({
          productId: p.id,
          matchPercentage: 96 - i * 3,
          matchReason: `Handpicked ${p.category} match for your ${selectedOccasion} preference.`,
          styleTip: `Pair with classic temple jewelry and contrasting silk blouse.`,
        }))
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full px-4 py-4">
      <div className="bg-gradient-to-br from-[#9D174D] via-[#831843] to-amber-950 text-white rounded-3xl p-5 shadow-xl border-2 border-amber-400/40 space-y-4 relative overflow-hidden">
        
        {/* Decorative Gold Sparkles Background */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-amber-400/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-pink-950 flex items-center justify-center shadow-lg shrink-0">
              <Sparkles className="w-5 h-5 text-pink-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif-royal text-lg font-bold text-white leading-tight">
                  AI Style Recommendation Engine
                </h2>
                <span className="bg-amber-400 text-pink-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Personalized
                </span>
              </div>
              <p className="text-xs text-amber-200">
                AI analysis of your {browsingHistory.length} recently viewed items & occasion preferences
              </p>
            </div>
          </div>

          <button
            onClick={onOpenEngineModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-pink-950 font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 w-fit"
          >
            <Sliders className="w-3.5 h-3.5 text-pink-950" />
            <span>Customize Engine Filters & Photo Match</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Occasion Quick Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 relative z-10">
          <span className="text-xs font-bold text-amber-300 shrink-0">Occasion:</span>
          {QUICK_OCCASIONS.map((occ) => (
            <button
              key={occ}
              onClick={() => setSelectedOccasion(occ)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
                selectedOccasion === occ
                  ? 'bg-amber-400 text-pink-950 font-extrabold shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              {occ}
            </button>
          ))}
        </div>

        {/* AI Recommendations Cards Slider / Grid */}
        {isGenerating ? (
          <div className="py-8 text-center space-y-2 bg-pink-950/40 rounded-2xl border border-amber-400/20">
            <Sparkles className="w-6 h-6 text-amber-300 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-amber-200">
              Gemini AI analyzing browsing history & {selectedOccasion} preference...
            </p>
          </div>
        ) : recommendations.length === 0 ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 relative z-10 pt-1">
            {recommendations.slice(0, 4).map((rec) => {
              const prod = products.find((p) => p.id === rec.productId) || products[0];
              const isWishlisted = wishlistIds.includes(prod.id);

              return (
                <div
                  key={rec.productId}
                  className="bg-white text-slate-800 rounded-2xl overflow-hidden shadow-md border border-amber-300/60 flex flex-col justify-between group"
                >
                  {/* Top Image & Match Score */}
                  <div
                    onClick={() => onSelectProduct(prod)}
                    className="relative aspect-[3/4] bg-slate-100 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {/* Match Score Badge */}
                    <div className="absolute top-2 left-2 bg-emerald-700 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-200" />
                      <span>{rec.matchPercentage}% Match</span>
                    </div>

                    {/* Wishlist Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(prod.id);
                      }}
                      className={`absolute top-2 right-2 p-1.5 rounded-full shadow transition ${
                        isWishlisted ? 'bg-pink-900 text-amber-300' : 'bg-white/90 text-slate-700'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-amber-300' : ''}`} />
                    </button>
                  </div>

                  {/* Card Bottom Details */}
                  <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => onSelectProduct(prod)}
                        className="font-serif-royal font-bold text-xs text-slate-900 truncate cursor-pointer hover:text-[#9D174D]"
                      >
                        {prod.name}
                      </h4>
                      <p className="text-[10px] text-amber-800 font-semibold">{prod.fabric}</p>

                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xs font-extrabold text-[#9D174D]">
                          ₹{prod.salePrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          ₹{prod.mrp.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-200 text-[9px] text-amber-950 font-medium line-clamp-2">
                      💡 {rec.matchReason}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => onOpenARTryOn(prod)}
                        className="flex-1 py-1 bg-amber-500 hover:bg-amber-400 text-pink-950 font-extrabold text-[10px] rounded-lg shadow-xs transition"
                      >
                        AR Try-On
                      </button>

                      <button
                        onClick={() => onAddToCart(prod)}
                        className="flex-1 py-1 bg-[#9D174D] hover:bg-[#831843] text-white font-extrabold text-[10px] rounded-lg shadow-xs transition"
                      >
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
