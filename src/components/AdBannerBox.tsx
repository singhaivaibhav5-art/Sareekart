import React from 'react';
import { AdBanner } from '../types';
import { Edit3, Tag, Sparkles } from 'lucide-react';

interface AdBannerBoxProps {
  adBanner: AdBanner;
  onCategorySelect: (category: string) => void;
  onAdTap?: (code: string) => void;
  openAdmin: () => void;
}

export const AdBannerBox: React.FC<AdBannerBoxProps> = ({ adBanner, onCategorySelect, onAdTap, openAdmin }) => {
  if (!adBanner.active) return null;

  const handleAdClick = () => {
    if (onAdTap) {
      onAdTap('BRIDE20');
    } else {
      onCategorySelect(adBanner.categoryLink || 'All');
    }
    document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full px-4 py-2">
      {/* 3"x2.5" Ad Banner Box Ratio (aspect-[12/10]) */}
      <div
        onClick={handleAdClick}
        className="relative w-full aspect-[12/10] rounded-2xl overflow-hidden shadow-lg border-2 border-amber-500/40 bg-[#831843] group cursor-pointer"
      >
        {adBanner.videoUrl ? (
          <video
            src={adBanner.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85"
          />
        ) : (
          <img
            src={adBanner.imageUrl}
            alt={adBanner.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85"
          />
        )}

        {/* Glassmorphism Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-950/95 via-pink-900/60 to-transparent p-5 flex flex-col justify-between text-white">
          <div className="flex items-start justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-pink-950 font-extrabold text-[10px] rounded-full uppercase tracking-widest shadow">
              <Sparkles className="w-3 h-3 text-pink-950" />
              <span>OFFER OF THE WEEK</span>
            </div>

            {/* Admin Editable Badge */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openAdmin();
              }}
              className="bg-pink-950/90 text-amber-300 text-[10px] font-medium px-2 py-1 rounded-full border border-amber-400/50 flex items-center gap-1 hover:bg-pink-900 transition"
              title="Edit Ad Banner in Admin"
            >
              <Edit3 className="w-3 h-3 text-amber-400" />
              <span>Admin Editable</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-serif-royal text-xl sm:text-2xl font-extrabold text-amber-300 leading-tight">
              {adBanner.title}
            </h3>

            <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed bg-pink-950/50 backdrop-blur p-2 rounded-lg border border-amber-500/20">
              <Tag className="w-3.5 h-3.5 text-amber-400 inline mr-1" />
              {adBanner.highlightText}
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAdClick();
              }}
              className="mt-2 w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-pink-950 font-extrabold text-xs rounded-full shadow-md hover:brightness-110 transition flex items-center justify-center gap-1 uppercase tracking-wider"
            >
              {adBanner.buttonText || 'Claim BRIDE20 Coupon'} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
