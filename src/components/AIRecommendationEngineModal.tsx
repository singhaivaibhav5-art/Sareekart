import React, { useState, useEffect } from 'react';
import { Product, Order } from '../types';
import {
  X,
  Sparkles,
  Camera,
  Upload,
  History,
  ShoppingBag,
  Sliders,
  CheckCircle2,
  Heart,
  Eye,
  RefreshCw,
  Zap,
  Tag,
  Coins,
} from 'lucide-react';

interface AIRecommendationEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  browsingHistory: string[]; // Product IDs
  orders: Order[];
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenARTryOn: (product: Product) => void;
}

interface RecommendationResult {
  productId: string;
  matchPercentage: number;
  matchReason: string;
  styleTip: string;
}

const OCCASIONS = [
  'Bridal & Wedding',
  'Reception & Gala',
  'Haldi & Mehendi',
  'Puja & Festive',
  'Farewell Party',
  'Office & Formal',
];

const FABRICS = [
  'Banarasi Silk',
  'Kanjivaram Silk',
  'Chanderi & Gold Tissue',
  'Organza & Net',
  'Georgette & Chiffon',
  'Linen & Cotton',
];

const COLORS = [
  { name: 'Maroon & Red', hex: '#9D174D' },
  { name: 'Royal Gold', hex: '#F59E0B' },
  { name: 'Magenta & Pink', hex: '#BE185D' },
  { name: 'Navy & Royal Blue', hex: '#1E3A8A' },
  { name: 'Pastel Emerald', hex: '#047857' },
];

export const AIRecommendationEngineModal: React.FC<AIRecommendationEngineModalProps> = ({
  isOpen,
  onClose,
  products,
  browsingHistory,
  orders,
  wishlistIds,
  onToggleWishlist,
  onSelectProduct,
  onAddToCart,
  onOpenARTryOn,
}) => {
  // Preference state
  const [selectedOccasion, setSelectedOccasion] = useState('Bridal & Wedding');
  const [selectedFabric, setSelectedFabric] = useState('Banarasi Silk');
  const [selectedColor, setSelectedColor] = useState('Maroon & Red');
  const [maxPrice, setMaxPrice] = useState<number>(15000);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);

  // Engine loading & output state
  const [isGenerating, setIsGenerating] = useState(false);
  const [stylePersona, setStylePersona] = useState<string | null>(null);
  const [stylistAnalysis, setStylistAnalysis] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);

  // Recently viewed products mapped
  const viewedProducts = products.filter((p) => browsingHistory.includes(p.id));
  
  // Purchased products mapped
  const purchasedProductNames = orders.flatMap((o) => o.items.map((i) => i.product.name));

  useEffect(() => {
    if (isOpen && recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setUploadedImageBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchRecommendations = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        browsingHistory,
        pastPurchases: purchasedProductNames,
        preferences: {
          occasion: selectedOccasion,
          fabric: selectedFabric,
          color: selectedColor,
          maxPrice,
        },
        imageBase64: uploadedImageBase64 || undefined,
      };

      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setStylePersona(data.stylePersona || 'Royal Heritage Connoisseur');
        setStylistAnalysis(data.stylistAnalysis || 'Curated tailored recommendations based on your taste.');
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.warn('Recommendation fetch notice:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFBF7] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/50 my-auto flex flex-col relative max-h-[92vh]">
        
        {/* Top Royal Header */}
        <div className="p-4 bg-gradient-to-r from-[#9D174D] via-[#831843] to-amber-700 text-white flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-400 p-0.5 flex items-center justify-center shadow">
              <Sparkles className="w-5 h-5 text-pink-950 animate-spin" />
            </div>
            <div>
              <h2 className="font-serif-royal text-lg font-bold text-white leading-tight flex items-center gap-1.5">
                AI Style Recommendation Engine
                <span className="text-amber-300 text-xs font-sans bg-pink-900/80 px-2 py-0.5 rounded-full border border-amber-400/40">
                  Gemini Powered
                </span>
              </h2>
              <p className="text-[11px] text-amber-200">
                Personalized suggestions based on browsing history, past purchases, preferences & outfit photos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Signal Cards Summary: Browsing History & Past Orders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Browsing Signals */}
            <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-pink-950">
                <span className="flex items-center gap-1.5 text-amber-800">
                  <Eye className="w-4 h-4 text-amber-600" /> Browsing History Signals
                </span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {viewedProducts.length} Items Analyzed
                </span>
              </div>

              {viewedProducts.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No recent views yet. Browse sarees to sharpen AI accuracy!</p>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {viewedProducts.slice(0, 4).map((p) => (
                    <div key={p.id} className="shrink-0 text-center space-y-0.5">
                      <img src={p.images[0]} alt={p.name} className="w-10 h-12 object-cover rounded-lg border border-amber-200 shadow-xs mx-auto" />
                      <p className="text-[9px] font-semibold text-slate-700 truncate w-12">{p.fabric}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Purchases Signals */}
            <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-pink-950">
                <span className="flex items-center gap-1.5 text-amber-800">
                  <History className="w-4 h-4 text-amber-600" /> Past Purchase Signals
                </span>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {orders.length} Past Orders
                </span>
              </div>

              {orders.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No past purchases. AI will use your preferences & image visual matches!</p>
              ) : (
                <div className="space-y-1">
                  {orders.slice(0, 2).map((o) => (
                    <div key={o.id} className="flex justify-between text-[11px] text-slate-700 font-medium bg-amber-50/50 p-1.5 rounded-lg">
                      <span className="truncate max-w-[150px]">{o.items[0]?.product.name}</span>
                      <span className="font-bold text-[#9D174D]">₹{o.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preferences & Visual Outfit Upload Controls */}
          <div className="bg-white p-4 rounded-2xl border border-amber-300/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <h3 className="font-serif-royal text-sm font-bold text-pink-950 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-600" /> Fine-Tune Style Filters & Outfit Upload
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">Step 1 of 2</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Occasion Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Occasion</label>
                <div className="flex flex-wrap gap-1.5">
                  {OCCASIONS.map((occ) => (
                    <button
                      key={occ}
                      onClick={() => setSelectedOccasion(occ)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                        selectedOccasion === occ
                          ? 'bg-[#9D174D] text-white border-amber-400 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                      }`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabric Preference */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Preferred Fabric</label>
                <div className="flex flex-wrap gap-1.5">
                  {FABRICS.map((fab) => (
                    <button
                      key={fab}
                      onClick={() => setSelectedFabric(fab)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                        selectedFabric === fab
                          ? 'bg-[#9D174D] text-white border-amber-400 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                      }`}
                    >
                      {fab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette Choice */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Color Palette</label>
                <div className="flex items-center gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                        selectedColor === c.name
                          ? 'bg-amber-100 border-amber-500 text-pink-950 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shadow-xs border border-black/20" style={{ backgroundColor: c.hex }} />
                      <span>{c.name.split('&')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Maximum Budget</span>
                  <span className="text-[#9D174D]">₹{maxPrice.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="3000"
                  max="25000"
                  step="1000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#9D174D]"
                />
              </div>
            </div>

            {/* Visual Outfit Image Upload Block */}
            <div className="pt-3 border-t border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-xs text-pink-950 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-600" /> Upload Outfit or Inspiration Photo (Optional)
                </label>
                {uploadedImageBase64 && (
                  <button
                    onClick={() => setUploadedImageBase64(null)}
                    className="text-[11px] text-red-600 font-bold hover:underline"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              <label className="border-2 border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-100/40 rounded-2xl p-3 flex items-center justify-center gap-3 cursor-pointer transition">
                {uploadedImageBase64 ? (
                  <div className="flex items-center gap-3 w-full">
                    <img src={uploadedImageBase64} alt="Outfit Photo" className="w-12 h-16 object-cover rounded-xl shadow border border-amber-400" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Outfit Inspiration Image Attached!
                      </p>
                      <p className="text-[10px] text-slate-500">Gemini will analyze color & pattern to match our saree catalog.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-pink-950">
                    <Upload className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold">Tap to upload saree/outfit photo for visual AI matching</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={fetchRecommendations}
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:brightness-110 text-pink-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 text-pink-950 animate-spin" />
                  <span>Gemini AI Analyzing Style Signals & Catalog...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-pink-950" />
                  <span>Generate Personalized AI Style Recommendations ✨</span>
                </>
              )}
            </button>
          </div>

          {/* AI Style Recommendations Results */}
          {stylePersona && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Persona Header Banner */}
              <div className="bg-gradient-to-r from-[#9D174D] to-[#831843] text-white p-4 rounded-2xl shadow-md border border-amber-400/40 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Your AI Style Persona
                </div>
                <h3 className="font-serif-royal text-xl font-extrabold text-amber-300">
                  {stylePersona}
                </h3>
                <p className="text-xs text-amber-100/90 leading-relaxed font-normal pt-1">
                  "{stylistAnalysis}"
                </p>
              </div>

              {/* Recommendations Cards Grid */}
              <div className="space-y-3">
                <h4 className="font-serif-royal font-bold text-sm text-pink-950 flex items-center gap-1.5 uppercase tracking-wide">
                  <span>👑</span> Handpicked Saree Matches ({recommendations.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendations.map((rec) => {
                    const product = products.find((p) => p.id === rec.productId) || products[0];
                    const isWishlisted = wishlistIds.includes(product.id);

                    return (
                      <div
                        key={rec.productId}
                        className="bg-white rounded-2xl border border-amber-200/90 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between group relative"
                      >
                        {/* Match Percentage Badge */}
                        <div className="absolute top-3 left-3 z-10 bg-emerald-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                          <span>{rec.matchPercentage}% AI Match</span>
                        </div>

                        {/* Wishlist Button */}
                        <button
                          onClick={() => onToggleWishlist(product.id)}
                          className={`absolute top-3 right-3 z-10 p-1.5 rounded-full shadow transition ${
                            isWishlisted ? 'bg-pink-900 text-amber-300' : 'bg-white/90 text-slate-700'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-amber-300' : ''}`} />
                        </button>

                        {/* Card Image */}
                        <div
                          onClick={() => {
                            onSelectProduct(product);
                            onClose();
                          }}
                          className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer"
                        >
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute bottom-2 left-2 bg-pink-950/80 backdrop-blur text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30">
                            ₹{product.salePrice.toLocaleString('en-IN')} ({product.fabric})
                          </div>
                        </div>

                        {/* Card Content & AI Reasoning */}
                        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <h5
                              onClick={() => {
                                onSelectProduct(product);
                                onClose();
                              }}
                              className="font-serif-royal font-bold text-sm text-slate-900 line-clamp-1 cursor-pointer hover:text-[#9D174D]"
                            >
                              {product.name}
                            </h5>

                            {/* Why it matches */}
                            <div className="mt-1.5 p-2 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] text-amber-950 leading-tight space-y-1">
                              <p className="font-bold text-amber-900 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-600" /> Why AI Picked This:
                              </p>
                              <p className="text-slate-700">{rec.matchReason}</p>
                            </div>

                            {/* Stylist Tip */}
                            <p className="text-[10px] text-slate-500 italic mt-1.5">
                              💡 <span className="font-semibold text-slate-700">Styling Tip:</span> {rec.styleTip}
                            </p>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => {
                                onOpenARTryOn(product);
                              }}
                              className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-pink-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-pink-950" />
                              <span>AR Try-On</span>
                            </button>

                            <button
                              onClick={() => onAddToCart(product)}
                              className="flex-1 py-1.5 bg-[#9D174D] hover:bg-[#831843] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1"
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
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 bg-white border-t border-amber-200 flex items-center justify-between">
          <button
            onClick={fetchRecommendations}
            className="text-xs font-bold text-amber-800 hover:text-[#9D174D] flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh AI Suggestions
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#9D174D] text-white font-bold text-xs rounded-xl hover:bg-[#831843] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
