import React, { useState, useRef } from 'react';
import { Review, Product } from '../types';
import {
  Star,
  ThumbsUp,
  Camera,
  CheckCircle2,
  Plus,
  X,
  Sparkles,
  Filter,
  Image as ImageIcon,
  MessageSquare,
  UserCheck,
  UploadCloud,
  Eye,
} from 'lucide-react';

interface CustomerReviewsSectionProps {
  product: Product;
}

const INITIAL_REVIEWS_MAP: Record<string, Review[]> = {
  default: [
    {
      id: 'rev-1',
      productId: 'default',
      userName: 'Priya Sharma',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      date: '3 days ago',
      comment: 'Absolutely regal drape! The gold Zari border is heavy and authentic. Wore this to my sister’s sangeet and received non-stop compliments on the fabric shine.',
      verifiedPurchase: true,
      helpfulCount: 24,
      photos: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      id: 'rev-2',
      productId: 'default',
      userName: 'Ananya Roy',
      userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      date: '1 week ago',
      comment: 'The blouse stitching option fit like a glove! Color matches 100% with the photos. Authentic Silk Mark tag attached.',
      verifiedPurchase: true,
      helpfulCount: 15,
      photos: [
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      id: 'rev-3',
      productId: 'default',
      userName: 'Meera Iyer',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      rating: 4,
      date: '2 weeks ago',
      comment: 'Luxurious silk feel. The saree drapes smooth without feeling stiff. Packaging was beautifully boxed with satin wrapping.',
      verifiedPurchase: true,
      helpfulCount: 9,
    },
  ],
};

const LOOK_PHOTO_PRESETS = [
  { label: 'Wedding Look', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Royal Pallu Close-up', url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=600&q=80' },
  { label: 'Ethnic Evening Drape', url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80' },
];

export const CustomerReviewsSection: React.FC<CustomerReviewsSectionProps> = ({ product }) => {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS_MAP.default);
  const [filterRating, setFilterRating] = useState<number | 'ALL' | 'PHOTOS'>('ALL');
  
  // Review Form State
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState('');
  const [comment, setComment] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Photo Lightbox Modal
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Helpful click states
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Photo Upload (File Input to Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setUploadedPhotos((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddPresetPhoto = (url: string) => {
    if (!uploadedPhotos.includes(url)) {
      setUploadedPhotos((prev) => [...prev, url]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newRev: Review = {
        id: `rev-${Date.now()}`,
        productId: product.id,
        userName: userName.trim() || 'Saree Enthusiast',
        userAvatar: uploadedPhotos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        rating: newRating,
        date: 'Just now',
        comment: comment.trim(),
        verifiedPurchase: true,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
        helpfulCount: 0,
      };

      setReviews((prev) => [newRev, ...prev]);
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setShowForm(false);

      // Reset Form
      setComment('');
      setUploadedPhotos([]);
      setUserName('');
      setNewRating(5);

      setTimeout(() => setSubmitSuccess(false), 4000);
    }, 600);
  };

  const toggleHelpful = (reviewId: string) => {
    setLikedReviews((prev) => {
      const isAlreadyLiked = !!prev[reviewId];
      return { ...prev, [reviewId]: !isAlreadyLiked };
    });

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const isLiked = likedReviews[reviewId];
          const curr = r.helpfulCount || 0;
          return { ...r, helpfulCount: isLiked ? curr - 1 : curr + 1 };
        }
        return r;
      })
    );
  };

  // Filter Reviews
  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'ALL') return true;
    if (filterRating === 'PHOTOS') return r.photos && r.photos.length > 0;
    return r.rating === filterRating;
  });

  // Calculate Breakdown Ratings
  const totalCount = reviews.length;
  const avgRating = totalCount > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1) : '5.0';

  const getRatingPercent = (star: number) => {
    if (totalCount === 0) return 0;
    const count = reviews.filter((r) => r.rating === star).length;
    return Math.round((count / totalCount) * 100);
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-300/80 p-4 space-y-4 shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-amber-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-400 text-pink-950 flex items-center justify-center font-extrabold shadow-sm">
            <Star className="w-4 h-4 fill-pink-950" />
          </div>
          <div>
            <h3 className="font-serif-royal font-bold text-sm text-pink-950 flex items-center gap-1.5">
              Customer Reviews & Saree Looks
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Real photos and verified feedback from saree buyers
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3.5 py-1.5 bg-[#9D174D] hover:bg-[#831843] text-amber-300 font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1 border border-amber-400"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
          <span>{showForm ? 'Cancel' : 'Write Review & Add Photo'}</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {submitSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center gap-2 text-emerald-900 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Thank you! Your saree review and look photo have been published successfully!</span>
        </div>
      )}

      {/* Rating Breakdown & Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-pink-50/50 p-3.5 rounded-xl border border-pink-200">
        {/* Overall Score */}
        <div className="flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-pink-200 pb-3 sm:pb-0 pr-0 sm:pr-3">
          <span className="text-3xl font-extrabold text-pink-950 font-serif-royal">{avgRating}</span>
          <div className="flex items-center gap-0.5 text-amber-500 my-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-[11px] text-slate-600 font-semibold">
            Based on {totalCount} Customer Review{totalCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* 5-Star Distribution Bars */}
        <div className="sm:col-span-2 space-y-1 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map((star) => {
            const pct = getRatingPercent(star);
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-10 text-[11px] font-bold text-slate-700 flex items-center gap-0.5">
                  {star} <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                </span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-[#9D174D] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-[10px] text-slate-500 font-bold text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Submission Form Modal / Box */}
      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-amber-50/90 p-4 rounded-2xl border-2 border-amber-400/80 shadow-md space-y-3 animate-in slide-in-from-top duration-200"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-serif-royal font-bold text-xs text-pink-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#9D174D]" />
              Share Your Saree Look & Experience
            </h4>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-300">
              Verified Buyer Form
            </span>
          </div>

          {/* Star Rating Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Your Overall Rating:
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setNewRating(star)}
                  className="p-1 transition transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 ${
                      (hoverRating || newRating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-pink-950 ml-2">
                {newRating === 5 && '🌟 Excellent / Perfect Fit'}
                {newRating === 4 && '👍 Very Good'}
                {newRating === 3 && '👌 Good'}
                {newRating === 2 && '😐 Average'}
                {newRating === 1 && '👎 Poor'}
              </span>
            </div>
          </div>

          {/* User Name Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Your Name (Optional):</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g., Deepika R."
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 focus:border-[#9D174D] outline-none text-slate-900 bg-white shadow-inner font-medium"
            />
          </div>

          {/* Review Textarea */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Your Review / Experience:*
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other buyers about the fabric softness, gold zari shine, blouse stitching accuracy, and drape experience..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 focus:border-[#9D174D] outline-none text-slate-900 bg-white shadow-inner font-medium"
            />
          </div>

          {/* Photo Upload for Saree Look */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-pink-950 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-[#9D174D]" />
                Upload Photos of Your Saree Look (Optional):
              </span>
              <span className="text-[10px] text-amber-800 font-semibold">Max 4 photos</span>
            </label>

            {/* Hidden File Input & Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-white hover:bg-pink-50 text-[#9D174D] font-bold text-xs rounded-xl border-2 border-dashed border-[#9D174D]/50 shadow-sm transition flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4 text-[#9D174D]" />
                <span>Upload From Device</span>
              </button>

              <span className="text-[10px] text-slate-500 font-bold">OR Pick Sample Look Photo:</span>

              {LOOK_PHOTO_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleAddPresetPhoto(preset.url)}
                  className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-pink-950 font-bold text-[10px] rounded-lg border border-amber-400 transition"
                >
                  + {preset.label}
                </button>
              ))}
            </div>

            {/* Preview Grid of Attached Photos */}
            {uploadedPhotos.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {uploadedPhotos.map((photo, i) => (
                  <div key={i} className="relative w-14 h-18 rounded-xl overflow-hidden border-2 border-amber-400 shadow-sm group">
                    <img src={photo} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(i)}
                      className="absolute top-1 right-1 p-0.5 bg-pink-950/80 text-white rounded-full hover:bg-red-600 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-[#9D174D] to-amber-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'Publishing...' : 'Post Saree Review'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-100">
        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3" /> Filter:
        </span>

        <button
          onClick={() => setFilterRating('ALL')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            filterRating === 'ALL'
              ? 'bg-[#9D174D] text-amber-300 shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Reviews ({reviews.length})
        </button>

        <button
          onClick={() => setFilterRating('PHOTOS')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
            filterRating === 'PHOTOS'
              ? 'bg-[#9D174D] text-amber-300 shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>With Saree Photos ({reviews.filter((r) => r.photos && r.photos.length > 0).length})</span>
        </button>

        {[5, 4, 3].map((star) => (
          <button
            key={star}
            onClick={() => setFilterRating(star)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              filterRating === star
                ? 'bg-[#9D174D] text-amber-300 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{star} Stars</span>
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-3.5">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-6 text-slate-500 space-y-1">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No reviews found for this filter.</p>
            <p className="text-[11px]">Be the first to post a saree review!</p>
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const isLiked = !!likedReviews[rev.id];

            return (
              <div
                key={rev.id}
                className="bg-pink-50/30 p-3.5 rounded-2xl border border-amber-200/80 space-y-2 hover:border-amber-400 transition"
              >
                {/* Reviewer Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        rev.userAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={rev.userName}
                      className="w-8 h-8 rounded-full object-cover border border-amber-400 shadow-sm"
                    />
                    <div>
                      <h4 className="font-serif-royal text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{rev.userName}</span>
                        {rev.verifiedPurchase && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded flex items-center gap-0.5 border border-emerald-300">
                            <UserCheck className="w-2.5 h-2.5" /> Verified Buyer
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span>{rev.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {rev.comment}
                </p>

                {/* Photo Gallery Grid */}
                {rev.photos && rev.photos.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {rev.photos.map((photo, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => setLightboxImage(photo)}
                        className="relative w-16 h-20 rounded-xl overflow-hidden border border-amber-300 shadow-sm cursor-pointer group"
                      >
                        <img
                          src={photo}
                          alt={`Saree Look ${pIdx}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Helpful Thumbs Up Action Bar */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Was this review helpful?</span>

                  <button
                    onClick={() => toggleHelpful(rev.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
                      isLiked
                        ? 'bg-[#9D174D] text-amber-300 border-amber-400 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-pink-50'
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-amber-300' : ''}`} />
                    <span>Helpful ({rev.helpfulCount || 0})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Modal for Full View Saree Photo */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-lg max-h-[90vh] rounded-2xl overflow-hidden border-2 border-amber-400 shadow-2xl bg-black">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-white/20 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={lightboxImage} alt="Enlarged Saree Look" className="w-full h-full object-contain" />
            <div className="absolute bottom-3 left-3 right-3 bg-pink-950/80 backdrop-blur-md text-amber-200 text-xs font-bold p-2.5 rounded-xl border border-amber-400/40 text-center">
              ✨ Customer Verified Saree Look
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
