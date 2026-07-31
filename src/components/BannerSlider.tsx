import React, { useState, useEffect } from 'react';
import { Banner } from '../types';
import { ChevronLeft, ChevronRight, Clock, Sparkles, Edit3, X } from 'lucide-react';

interface BannerSliderProps {
  banners: Banner[];
  onCategorySelect: (category: string) => void;
  onBannerTap?: (banner: Banner) => void;
  showFlashSaleAlert?: boolean;
  openAdmin: () => void;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({
  banners,
  onCategorySelect,
  onBannerTap,
  showFlashSaleAlert = false,
  openAdmin,
}) => {
  const activeBanners = banners.filter((b) => b.active);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Flash Sale Alert visibility (auto-hide 5s + dismissible)
  const [isAlertVisible, setIsAlertVisible] = useState(showFlashSaleAlert);

  useEffect(() => {
    setIsAlertVisible(showFlashSaleAlert);
  }, [showFlashSaleAlert]);

  useEffect(() => {
    if (isAlertVisible) {
      const timer = setTimeout(() => {
        setIsAlertVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAlertVisible]);

  // Flash Sale Countdown Timer (Live Ticking)
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 42, seconds: 19 });

  useEffect(() => {
    if (activeBanners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex];

  const handleBannerClick = () => {
    if (onBannerTap) {
      onBannerTap(currentBanner);
    } else if (currentBanner.targetCategory) {
      onCategorySelect(currentBanner.targetCategory);
    }
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  return (
    <div className="w-full px-4 pt-3 pb-1">
      {/* Flash Sale Bar (Requirement 2: Toggleable, Dismissible X, Auto-hide 5 sec) */}
      {isAlertVisible && (
        <div className="mb-2 bg-gradient-to-r from-[#9D174D] via-[#831843] to-amber-700 text-white rounded-lg px-3 py-1.5 flex items-center justify-between text-xs shadow-sm border border-amber-400/30 animate-in fade-in duration-300">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="uppercase tracking-wide font-serif-royal">Royal Flash Sale</span>
          </div>
          
          <div className="flex items-center gap-2 text-[11px]">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-300" />
              <span className="text-amber-200 hidden sm:inline">Ends in:</span>
              <span className="font-mono bg-pink-950 px-1.5 py-0.5 rounded text-amber-300 font-bold">
                {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            </div>
            <button
              onClick={() => setIsAlertVisible(false)}
              className="p-0.5 hover:bg-white/20 rounded-full transition text-amber-200"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3"x2" Rectangle Ratio Banner Slider (aspect-[3/2] = 1.5 ratio) */}
      <div
        onClick={handleBannerClick}
        className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden shadow-md border-2 border-amber-500/30 group cursor-pointer"
      >
        {currentBanner.videoUrl ? (
          <video
            src={currentBanner.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-pink-950/90 via-pink-950/40 to-transparent flex flex-col justify-end p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-400 text-pink-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {currentBanner.tag}
            </span>
            {currentBanner.discountBadge && (
              <span className="bg-pink-800 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/40">
                {currentBanner.discountBadge}
              </span>
            )}
          </div>

          <h3 className="font-serif-royal text-lg sm:text-2xl font-bold leading-tight text-white mb-0.5 drop-shadow-md">
            {currentBanner.title}
          </h3>
          <p className="text-xs text-amber-100/90 line-clamp-1 mb-2">
            {currentBanner.subtitle}
          </p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBannerClick();
            }}
            className="self-start px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-pink-950 font-extrabold text-xs rounded-full shadow hover:brightness-110 transition flex items-center gap-1"
          >
            Explore Collection →
          </button>
        </div>

        {/* Admin Editable Badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openAdmin();
          }}
          className="absolute top-2 right-2 bg-pink-950/80 backdrop-blur text-amber-300 text-[10px] font-semibold px-2 py-1 rounded-full border border-amber-400/40 flex items-center gap-1 hover:bg-pink-900 transition"
          title="Admin Editable Banner"
        >
          <Edit3 className="w-3 h-3 text-amber-400" />
          <span>Admin Editable</span>
        </button>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-pink-950/60 text-white flex items-center justify-center opacity-70 hover:opacity-100 transition backdrop-blur"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-pink-950/60 text-white flex items-center justify-center opacity-70 hover:opacity-100 transition backdrop-blur"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-2 right-3 flex items-center gap-1">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
