import React, { useState } from 'react';
import { Product } from '../types';
import {
  X,
  Sparkles,
  Droplets,
  Sun,
  Shirt,
  Archive,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Send,
  Feather,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface SareeCareTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

type FabricType = 'silk' | 'cotton' | 'chiffon' | 'georgette' | 'organza' | 'linen';

interface CareGuide {
  title: string;
  badge: string;
  washing: string[];
  drying: string[];
  ironing: string[];
  storage: string[];
  dos: string[];
  donts: string[];
  proTip: string;
}

const FABRIC_CARE_DATA: Record<FabricType, CareGuide> = {
  silk: {
    title: 'Pure Silk Sarees (Banarasi, Kanjivaram, Tussar)',
    badge: '👑 Royal Silk Care',
    washing: [
      'Strictly Dry Clean only for the first 3-4 washes to preserve pure zari luster.',
      'If hand-washing after several uses, use lukewarm water with liquid protein detergent (Ezee/Genteel).',
      'Never wring, twist, or scrub silk fabric heavily.',
      'Do not use harsh bleach, stain removers, or fabric softeners.',
    ],
    drying: [
      'Dry in a shade-ventilated indoor space. Never expose directly to strong harsh sunlight.',
      'Spread flat over a clean dry towel to absorb excess water before hanging.',
    ],
    ironing: [
      'Use low-to-medium heat (Silk setting). Always iron on the reverse side of the saree.',
      'Place a thin cotton press-cloth between the iron and delicate silver/gold Zari work.',
      'Avoid spraying water directly while ironing as it can leave water spots.',
    ],
    storage: [
      'Wrap saree in a breathable white muslin or unbleached cotton cloth bag.',
      'Refold the saree every 3 months along different fold lines to prevent permanent creases and fiber breakage.',
      'Place natural dried neem leaves or cloves near storage (avoid direct contact with mothballs/naphthelene balls on zari).',
      'Store flat in dark, dry wooden wardrobes; avoid hanging heavy silks on plastic/wire hangers.',
    ],
    dos: [
      'Air out the saree in shade for 2 hours after wearing before storing back.',
      'Wrap Zari borders in butter paper to prevent tarnishing.',
    ],
    donts: [
      'Never spray perfumes, deos, or hairsprays directly onto silk or zari.',
      'Never store in sealed plastic bags for prolonged periods (traps humidity).',
    ],
    proTip: 'AI Pro Tip: If gold Zari starts losing shine over years, gently rub with dry soft flannel cloth to revive metallic gleam without liquid chemical polish.',
  },
  cotton: {
    title: 'Pure Cotton Sarees (Mulmul, Chanderi Cotton, Tant, Jamdani)',
    badge: '🌿 Natural Fiber Care',
    washing: [
      'Hand wash separately in cold water with mild liquid soap.',
      'Soak in rock salt water for 10-15 minutes prior to first wash to fix vibrant natural dyes.',
      'Starch gently after wash if crisp stiffness (Kanjivaram style drape) is desired.',
    ],
    drying: [
      'Line dry in shade to prevent color fading.',
      'Dry inside-out so outer colors stay vibrant.',
    ],
    ironing: [
      'Iron while slightly damp for crisp, wrinkle-free pleats.',
      'Use high cotton heat setting with steam for best results.',
    ],
    storage: [
      'Store in a cool, dry cotton bag.',
      'Ensure completely dry before folding to prevent mildew or fungal spots during monsoons.',
    ],
    dos: [
      'Starch regularly for classic crisp borders.',
      'Wash light and dark cotton sarees separately.',
    ],
    donts: [
      'Do not leave soaked in soapy water for more than 20 minutes.',
      'Avoid high-speed washing machine spin cycles.',
    ],
    proTip: 'AI Pro Tip: Adding 1 tablespoon of white vinegar to the final rinse water seals cotton color molecules and keeps whites crisp and bright!',
  },
  chiffon: {
    title: 'Chiffon & Delicate Sheer Sarees',
    badge: '✨ Ultra-Light Fabric',
    washing: [
      'Gentle hand wash in cold water using ultra-mild silk/delicate detergent.',
      'Do not soak for more than 5 minutes.',
      'Avoid machine wash as high agitation tears delicate weave.',
    ],
    drying: [
      'Roll gently in a thick towel to squeeze excess moisture.',
      'Drape horizontally over a padded drying rack in shade.',
    ],
    ironing: [
      'Use cool iron (Lowest Synthetic/Nylon setting) without steam.',
      'Place a thin cloth sheet over embellishments while pressing.',
    ],
    storage: [
      'Hang on padded, velvet-coated hangers rather than tight folding to avoid deep stretch marks.',
      'Store away from sharp jewelry or zippers that could snag the sheer mesh.',
    ],
    dos: [
      'Wear smooth seamless undergarments to prevent fabric snagging.',
      'Use safety pins with plastic beads or pin protectors.',
    ],
    donts: [
      'Never wring or squeeze chiffon tightly.',
      'Do not use steam iron directly on chiffon sequins or foil prints.',
    ],
    proTip: 'AI Pro Tip: If chiffon gets static cling, lightly mist distilled water or wipe the inner lining with a dryer sheet before draping!',
  },
  georgette: {
    title: 'Pure & Poly Georgette Sarees',
    badge: '💃 Durable Flowy Care',
    washing: [
      'Dry clean recommended for heavy embroidered georgette.',
      'For plain poly-georgette, hand wash in cold water with mild shampoo.',
    ],
    drying: [
      'Hang to air dry in shade; georgette dries rapidly.',
      'Avoid clothespins on heavy borders to avoid pinch marks.',
    ],
    ironing: [
      'Use medium heat with press cloth over embroidery.',
      'Steam iron works wonderfully for removing pleat wrinkles on georgette.',
    ],
    storage: [
      'Fold gently with tissue paper inside folds if saree has heavy threadwork or stone embellishments.',
      'Store in cotton saree bags.',
    ],
    dos: [
      'Air out thoroughly after wedding events.',
      'Check borders periodically for loose threads.',
    ],
    donts: [
      'Avoid hot water washing which shrinks georgette crinkles.',
      'Do not pin saree with unshielded safety pins.',
    ],
    proTip: 'AI Pro Tip: Georgette sarees bounce back to original drape after steaming — use a handheld garment steamer 4 inches away from fabric for quick prep!',
  },
  organza: {
    title: 'Organza & Net Designer Sarees',
    badge: '🌸 Sheer & Crisp Arch',
    washing: [
      'Dry clean ONLY. Organza loses its structural stiffness and shine if immersed in water.',
      'Spot clean small spills with a damp micro-fiber cloth immediately.',
    ],
    drying: [
      'If spot-cleaned, lay flat under a quiet ceiling fan.',
    ],
    ironing: [
      'Iron on lowest heat setting with cotton press cloth.',
      'Do not apply direct heat to printed or foil organza.',
    ],
    storage: [
      'Store hanging upright in full-length cotton garment covers to preserve flare.',
      'Do not place heavy boxes on top of organza sarees in wardrobes.',
    ],
    dos: [
      'Store in broad padded hangers.',
      'Handle with clean, dry hands.',
    ],
    donts: [
      'Do not fold tightly or crush in cramped drawers.',
      'Never wash organza in washing machine.',
    ],
    proTip: 'AI Pro Tip: To preserve organza’s voluminous regal flare, never roll or compress it under heavy winter wear in your closet!',
  },
  linen: {
    title: 'Pure Linen & Linen-Blend Sarees',
    badge: '🍃 Rustic Luxury',
    washing: [
      'Hand wash or gentle machine wash on delicate cold cycle.',
      'Use mild liquid detergent; avoid bleach or harsh enzymatic powders.',
    ],
    drying: [
      'Air dry flat or hang on broad hanger in shade.',
      'Drying in shade retains linen’s natural textured feel.',
    ],
    ironing: [
      'Iron while linen is distinctly damp with high heat and steam to smooth out natural slubs effortlessly.',
    ],
    storage: [
      'Can be folded or hung in cotton bags.',
      'Linen becomes softer and more luxurious with every wash!',
    ],
    dos: [
      'Embrace linen’s natural organic texture and subtle folds.',
    ],
    donts: [
      'Do not over-dry in machine dryer.',
    ],
    proTip: 'AI Pro Tip: Linen gets naturally softer after every single wash! Spritz mild rosewater while ironing for a soothing aromatic drape.',
  },
};

const SAMPLE_AI_QA = [
  {
    q: 'How to remove a turmeric/curry stain from Banarasi Silk?',
    a: 'Dab (do not rub) immediately with dry cornstarch or talcum powder to absorb oil. Then sprinkle a drop of cold water and white vinegar on a cotton ball, lightly tap the back of the stain, and take to dry cleaner within 24 hours.',
  },
  {
    q: 'Why does Zari work turn dark or black over time?',
    a: 'Real silver/gold Zari reacts with atmospheric sulfur, humidity, and direct perfume sprays. Always wrap Zari sarees in white muslin cloth with butter paper lining and store away from perfume bottles.',
  },
  {
    q: 'Can I wash a Kanjivaram silk saree at home?',
    a: 'For the first 3-4 wears, dry clean is mandatory. For older sarees, use cold water with mild shampoo or Ezee, do not soak over 3 minutes, and dry flat in shade. Never wring!',
  },
];

export const SareeCareTipsModal: React.FC<SareeCareTipsModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  // Determine initial fabric tab
  const getInitialFabric = (): FabricType => {
    if (!product || !product.fabric) return 'silk';
    const lower = product.fabric.toLowerCase();
    if (lower.includes('silk') || lower.includes('banarasi') || lower.includes('kanjivaram') || lower.includes('tussar')) return 'silk';
    if (lower.includes('cotton') || lower.includes('mulmul') || lower.includes('jamdani')) return 'cotton';
    if (lower.includes('chiffon')) return 'chiffon';
    if (lower.includes('georgette')) return 'georgette';
    if (lower.includes('organza')) return 'organza';
    if (lower.includes('linen')) return 'linen';
    return 'silk';
  };

  const [selectedFabric, setSelectedFabric] = useState<FabricType>(getInitialFabric());
  const [activeTab, setActiveTab] = useState<'guide' | 'aiAssistant'>('guide');

  // AI Assistant Query State
  const [userQuery, setUserQuery] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Array<{ q: string; a: string }>>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  if (!isOpen) return null;

  const currentCare = FABRIC_CARE_DATA[selectedFabric];

  const handleAskAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const query = userQuery.trim();
    setUserQuery('');
    setIsAiThinking(true);

    setTimeout(() => {
      let answer = `For ${currentCare.title}: Always handle delicate weaves with care. Dampen stains with cold water and mild protein liquid, avoid direct sunlight, and wrap in muslin.`;

      const qLower = query.toLowerCase();
      if (qLower.includes('stain') || qLower.includes('curry') || qLower.includes('oil')) {
        answer = `To treat stains on ${selectedFabric} saree: Apply talcum powder/cornstarch immediately to absorb grease. Do NOT rub! Dab gently with cold water and white vinegar solution from the reverse side.`;
      } else if (qLower.includes('perfume') || qLower.includes('spray')) {
        answer = `Never spray perfumes or hairsprays directly on ${selectedFabric} or Zari. Perfume chemicals cause permanent discoloration and tarnishing. Spray perfume on skin before draping!`;
      } else if (qLower.includes('iron') || qLower.includes('wrinkle') || qLower.includes('press')) {
        answer = `Ironing tip for ${selectedFabric}: Use press-cloth (thin cotton towel) between iron and saree. For ${selectedFabric}, iron on reverse side on low-to-medium heat setting.`;
      } else if (qLower.includes('storage') || qLower.includes('fungus') || qLower.includes('moth')) {
        answer = `Best storage for ${selectedFabric}: Wrap in unbleached white cotton or muslin bag. Place dried neem leaves nearby. Avoid mothballs touching metal zari directly, and refold every 3 months!`;
      }

      setCustomAnswers((prev) => [{ q: query, a: answer }, ...prev]);
      setIsAiThinking(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FDFBF7] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col border border-amber-300/80 overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-pink-950 via-[#9D174D] to-amber-900 text-white p-4 flex items-center justify-between border-b border-amber-400/40 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-pink-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <Sparkles className="w-5 h-5 text-pink-950" />
            </div>
            <div>
              <h2 className="font-serif-royal text-lg font-bold text-amber-200 leading-tight flex items-center gap-1.5">
                AI Saree Care & Longevity Masterclass
              </h2>
              <p className="text-xs text-slate-200">
                Fabric-specific maintenance, stain removal & storage techniques
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs (Guide vs AI Care Assistant) */}
        <div className="bg-amber-100/60 p-2 border-b border-amber-300/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-amber-300/60 shadow-inner">
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'bg-[#9D174D] text-white shadow'
                  : 'text-slate-700 hover:text-pink-950'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Fabric Care Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('aiAssistant')}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                activeTab === 'aiAssistant'
                  ? 'bg-[#9D174D] text-white shadow'
                  : 'text-slate-700 hover:text-pink-950'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ask AI Care Doctor</span>
            </button>
          </div>

          {product && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-pink-950 bg-amber-200/80 px-3 py-1 rounded-full border border-amber-400">
              <Feather className="w-3.5 h-3.5 text-[#9D174D]" />
              <span>Viewing: {product.fabric}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'guide' ? (
            <>
              {/* Fabric Type Selector Tabs */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Select Fabric Type:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FABRIC_CARE_DATA) as FabricType[]).map((fab) => {
                    const isSelected = selectedFabric === fab;
                    return (
                      <button
                        key={fab}
                        onClick={() => setSelectedFabric(fab)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition border flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#9D174D] text-amber-200 border-amber-400 shadow-md scale-105'
                            : 'bg-white text-slate-700 border-amber-200 hover:border-amber-400'
                        }`}
                      >
                        {fab === 'silk' && '👑 '}
                        {fab === 'cotton' && '🌿 '}
                        {fab === 'chiffon' && '✨ '}
                        {fab === 'georgette' && '💃 '}
                        {fab === 'organza' && '🌸 '}
                        {fab === 'linen' && '🍃 '}
                        <span>{fab}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Fabric Title Banner */}
              <div className="bg-gradient-to-r from-amber-500/20 via-pink-100 to-amber-100 p-3.5 rounded-2xl border border-amber-300 flex items-center justify-between">
                <div>
                  <h3 className="font-serif-royal font-bold text-sm text-pink-950">
                    {currentCare.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 font-medium pt-0.5">
                    Curated maintenance instructions for heirloom durability & color preservation.
                  </p>
                </div>
                <span className="bg-[#9D174D] text-amber-300 text-[10px] font-extrabold px-3 py-1 rounded-full shadow border border-amber-400 shrink-0">
                  {currentCare.badge}
                </span>
              </div>

              {/* 4 Pillars of Care Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Washing */}
                <div className="bg-white p-3.5 rounded-2xl border border-sky-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-sky-900 font-serif-royal font-bold text-xs border-b border-sky-100 pb-1.5">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    <span>1. Washing & Cleaning</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {currentCare.washing.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-sky-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Drying & Sun Exposure */}
                <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-serif-royal font-bold text-xs border-b border-amber-100 pb-1.5">
                    <Sun className="w-4 h-4 text-amber-600" />
                    <span>2. Drying & Sunlight</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {currentCare.drying.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Ironing & Pressing */}
                <div className="bg-white p-3.5 rounded-2xl border border-purple-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-purple-900 font-serif-royal font-bold text-xs border-b border-purple-100 pb-1.5">
                    <Shirt className="w-4 h-4 text-purple-600" />
                    <span>3. Ironing & Pressing</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {currentCare.ironing.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-purple-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Storage & Folding */}
                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-serif-royal font-bold text-xs border-b border-emerald-100 pb-1.5">
                    <Archive className="w-4 h-4 text-emerald-600" />
                    <span>4. Storage & Muslin Wrapping</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {currentCare.storage.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Do's & Don'ts Quick Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-300 space-y-1.5">
                  <h4 className="font-serif-royal font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ALWAYS DO:</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-emerald-950">
                    {currentCare.dos.map((doItem, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span>✓</span> <span>{doItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-50/80 p-3.5 rounded-2xl border border-red-300 space-y-1.5">
                  <h4 className="font-serif-royal font-bold text-xs text-red-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>NEVER DO:</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-red-950">
                    {currentCare.donts.map((dontItem, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span>✕</span> <span>{dontItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI Pro Tip Box */}
              <div className="bg-gradient-to-r from-[#9D174D] to-[#831843] text-white p-4 rounded-2xl border border-amber-400 shadow flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-pink-950 flex items-center justify-center font-extrabold shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-serif-royal font-bold text-xs text-amber-300">
                    AI Textile Specialist Secret
                  </h4>
                  <p className="text-xs text-amber-100 leading-relaxed font-medium">
                    {currentCare.proTip}
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* AI Care Assistant Tab */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-100 via-pink-50 to-amber-50 p-4 rounded-2xl border border-amber-300 space-y-3">
                <div className="flex items-center gap-2 text-pink-950 font-serif-royal font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-[#9D174D]" />
                  <span>Ask AI Textile Doctor Any Care Question</span>
                </div>
                <p className="text-xs text-slate-700">
                  Have a specific stain (oil, tea, curry), storage query, or ironing doubt for your saree? Ask our instant AI assistant!
                </p>

                <form onSubmit={handleAskAi} className="flex gap-2">
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="e.g. How to clean turmeric stain from Organza?"
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-amber-300 focus:border-[#9D174D] outline-none text-slate-900 bg-white shadow-inner font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isAiThinking}
                    className="px-4 py-2.5 bg-[#9D174D] hover:bg-[#831843] text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isAiThinking ? 'Analyzing...' : 'Ask AI'}</span>
                  </button>
                </form>
              </div>

              {/* Custom AI Answers */}
              {customAnswers.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="font-serif-royal font-bold text-xs text-pink-950 uppercase tracking-wide">
                    Your AI Answers:
                  </h4>
                  {customAnswers.map((item, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-2xl border border-amber-300 shadow-sm space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <HelpCircle className="w-3.5 h-3.5 text-[#9D174D]" />
                        <span>Q: {item.q}</span>
                      </div>
                      <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs text-pink-950 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-medium">{item.a}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Frequently Asked AI Care Answers */}
              <div className="space-y-2.5">
                <h4 className="font-serif-royal font-bold text-xs text-pink-950 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Popular AI Care Guide Answers</span>
                </h4>

                {SAMPLE_AI_QA.map((qa, index) => (
                  <div key={index} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
                    <h5 className="font-serif-royal text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#9D174D]" />
                      <span>{qa.q}</span>
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 font-medium">
                      {qa.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-amber-300/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>AI Verified Textile Care Standards</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#9D174D] hover:bg-[#831843] text-white font-bold text-xs rounded-xl shadow transition"
          >
            Got It, Thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
