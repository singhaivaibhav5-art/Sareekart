import React from 'react';
import { Mic, Camera, ShoppingBag, Heart, Search, Sparkles, User, ShieldCheck } from 'lucide-react';
import { BRAND_NAME } from '../constants';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  openVoiceSearch: () => void;
  openImageSearch: () => void;
  cartCount: number;
  openCart: () => void;
  wishlistCount: number;
  openWishlist: () => void;
  openAIStylist: () => void;
  openAuth: () => void;
  openWallet: () => void;
  isLoggedIn: boolean;
  walletCoins: number;
  openAdmin: () => void;
  openOrderTracker?: () => void;
  hasWishlistPriceDrop?: boolean;
  openDrapingGuide?: () => void;
  openStyleQuiz?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  openVoiceSearch,
  openImageSearch,
  cartCount,
  openCart,
  wishlistCount,
  openWishlist,
  openAIStylist,
  openAuth,
  openWallet,
  isLoggedIn,
  walletCoins,
  openAdmin,
  openOrderTracker,
  hasWishlistPriceDrop = false,
  openDrapingGuide,
  openStyleQuiz,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#9D174D] text-white shadow-lg border-b border-amber-500/30">
      {/* Top Brand & Loyalty Bar */}
      <div className="px-4 py-2 bg-[#831843] flex items-center justify-between text-xs border-b border-amber-500/20">
        <div className="flex items-center space-[#9D174D] gap-2">
          <span className="bg-amber-500 text-pink-950 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> 100% Authentic Silk Mark
          </span>
          <span className="hidden sm:inline text-amber-200">✨ Free Express Shipping on orders over ₹1,999</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openWallet}
            className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/40 transition"
          >
            🪙 <span className="text-amber-200">{walletCoins} Coins</span>
          </button>
          
          {openOrderTracker && (
            <button
              onClick={openOrderTracker}
              className="text-amber-300 hover:text-amber-100 font-bold text-[11px] bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1"
            >
              🚚 Track Order
            </button>
          )}

          <button
            onClick={openAdmin}
            className="text-amber-200 hover:text-white underline text-[11px] font-medium"
          >
            Admin Panel
          </button>

          <button
            onClick={openAuth}
            className="flex items-center gap-1 text-white hover:text-amber-200 font-medium"
          >
            <User className="w-3.5 h-3.5" />
            <span>{isLoggedIn ? 'Account' : 'Login'}</span>
          </button>
        </div>
      </div>

      {/* Main Logo & Action Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSearchQuery('')}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-300 p-0.5 flex items-center justify-center shadow-md shrink-0">
            <div className="w-full h-full rounded-full bg-[#9D174D] flex items-center justify-center">
              <span className="font-serif-royal font-extrabold text-amber-300 text-xl leading-none">V</span>
            </div>
          </div>
          <div>
            <div className="font-serif-royal text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1 leading-none">
              {BRAND_NAME}
              <span className="text-amber-400 text-xs">👑</span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-amber-200/90 tracking-wider font-light uppercase">Pure Handloom Silk & Banarasi</p>
          </div>
        </div>

        {/* AI Stylist & Draping Quick Triggers */}
        <div className="hidden md:flex items-center gap-2">
          {openStyleQuiz && (
            <button
              onClick={openStyleQuiz}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-pink-950 font-extrabold rounded-full text-xs shadow-md hover:brightness-110 transition border border-amber-300"
              title="Take 5-Question AI Style Quiz"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-950" />
              <span>AI Style Quiz 🎯</span>
            </button>
          )}

          <button
            onClick={openAIStylist}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-900/90 text-amber-300 font-bold rounded-full text-xs border border-amber-400/60 shadow hover:bg-pink-800 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Stylist</span>
          </button>

          {openDrapingGuide && (
            <button
              onClick={openDrapingGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-900/90 text-amber-300 font-bold rounded-full text-xs border border-amber-400/60 shadow hover:bg-pink-800 transition"
              title="Interactive Saree Draping Tutorial"
            >
              <span>Draping Guide 💃</span>
            </button>
          )}
        </div>

        {/* AI Sparkle Icon + Wishlist & Cart Icons (Requirement 1: AI Icon in Top Header) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Sparkle Icon in Header */}
          <button
            onClick={openStyleQuiz || openAIStylist}
            className="p-2 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-pink-950 font-extrabold transition hover:brightness-110 shadow-md flex items-center justify-center"
            title="AI Recommendation Quiz & Engine ✨"
          >
            <Sparkles className="w-5 h-5 text-pink-950 animate-pulse" />
          </button>

          <button
            onClick={openWishlist}
            className={`relative p-2 rounded-full hover:bg-pink-800/60 transition text-amber-200 ${
              hasWishlistPriceDrop ? 'animate-pulse' : ''
            }`}
            title={hasWishlistPriceDrop ? 'Wishlist Price Drop Alert!' : 'Wishlist'}
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-pink-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                {wishlistCount}
              </span>
            )}
            {hasWishlistPriceDrop && (
              <span className="absolute -bottom-1 -right-1 bg-red-600 text-amber-300 text-[8px] font-extrabold px-1 rounded-full shadow border border-amber-300">
                🔥 SALE
              </span>
            )}
          </button>

          <button
            onClick={openCart}
            className="relative p-2 rounded-full bg-amber-500 text-pink-950 font-bold transition hover:bg-amber-400 shadow-md flex items-center gap-1 px-3"
            title="Cart"
          >
            <ShoppingBag className="w-5 h-5 text-pink-950" />
            <span className="text-xs font-bold hidden sm:inline">Bag</span>
            {cartCount > 0 && (
              <span className="bg-pink-900 text-amber-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sticky Search Bar (Requirement 1) */}
      <div className="px-4 pb-3">
        <div className="relative flex items-center bg-white rounded-full shadow-inner border border-amber-400/50 overflow-hidden text-slate-800">
          <Search className="w-4 h-4 ml-3 text-pink-900/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Banarasi, Kanjivaram, Silk Sarees..."
            className="w-full py-2 px-2.5 text-xs sm:text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-900 font-medium"
          />

          <div className="flex items-center pr-1.5 gap-1">
            {/* Voice Search Mic Icon */}
            <button
              onClick={openVoiceSearch}
              className="p-1.5 rounded-full hover:bg-pink-50 text-pink-900 transition"
              title="Voice Search"
            >
              <Mic className="w-4 h-4 text-pink-900" />
            </button>

            {/* Image Search Camera Icon */}
            <button
              onClick={openImageSearch}
              className="p-1.5 rounded-full hover:bg-amber-50 text-amber-600 transition"
              title="Visual Image Search"
            >
              <Camera className="w-4 h-4 text-amber-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
