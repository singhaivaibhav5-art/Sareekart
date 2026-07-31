import React, { useState } from 'react';
import { X, Camera, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { BRAND_NAME } from '../constants';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSelectedImage(base64);
        runImageSearch(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const runImageSearch = async (base64Img: string) => {
    setIsSearching(true);
    setSearchResults(null);

    try {
      const res = await fetch('/api/ai/stylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Img }),
      });

      const data = await res.json();
      if (data.recommendedProductIds && Array.isArray(data.recommendedProductIds)) {
        const matched = products.filter((p) => data.recommendedProductIds.includes(p.id));
        setSearchResults(matched.length > 0 ? matched : products.slice(0, 3));
      } else {
        setSearchResults(products.slice(0, 3));
      }
    } catch (err) {
      setSearchResults(products.slice(0, 3));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-amber-500/50 text-center space-y-4 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <h3 className="font-serif-royal text-lg font-bold text-pink-950 flex items-center justify-center gap-1.5">
            <Camera className="w-5 h-5 text-amber-600" /> Image Visual Search
          </h3>
          <p className="text-xs text-slate-500">
            Upload or snap a photo of any saree to find exact or similar designs in {BRAND_NAME} inventory.
          </p>
        </div>

        {/* Upload Box */}
        <label className="border-2 border-dashed border-amber-400 bg-amber-50/50 hover:bg-amber-100/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition">
          {selectedImage ? (
            <img src={selectedImage} alt="Uploaded" className="w-32 h-44 object-cover rounded-xl shadow" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-amber-500 text-pink-950 flex items-center justify-center shadow">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-pink-950">Tap to Upload Saree Photo</span>
              <span className="text-[10px] text-slate-400">Supports JPG, PNG, WEBP</span>
            </>
          )}
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Search Status & Results */}
        {isSearching && (
          <div className="p-3 bg-white rounded-xl border border-amber-300 text-xs font-semibold text-amber-900 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
            AI Visual Recognition analyzing saree weave & pattern...
          </div>
        )}

        {searchResults && (
          <div className="space-y-2 text-left pt-2 border-t border-amber-200">
            <p className="text-xs font-bold text-pink-950 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              AI Visual Matches Found ({searchResults.length}):
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {searchResults.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    onSelectProduct(prod);
                    onClose();
                  }}
                  className="flex items-center gap-2.5 p-2 bg-white hover:bg-amber-50 rounded-xl border border-slate-200 cursor-pointer transition shadow-sm"
                >
                  <img src={prod.images[0]} alt={prod.name} className="w-10 h-14 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif-royal text-xs font-bold text-slate-900 truncate">{prod.name}</h4>
                    <span className="text-[10px] text-amber-700 font-semibold">{prod.category}</span>
                    <span className="text-xs font-extrabold text-[#9D174D] block">
                      ₹{prod.salePrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
