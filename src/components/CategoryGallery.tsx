import React from 'react';
import { CATEGORIES } from '../data/initialData';
import { CategoryName } from '../types';

interface CategoryGalleryProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  openStyleQuiz?: () => void;
}

export const CategoryGallery: React.FC<CategoryGalleryProps> = ({ selectedCategory, onSelectCategory, openStyleQuiz }) => {
  return (
    <div className="w-full pt-3 pb-2 px-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-serif-royal text-sm font-bold text-pink-950 flex items-center gap-1.5 uppercase tracking-wide">
          <span className="text-amber-500">❖</span> Explore Heritage Weaves
        </h2>
        <div className="flex items-center gap-2">
          {openStyleQuiz && (
            <button
              onClick={openStyleQuiz}
              className="text-xs font-bold text-pink-950 bg-amber-400 hover:bg-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500 shadow-sm flex items-center gap-1 transition"
            >
              ✨ Take AI Style Quiz
            </button>
          )}
          <button
            onClick={() => onSelectCategory('All')}
            className={`text-xs font-semibold ${
              selectedCategory === 'All' ? 'text-[#9D174D] font-bold underline' : 'text-slate-500 hover:text-[#9D174D]'
            }`}
          >
            View All
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling Circular Gallery (1.5"x1.5" Circular Boxes) */}
      <div className="flex items-start gap-3.5 overflow-x-auto no-scrollbar py-1">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(isSelected ? 'All' : cat.name)}
              className="flex flex-col items-center gap-1.5 group shrink-0"
            >
              {/* 1.5"x1.5" Circular Box (aspect-square w-14 h-14 sm:w-16 sm:h-16) with Gold ring border */}
              <div
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 transition-all duration-300 transform group-hover:scale-105 shadow-sm ${
                  isSelected
                    ? 'ring-4 ring-amber-500 ring-offset-2 ring-offset-[#FDFBF7] scale-105'
                    : 'bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 group-hover:ring-2 group-hover:ring-amber-400'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-pink-950/20 group-hover:bg-transparent transition" />
                  
                  {/* Category Emoji Badge */}
                  <span className="absolute bottom-0 right-0 text-[10px] bg-amber-400 text-pink-950 px-1 rounded-full shadow">
                    {cat.icon}
                  </span>
                </div>
              </div>

              {/* Category Name & Tag */}
              <div className="text-center w-16">
                <span
                  className={`text-[11px] block font-medium leading-tight line-clamp-1 ${
                    isSelected ? 'font-bold text-[#9D174D]' : 'text-slate-800'
                  }`}
                >
                  {cat.name}
                </span>
                <span className="text-[9px] text-amber-700 font-semibold block scale-90 -mt-0.5">
                  {cat.tag}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
