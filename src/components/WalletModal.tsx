import React, { useState, useEffect } from 'react';
import { BRAND_NAME } from '../constants';
import { X, Coins, Sparkles, ArrowUpRight, ArrowDownLeft, Gift } from 'lucide-react';
import { WalletTransaction } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletCoins: number;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, walletCoins }) => {
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWallet();
    }
  }, [isOpen]);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 border-amber-500/50 space-y-4 relative animate-in zoom-in-95 duration-200 text-slate-800">
        
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-[#9D174D] via-[#831843] to-amber-700 text-white p-5 rounded-2xl shadow-lg border border-amber-400/40 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Coins className="w-4 h-4" /> SareeCoins Wallet Balance
          </div>

          <div className="text-3xl font-extrabold text-amber-300 tracking-tight">
            🪙 {walletCoins} Coins
          </div>
          <p className="text-[11px] text-amber-100">1 SareeCoin = ₹1 Instant Checkout Discount</p>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-amber-600" /> How to Earn More SareeCoins:
          </p>
          <ul className="list-disc list-inside text-[11px] space-y-0.5 text-slate-700">
            <li>Earn 5% cashback coins on every saree purchase.</li>
            <li>Get 500 Coins bonus on orders above ₹4,999.</li>
            <li>Refer friends to {BRAND_NAME} to earn 100 Coins per referral.</li>
          </ul>
        </div>

        {/* Transactions History */}
        <div className="space-y-2">
          <h4 className="font-serif-royal font-bold text-xs text-pink-950 uppercase tracking-wide">
            Recent Wallet Activity
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {history.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-sm"
              >
                <div className="flex items-center gap-2">
                  {tx.type === 'EARNED' || tx.type === 'ADMIN_CREDIT' ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{tx.description}</p>
                    <span className="text-[10px] text-slate-400">{tx.date}</span>
                  </div>
                </div>

                <span
                  className={`font-extrabold text-xs ${
                    tx.type === 'EARNED' || tx.type === 'ADMIN_CREDIT'
                      ? 'text-emerald-700'
                      : 'text-pink-900'
                  }`}
                >
                  {tx.type === 'EARNED' || tx.type === 'ADMIN_CREDIT' ? '+' : '-'} {tx.coins} Coins
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
