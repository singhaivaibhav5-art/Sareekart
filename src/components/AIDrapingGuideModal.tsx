import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import {
  X,
  Sparkles,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Camera,
  Layers,
  RotateCcw,
  Volume2,
  CheckCircle2,
  HelpCircle,
  Scissors,
  Download,
  Eye,
} from 'lucide-react';

interface AIDrapingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export interface DrapingStyle {
  id: string;
  name: string;
  region: string;
  idealFor: string;
  description: string;
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  estTime: string;
  steps: {
    stepNumber: number;
    title: string;
    instructions: string;
    aiProTip: string;
    targetZone: string; // e.g., 'Waistline Tuck', 'Center Pleats', 'Shoulder Pin', 'Back Wrap'
    arOverlayPath: string; // visual prompt for canvas drawing
    highlightCoord: { x: number; y: number; r: number }; // Percentage coords for AR guide ring
    vectorPath: { fromX: number; fromY: number; toX: number; toY: number }[];
  }[];
}

const DRAPING_STYLES: DrapingStyle[] = [
  {
    id: 'nivi',
    name: 'Nivi Classic Drape',
    region: 'Pan-Indian / Andhra',
    idealFor: 'Banarasi, Kanjivaram & Silk Sarees',
    description: 'The timeless 6-yard standard drape featuring neat center pleats and an elegant left-shoulder pallu sweep.',
    difficulty: 'Easy',
    estTime: '4 Mins',
    steps: [
      {
        stepNumber: 1,
        title: 'Waistline Tuck & Foundation Wrap',
        instructions: 'Tuck the plain inner end into the petticoat waistband at your navel, making 1 complete wrap around your waist from right to left.',
        aiProTip: 'Ensure uniform floor clearance (about 0.5 inches above shoes) for smooth movement.',
        targetZone: 'Navel & Waistband',
        arOverlayPath: 'waist_circle',
        highlightCoord: { x: 50, y: 72, r: 28 },
        vectorPath: [{ fromX: 20, fromY: 72, toX: 80, toY: 72 }],
      },
      {
        stepNumber: 2,
        title: 'Center Pleats Folding (5 to 7 Folds)',
        instructions: 'Gather the remaining fabric into 5–7 neat pleats, about 5 inches wide each. Hold the pleats together and tuck them neatly into your waistband facing left.',
        aiProTip: 'Use a saree safety pin to lock pleats together at the waist before tucking for zero slipping.',
        targetZone: 'Center Navel Tuck',
        arOverlayPath: 'pleat_fan',
        highlightCoord: { x: 50, y: 65, r: 22 },
        vectorPath: [
          { fromX: 42, fromY: 55, toX: 42, toY: 78 },
          { fromX: 46, fromY: 55, toX: 46, toY: 78 },
          { fromX: 50, fromY: 55, toX: 50, toY: 78 },
          { fromX: 54, fromY: 55, toX: 54, toY: 78 },
        ],
      },
      {
        stepNumber: 3,
        title: 'Upper Torso Wrap & Back Sweep',
        instructions: 'Bring the un-pleated fabric around your back from the right hip, taking it under your right arm and diagonally across your chest.',
        aiProTip: 'Keep the border crisp and taut over your hip to accentuate your silhouette.',
        targetZone: 'Right Hip to Left Bust',
        arOverlayPath: 'diagonal_wrap',
        highlightCoord: { x: 45, y: 42, r: 26 },
        vectorPath: [{ fromX: 75, fromY: 60, toX: 30, toY: 35 }],
      },
      {
        stepNumber: 4,
        title: 'Shoulder Pallu Pleating & Pinning',
        instructions: 'Fold the pallu end into neat accordion pleats. Drape over your left shoulder, letting the rich zari end fall gracefully down your back. Secure with a pin at the back shoulder seam.',
        aiProTip: 'Pin at least 2 inches behind the shoulder peak so the weight doesn’t pull the drape forward.',
        targetZone: 'Left Shoulder Pin',
        arOverlayPath: 'shoulder_pin',
        highlightCoord: { x: 34, y: 28, r: 18 },
        vectorPath: [{ fromX: 34, fromY: 28, toX: 25, toY: 55 }],
      },
    ],
  },
  {
    id: 'bengali',
    name: 'Atpoure Bengali Drape',
    region: 'West Bengal',
    idealFor: 'Tant, Baluchari & Garad Silks',
    description: 'Traditional royal Bengali style with box pleats, no front pleat tuck, and a pallu wrapped over the right shoulder with an ornate key bunch.',
    difficulty: 'Moderate',
    estTime: '6 Mins',
    steps: [
      {
        stepNumber: 1,
        title: 'Double Waist Wrap',
        instructions: 'Tuck the saree at the navel and wrap around the waist twice from right to left to create a firm, layered base.',
        aiProTip: 'Bengali drapes use wide box pleats rather than narrow center pleats.',
        targetZone: 'Waist & Hips',
        arOverlayPath: 'double_wrap',
        highlightCoord: { x: 50, y: 70, r: 30 },
        vectorPath: [{ fromX: 15, fromY: 70, toX: 85, toY: 70 }],
      },
      {
        stepNumber: 2,
        title: 'Front Box Pleating',
        instructions: 'Make broad box pleats across the front. Tuck securely so the saree falls flat and un-bunched across the tummy.',
        aiProTip: 'Iron or smooth down heavy silk borders so box pleats lay flat.',
        targetZone: 'Front Box Pleats',
        arOverlayPath: 'box_pleat',
        highlightCoord: { x: 50, y: 62, r: 24 },
        vectorPath: [
          { fromX: 38, fromY: 50, toX: 38, toY: 80 },
          { fromX: 62, fromY: 50, toX: 62, toY: 80 },
        ],
      },
      {
        stepNumber: 3,
        title: 'Left Shoulder Pallu Pleat',
        instructions: 'Gather the pallu and drape it over your left shoulder from front to back, letting it touch the ground behind.',
        aiProTip: 'Leave ample length so the pallu can swing around to the right side.',
        targetZone: 'Left Shoulder',
        arOverlayPath: 'left_pallu',
        highlightCoord: { x: 32, y: 28, r: 20 },
        vectorPath: [{ fromX: 32, fromY: 28, toX: 20, toY: 60 }],
      },
      {
        stepNumber: 4,
        title: 'Right Shoulder Pallu Wrap (Key Lock)',
        instructions: 'Take the right corner of the pallu, bring it under your right armpit, and drape over your right shoulder. Attach a traditional ornate key ring.',
        aiProTip: 'The key ring adds heirloom elegance and weighs the pallu down for stability.',
        targetZone: 'Right Shoulder Key Lock',
        arOverlayPath: 'key_lock',
        highlightCoord: { x: 68, y: 32, r: 20 },
        vectorPath: [{ fromX: 20, fromY: 60, toX: 68, toY: 32 }],
      },
    ],
  },
  {
    id: 'gujarati',
    name: 'Seedha Pallu Gujarati Drape',
    region: 'Gujarat / Rajasthan',
    idealFor: 'Chanderi, Bandhani & Heavy Zari Work',
    description: 'Highlights intricate pallu embroidery by bringing the pallu over the right shoulder to spread across the chest.',
    difficulty: 'Easy',
    estTime: '5 Mins',
    steps: [
      {
        stepNumber: 1,
        title: 'Base Wrap & Tuck',
        instructions: 'Wrap saree around waist once from right to left, tucking neatly at the navel.',
        aiProTip: 'Adjust length so heels are completely covered.',
        targetZone: 'Navel Base',
        arOverlayPath: 'waist_base',
        highlightCoord: { x: 50, y: 72, r: 25 },
        vectorPath: [{ fromX: 20, fromY: 72, toX: 80, toY: 72 }],
      },
      {
        stepNumber: 2,
        title: 'Pleat & Tuck Center',
        instructions: 'Make 6 pleats facing right (opposite of Nivi style) and tuck at the center waistband.',
        aiProTip: 'Facing pleats to the right makes the Seedha Pallu flow naturally.',
        targetZone: 'Right-facing Pleats',
        arOverlayPath: 'right_pleat',
        highlightCoord: { x: 52, y: 64, r: 22 },
        vectorPath: [{ fromX: 52, fromY: 52, toX: 52, toY: 78 }],
      },
      {
        stepNumber: 3,
        title: 'Back Wrap to Right Shoulder',
        instructions: 'Take the pallu around your back from the left side and drape it forward OVER your right shoulder.',
        aiProTip: 'Ensure the rich zari design faces forward for maximum grandeur.',
        targetZone: 'Right Shoulder Forward Sweep',
        arOverlayPath: 'right_shoulder_forward',
        highlightCoord: { x: 65, y: 28, r: 20 },
        vectorPath: [{ fromX: 30, fromY: 60, toX: 65, toY: 28 }],
      },
      {
        stepNumber: 4,
        title: 'Front Chest Fan & Left Waist Pin',
        instructions: 'Spread the pallu across your bust line like a decorative apron and pin the left corner onto your left waist belt.',
        aiProTip: 'This showcases 100% of your saree zari pallu while giving hands-free comfort.',
        targetZone: 'Left Waist Pin',
        arOverlayPath: 'chest_fan',
        highlightCoord: { x: 35, y: 60, r: 18 },
        vectorPath: [{ fromX: 65, fromY: 35, toX: 35, toY: 60 }],
      },
    ],
  },
];

export const AIDrapingGuideModal: React.FC<AIDrapingGuideModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [selectedStyleId, setSelectedStyleId] = useState<string>('nivi');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0); // 1x or 0.5x slow mo
  const [useLiveCamera, setUseLiveCamera] = useState<boolean>(false);
  const [arOpacity, setArOpacity] = useState<number>(85);
  const [showAIVoiceTips, setShowAIVoiceTips] = useState<boolean>(true);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const activeStyle = DRAPING_STYLES.find((s) => s.id === selectedStyleId) || DRAPING_STYLES[0];
  const activeStep = activeStyle.steps[currentStepIndex] || activeStyle.steps[0];

  // Animation Loop Counter
  const [animFrame, setAnimFrame] = useState<number>(0);

  // Auto-play animation interval
  useEffect(() => {
    let timer: any = null;
    if (isPlayingAnimation && isOpen) {
      const intervalMs = Math.round(150 / playbackSpeed);
      timer = setInterval(() => {
        setAnimFrame((prev) => (prev + 1) % 100);
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlayingAnimation, playbackSpeed, isOpen]);

  // Camera initialization
  useEffect(() => {
    if (useLiveCamera && isOpen) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then((stream) => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera not available for AR draping guide:', err);
          setUseLiveCamera(false);
        });
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }
    }

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [useLiveCamera, isOpen]);

  // Render Canvas AR Overlay graphics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 550;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!activeStep) return;

    // Draw AR Target Target Circle Pulsing
    const hc = activeStep.highlightCoord;
    const cx = (canvas.width * hc.x) / 100;
    const cy = (canvas.height * hc.y) / 100;
    const baseRadius = (canvas.width * hc.r) / 100;
    const pulseFactor = Math.sin((animFrame * Math.PI) / 25) * 6;
    const currentR = Math.max(10, baseRadius + pulseFactor);

    // Outer Glowing Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, currentR, 0, 2 * Math.PI);
    ctx.strokeStyle = '#F59E0B'; // Amber Gold
    ctx.lineWidth = 3;
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 12;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -animFrame;
    ctx.stroke();
    ctx.restore();

    // Radial Fill Pulse
    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, currentR);
    grad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
    grad.addColorStop(0.7, 'rgba(157, 23, 77, 0.2)');
    grad.addColorStop(1, 'rgba(157, 23, 77, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, currentR, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Target Pin Crosshair Label
    ctx.save();
    ctx.fillStyle = '#9D174D';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Target Step Label Box
    ctx.fillStyle = '#9D174D';
    const labelText = `STEP ${activeStep.stepNumber}: ${activeStep.targetZone}`;
    ctx.font = 'bold 11px sans-serif';
    const txtWidth = ctx.measureText(labelText).width;
    ctx.roundRect(cx - txtWidth / 2 - 8, cy - currentR - 22, txtWidth + 16, 20, 10);
    ctx.fill();

    ctx.fillStyle = '#FDE68A';
    ctx.fillText(labelText, cx - txtWidth / 2, cy - currentR - 8);
    ctx.restore();

    // Animated Vectors / Motion Arrows
    activeStep.vectorPath.forEach((vec) => {
      const fx = (canvas.width * vec.fromX) / 100;
      const fy = (canvas.height * vec.fromY) / 100;
      const tx = (canvas.width * vec.toX) / 100;
      const ty = (canvas.height * vec.toY) / 100;

      // Calculate animated interpolated position (0.0 to 1.0)
      const progress = (animFrame % 50) / 50;
      const currX = fx + (tx - fx) * progress;
      const currY = fy + (ty - fy) * progress;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = '#EC4899'; // Pink
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.stroke();

      // Moving Arrow Head
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(currX, currY, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });
  }, [activeStep, animFrame]);

  if (!isOpen || !product) return null;

  const sampleModelImg =
    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFBF7] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/50 my-auto flex flex-col relative max-h-[92vh]">
        {/* Top Bar Header */}
        <div className="p-4 bg-gradient-to-r from-[#9D174D] via-[#831843] to-amber-700 text-white flex items-center justify-between border-b border-amber-400/40 shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-pink-950 font-bold shadow">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h2 className="font-serif-royal text-base font-bold text-white leading-tight flex items-center gap-1.5">
                AI Saree Draping Guide ✨
              </h2>
              <p className="text-[10px] text-amber-200">
                AR Step-by-Step Drape Projection for {product.name}
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

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-5 space-y-4">
          {/* Style Selector Pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-pink-950 uppercase tracking-wider block">
              Select Draping Style for {product.fabric}:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {DRAPING_STYLES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setSelectedStyleId(st.id);
                    setCurrentStepIndex(0);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border flex items-center gap-1.5 ${
                    selectedStyleId === st.id
                      ? 'bg-[#9D174D] text-amber-300 border-amber-400 shadow'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-pink-50'
                  }`}
                >
                  <span>{st.name}</span>
                  <span className="text-[9px] bg-amber-400/20 px-1.5 py-0.5 rounded-full text-amber-800">
                    {st.estTime}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AR Display Viewport (Camera or Avatar Model with Live Canvas Overlay) */}
          <div className="relative aspect-[3/4] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-400/40 shadow-inner group">
            {/* Background Stream or Model */}
            {useLiveCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <img
                src={sampleModelImg}
                alt="Model Avatar"
                className="w-full h-full object-cover"
              />
            )}

            {/* Saree Fabric Image Preview Layer */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{ opacity: arOpacity / 100 }}
            >
              <img
                src={product.images[0]}
                alt="Saree Texture"
                className="w-full h-full object-cover mix-blend-overlay opacity-50"
              />
            </div>

            {/* Canvas overlay for pulsing AR guidelines */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* Live Camera Toggle & Controls Bar inside Canvas */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-auto">
              <span className="bg-pink-950/80 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-400/30">
                🎯 {activeStyle.name} • Step {activeStep.stepNumber} of {activeStyle.steps.length}
              </span>

              <button
                onClick={() => setUseLiveCamera(!useLiveCamera)}
                className="bg-amber-400 text-pink-950 font-extrabold text-[11px] px-3 py-1 rounded-full shadow hover:bg-amber-300 transition flex items-center gap-1 border border-amber-200"
              >
                <Camera className="w-3.5 h-3.5 text-pink-950" />
                <span>{useLiveCamera ? 'Switch to Model' : 'AR Mirror Camera'}</span>
              </button>
            </div>

            {/* Animation Playback Controls Overlay Bar (Bottom of Canvas) */}
            <div className="absolute bottom-3 left-3 right-3 z-20 bg-pink-950/85 backdrop-blur-md p-2.5 rounded-xl border border-amber-400/40 text-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
                  className="p-1.5 rounded-full bg-amber-400 text-pink-950 hover:bg-amber-300 transition"
                >
                  {isPlayingAnimation ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <span className="font-bold text-[11px] text-amber-200">
                  {isPlayingAnimation ? 'AR Guide Animating...' : 'Paused'}
                </span>
              </div>

              {/* Speed Switcher */}
              <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-amber-400/20 text-[10px] font-bold">
                <span className="text-slate-400">Speed:</span>
                <button
                  onClick={() => setPlaybackSpeed(1.0)}
                  className={`px-1.5 py-0.5 rounded ${playbackSpeed === 1.0 ? 'bg-amber-400 text-pink-950' : 'text-slate-300'}`}
                >
                  1.0x
                </button>
                <button
                  onClick={() => setPlaybackSpeed(0.5)}
                  className={`px-1.5 py-0.5 rounded ${playbackSpeed === 0.5 ? 'bg-amber-400 text-pink-950' : 'text-slate-300'}`}
                >
                  0.5x Slow
                </button>
              </div>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-300/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <button
                disabled={currentStepIndex === 0}
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Step
              </button>

              <div className="flex items-center gap-1">
                {activeStyle.steps.map((st, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition ${
                      currentStepIndex === idx ? 'bg-[#9D174D] w-6' : 'bg-slate-200 hover:bg-amber-300'
                    }`}
                  />
                ))}
              </div>

              <button
                disabled={currentStepIndex === activeStyle.steps.length - 1}
                onClick={() => setCurrentStepIndex((prev) => Math.min(activeStyle.steps.length - 1, prev + 1))}
                className="px-3 py-1.5 bg-[#9D174D] text-amber-300 rounded-xl text-xs font-bold transition disabled:opacity-40 flex items-center gap-1 shadow"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Current Active Step Instructions Box */}
            <div className="bg-pink-50/60 p-3 rounded-xl border border-pink-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="bg-[#9D174D] text-amber-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                  STEP {activeStep.stepNumber} OF {activeStyle.steps.length}
                </span>
                <span className="text-[11px] font-bold text-pink-900 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-amber-600" /> Focus Zone: {activeStep.targetZone}
                </span>
              </div>

              <h4 className="font-serif-royal font-bold text-sm text-slate-900">
                {activeStep.title}
              </h4>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {activeStep.instructions}
              </p>

              {/* AI Master Draper Pro-Tip */}
              {showAIVoiceTips && (
                <div className="bg-amber-100/80 p-2.5 rounded-lg border border-amber-300/80 flex items-start gap-2 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 block text-[11px]">
                      AI Draper Fabric Pro-Tip ({product.fabric}):
                    </span>
                    <p className="text-amber-950 text-[11px]">{activeStep.aiProTip}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-3 bg-white border-t border-amber-200 flex items-center justify-between gap-2">
          <button
            onClick={() => setCurrentStepIndex(0)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" /> Reset Draping
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#9D174D] via-[#831843] to-amber-700 text-white font-extrabold text-xs rounded-xl shadow hover:brightness-110 transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
            <span>Finished Learning Drape</span>
          </button>
        </div>
      </div>
    </div>
  );
};
