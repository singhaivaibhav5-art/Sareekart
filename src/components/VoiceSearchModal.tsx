import React, { useState, useEffect } from 'react';
import { BRAND_NAME } from '../constants';
import { X, Mic, Sparkles, Volume2 } from 'lucide-react';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQuery: (query: string) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onApplyQuery,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      setIsListening(false);
    }
  }, [isOpen]);

  const startListening = () => {
    setIsListening(true);
    setTranscript('');

    // Try Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const resultText = event.results[current][0].transcript;
          setTranscript(resultText);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition error', err);
      }
    }

    // Fallback simulation if Speech API unavailable in frame
    setTimeout(() => {
      setTranscript('Banarasi Silk Saree for Wedding');
      setIsListening(false);
    }, 2500);
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (transcript) {
      onApplyQuery(transcript);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 border-amber-500/50 text-center space-y-5 animate-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <h3 className="font-serif-royal text-lg font-bold text-pink-950">
            Voice Search {BRAND_NAME}
          </h3>
          <p className="text-xs text-slate-500">
            Say your desired fabric, color, or occasion (e.g. "Pink Kanjivaram Saree")
          </p>
        </div>

        {/* Animated Listening Mic */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
          )}
          <button
            onClick={startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${
              isListening ? 'bg-[#9D174D] text-amber-300 scale-105' : 'bg-amber-500 text-pink-950 hover:bg-amber-400'
            }`}
          >
            <Mic className="w-9 h-9" />
          </button>
        </div>

        {/* Transcript Box */}
        <div className="bg-white p-3 rounded-2xl border border-amber-200 min-h-[60px] flex items-center justify-center text-xs font-semibold text-slate-800">
          {isListening ? (
            <span className="text-amber-700 animate-pulse flex items-center gap-1">
              <Volume2 className="w-4 h-4" /> Listening to your voice...
            </span>
          ) : transcript ? (
            <span className="text-[#9D174D] text-sm font-bold">"{transcript}"</span>
          ) : (
            <span className="text-slate-400">Tap mic and speak now</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={startListening}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Retry
          </button>
          <button
            onClick={handleConfirm}
            disabled={!transcript}
            className="flex-1 py-2.5 bg-[#9D174D] hover:bg-[#831843] text-amber-300 font-extrabold text-xs rounded-xl shadow transition disabled:opacity-40"
          >
            Search Sarees
          </button>
        </div>
      </div>
    </div>
  );
};
