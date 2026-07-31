import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { BRAND_NAME } from '../constants';
import { X, Camera, RefreshCw, Sparkles, Check, Sliders, Layers, Download } from 'lucide-react';

interface ARTryOnModalProps {
  product: Product | null;
  onClose: () => void;
}

const MODEL_AVATARS = [
  {
    id: 'm1',
    name: 'Mannequin Avatar',
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm2',
    name: 'Model Priya (Fair)',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm3',
    name: 'Model Ananya (Wheatish)',
    img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  },
];

export const ARTryOnModal: React.FC<ARTryOnModalProps> = ({ product, onClose }) => {
  const [useCamera, setUseCamera] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODEL_AVATARS[0].id);
  const [pleatY, setPleatY] = useState(50); // Vertical offset %
  const [palluX, setPalluX] = useState(50); // Horizontal offset %
  const [drapeScale, setDrapeScale] = useState(100);
  const [drapeOpacity, setDrapeOpacity] = useState(85);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (useCamera) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then((stream) => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera access denied or unavailable', err);
          setUseCamera(false);
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
  }, [useCamera]);

  if (!product) return null;

  const takeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 550;

    // Draw background model or camera frame
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';

    const currentModelObj = MODEL_AVATARS.find((m) => m.id === selectedModel);
    baseImg.src = currentModelObj ? currentModelObj.img : MODEL_AVATARS[0].img;

    baseImg.onload = () => {
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      // Overlay saree drape image with opacity
      const sareeImg = new Image();
      sareeImg.crossOrigin = 'anonymous';
      sareeImg.src = product.images[0];

      sareeImg.onload = () => {
        ctx.globalAlpha = drapeOpacity / 100;
        const scaleVal = drapeScale / 100;
        const w = canvas.width * scaleVal;
        const h = canvas.height * scaleVal;
        const x = (canvas.width * (palluX - 50)) / 100;
        const y = (canvas.height * (pleatY - 50)) / 100 + 40;

        ctx.drawImage(sareeImg, x, y, w, h);

        // Watermark badge
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#9D174D';
        ctx.fillRect(10, canvas.height - 40, 180, 30);
        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${BRAND_NAME} AR Try-On ✨`, 20, canvas.height - 20);

        const dataUrl = canvas.toDataURL('image/png');
        setSavedSnapshot(dataUrl);
      };
    };
  };

  const activeModelObj = MODEL_AVATARS.find((m) => m.id === selectedModel);

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFBF7] w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/50 my-auto flex flex-col relative max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 bg-gradient-to-r from-[#9D174D] to-[#831843] text-white flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            <div>
              <h2 className="font-serif-royal text-base font-bold text-white leading-tight">
                AR Virtual Saree Try-On
              </h2>
              <p className="text-[11px] text-amber-200">
                Live Drape Preview on Model or Camera
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

        {/* Canvas / Video Frame */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-400/40 shadow-inner flex items-center justify-center">
            {useCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <img
                src={activeModelObj?.img}
                alt="Model"
                className="w-full h-full object-cover"
              />
            )}

            {/* AR Drape Layer Overlay */}
            <div
              className="absolute pointer-events-none transition-all duration-150"
              style={{
                left: `${palluX - 50}%`,
                top: `${pleatY - 50}%`,
                transform: `scale(${drapeScale / 100})`,
                opacity: drapeOpacity / 100,
                width: '100%',
                height: '100%',
              }}
            >
              <img
                src={product.images[0]}
                alt="Saree Drape"
                className="w-full h-full object-contain filter drop-shadow-2xl mix-blend-multiply"
              />
            </div>

            {/* Hidden canvas for taking snapshot */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Saree Badge */}
            <div className="absolute top-3 left-3 bg-pink-950/80 backdrop-blur text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/40">
              {product.name}
            </div>
          </div>

          {/* Model Selection & Mode Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-pink-950">
              <span className="flex items-center gap-1">
                <Layers className="w-4 h-4 text-amber-600" /> Choose Model Avatar or Camera
              </span>

              <button
                onClick={() => setUseCamera(!useCamera)}
                className="px-3 py-1 bg-amber-500 text-pink-950 font-extrabold rounded-full text-[11px] shadow hover:bg-amber-400 transition flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5 text-pink-950" />
                <span>{useCamera ? 'Switch to Avatar Model' : 'Use Live Camera'}</span>
              </button>
            </div>

            {!useCamera && (
              <div className="flex items-center gap-2">
                {MODEL_AVATARS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`flex-1 p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                      selectedModel === m.id
                        ? 'bg-[#9D174D] text-white border-amber-400 shadow'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-pink-50'
                    }`}
                  >
                    <img src={m.img} alt={m.name} className="w-6 h-6 rounded-full object-cover" />
                    <span className="truncate">{m.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Drape Adjuster Sliders */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-300/60 shadow-sm space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-pink-950">
              <Sliders className="w-4 h-4 text-amber-600" /> Fine-Tune Saree Pleat & Pallu Drape
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Pleat Vertical Height ({pleatY}%)
                </label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={pleatY}
                  onChange={(e) => setPleatY(Number(e.target.value))}
                  className="w-full accent-[#9D174D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Pallu Shoulder Drape ({palluX}%)
                </label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={palluX}
                  onChange={(e) => setPalluX(Number(e.target.value))}
                  className="w-full accent-[#9D174D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Drape Opacity ({drapeOpacity}%)
                </label>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={drapeOpacity}
                  onChange={(e) => setDrapeOpacity(Number(e.target.value))}
                  className="w-full accent-[#9D174D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Pattern Scale ({drapeScale}%)
                </label>
                <input
                  type="range"
                  min="70"
                  max="130"
                  value={drapeScale}
                  onChange={(e) => setDrapeScale(Number(e.target.value))}
                  className="w-full accent-[#9D174D]"
                />
              </div>
            </div>
          </div>

          {/* Save Snapshot Preview */}
          {savedSnapshot && (
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-300 space-y-2 text-center">
              <p className="text-xs font-bold text-pink-950">✨ AR Try-On Snapshot Saved!</p>
              <img src={savedSnapshot} alt="Snapshot" className="w-32 h-44 object-cover mx-auto rounded-xl shadow" />
              <a
                href={savedSnapshot}
                download="sareekart_ar_tryon.png"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#9D174D] underline"
              >
                <Download className="w-3.5 h-3.5" /> Download Photo
              </a>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 bg-white border-t border-amber-200 flex items-center justify-between gap-2">
          <button
            onClick={takeSnapshot}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-pink-950 font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
          >
            <Camera className="w-4 h-4 text-pink-950" />
            <span>Take Trial Snapshot</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#9D174D] text-white font-bold text-xs rounded-xl hover:bg-[#831843] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
