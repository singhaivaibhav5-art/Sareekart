import React, { useState } from 'react';
import { Product } from '../types';
import { BRAND_NAME } from '../constants';
import { X, Sparkles, Send, Mic, Bot, User, ShoppingBag } from 'lucide-react';

interface AIChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  openVoiceSearch: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  recommendedProducts?: Product[];
}

const OCCASION_TAGS = [
  'Bridal Wedding Saree',
  'Haldi & Mehendi Yellow',
  'Reception Cocktail Party',
  'Puja & Festive Function',
  'Office & Corporate Wear',
  'Farewell Party Saree',
];

export const AIChatbotDrawer: React.FC<AIChatbotDrawerProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  openVoiceSearch,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Namaste! 🙏 I am your ${BRAND_NAME} AI Personal Stylist. Tell me about your occasion, fabric preference, skin tone, or budget, and I will handpick the perfect saree for you!`,
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const sendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/stylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      const data = await res.json();
      
      let recProds: Product[] = [];
      if (data.recommendedProductIds && Array.isArray(data.recommendedProductIds)) {
        recProds = products.filter((p) => data.recommendedProductIds.includes(p.id));
      }

      if (recProds.length === 0) {
        recProds = products.slice(0, 2);
      }

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Namaste! I recommend looking at our Banarasi and Kanjivaram collection below.',
        recommendedProducts: recProds,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: 'Namaste! I recommend exploring our Bestseller Banarasi Katan Silk Saree for timeless elegance.',
          recommendedProducts: products.slice(0, 2),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/70 backdrop-blur-sm flex justify-end">
      <div className="bg-[#FDFBF7] w-full max-w-md h-full shadow-2xl flex flex-col border-l border-amber-500/40 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#9D174D] via-[#831843] to-amber-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-400 p-0.5 flex items-center justify-center">
              <Bot className="w-5 h-5 text-pink-950" />
            </div>
            <div>
              <h2 className="font-serif-royal text-base font-bold text-white leading-tight flex items-center gap-1">
                {BRAND_NAME} AI Stylist <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </h2>
              <p className="text-[10px] text-amber-200">Powered by Gemini AI Fashion Intelligence</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user' ? 'bg-[#9D174D] text-white' : 'bg-amber-400 text-pink-950 font-bold'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm shadow-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#9D174D] text-white rounded-tr-none font-medium'
                    : 'bg-white text-slate-800 rounded-tl-none border border-amber-200/80'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Recommended Products Cards */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2">
                    <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" /> Recommended Sarees for You:
                    </p>
                    <div className="space-y-2">
                      {msg.recommendedProducts.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            onSelectProduct(prod);
                            onClose();
                          }}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-50/70 hover:bg-amber-100 border border-amber-300/60 cursor-pointer transition"
                        >
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-12 h-16 object-cover rounded-lg shrink-0 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif-royal text-xs font-bold text-slate-900 truncate">
                              {prod.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 block">{prod.fabric}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-extrabold text-[#9D174D]">
                                ₹{prod.salePrice.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-400 line-through">
                                ₹{prod.mrp.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <ShoppingBag className="w-4 h-4 text-pink-900 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold bg-white p-3 rounded-2xl border border-amber-200 w-fit">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>{BRAND_NAME} AI is crafting your recommendation...</span>
            </div>
          )}
        </div>

        {/* Quick Occasion Suggestion Chips */}
        <div className="p-2.5 bg-amber-50/60 border-t border-amber-200">
          <p className="text-[10px] font-bold text-amber-900 mb-1.5 uppercase tracking-wider">
            Popular Occasion Filters:
          </p>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {OCCASION_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => sendMessage(`Find me a ${tag}`)}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-pink-950 font-medium text-[11px] rounded-full border border-amber-300 shrink-0 shadow-sm transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <button
            onClick={openVoiceSearch}
            className="p-2 rounded-full hover:bg-pink-50 text-pink-900 transition"
            title="Voice Prompt"
          >
            <Mic className="w-5 h-5 text-pink-900" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask AI: 'Show red Banarasi saree under ₹6000'..."
            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-100 rounded-full outline-none text-slate-900 placeholder:text-slate-400"
          />

          <button
            onClick={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 bg-[#9D174D] text-amber-300 rounded-full hover:bg-[#831843] transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
