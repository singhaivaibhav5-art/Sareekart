import React, { useState } from 'react';
import { BRAND_NAME } from '../constants';
import {
  X,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  Scissors,
  Check,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  PhoneCall,
  UserCheck,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  allOrders?: Order[];
  onSelectOrder?: (order: Order) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus, note?: string, location?: string) => void;
}

export const STAGES_LIST: { key: OrderStatus; label: string; icon: string; description: string }[] = [
  {
    key: 'Weaving',
    label: 'Weaving',
    icon: '🧵',
    description: 'Artisan weaving pure silk yarn & Zari motifs on handloom',
  },
  {
    key: 'Quality Check',
    label: 'Quality Check',
    icon: '🔍',
    description: 'Silk Mark authority authentication & zari purity testing',
  },
  {
    key: 'Packed',
    label: 'Packed',
    icon: '📦',
    description: 'Sealed inside royal velvet keepsake gift box with scented pouch',
  },
  {
    key: 'Out for Delivery',
    label: 'Out for Delivery',
    icon: '🚚',
    description: 'Courier executive dispatched for final doorstep delivery',
  },
  {
    key: 'Delivered',
    label: 'Delivered',
    icon: '🎁',
    description: 'Safely handed over to patron at destination address',
  },
];

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  order,
  allOrders = [],
  onSelectOrder,
  onUpdateOrderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'TRACKING' | 'ITEMS' | 'ALL_ORDERS'>('TRACKING');
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const currentOrder = order || allOrders[0];

  if (!currentOrder) {
    return (
      <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#FDFBF7] w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-amber-500/50 text-center space-y-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-serif-royal font-bold text-lg text-pink-950">No Active Orders Found</h3>
          <p className="text-xs text-slate-500">
            Place your first royal saree order to view real-time handloom weaving & delivery progress!
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#9D174D] text-amber-300 font-extrabold text-xs rounded-xl hover:bg-[#831843] transition"
          >
            Explore Catalog
          </button>
        </div>
      </div>
    );
  }

  // Calculate current stage index (0 to 4)
  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case 'Placed':
      case 'Weaving':
        return 0;
      case 'Quality Check':
        return 1;
      case 'Packed':
        return 2;
      case 'Out for Delivery':
        return 3;
      case 'Delivered':
        return 4;
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageIndex(currentOrder.status);

  // Handle live simulation advance
  const handleAdvanceStage = () => {
    if (!onUpdateOrderStatus) return;
    setIsSimulating(true);

    const nextIndex = (currentStageIndex + 1) % STAGES_LIST.length;
    const nextStage = STAGES_LIST[nextIndex].key;

    setTimeout(() => {
      onUpdateOrderStatus(
        currentOrder.id,
        nextStage,
        `Stage advanced to ${nextStage} via live updates`,
        'Hub Location Verified'
      );
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFBF7] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/50 my-auto flex flex-col relative max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#9D174D] via-[#831843] to-amber-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 font-bold">
              <Truck className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-royal text-base font-bold text-white">Real-Time Order Tracking</span>
                <span className="bg-amber-400 text-pink-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-ping" /> LIVE
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-mono">
                Order ID: #{currentOrder.id} • Placed on {currentOrder.orderDate}
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

        {/* View Tabs & Order Selector */}
        <div className="bg-amber-50/80 px-4 py-2 border-b border-amber-200 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('TRACKING')}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                activeTab === 'TRACKING' ? 'bg-[#9D174D] text-amber-300 shadow' : 'text-slate-600 hover:bg-amber-100'
              }`}
            >
              📍 Live Status Stepper
            </button>
            <button
              onClick={() => setActiveTab('ITEMS')}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                activeTab === 'ITEMS' ? 'bg-[#9D174D] text-amber-300 shadow' : 'text-slate-600 hover:bg-amber-100'
              }`}
            >
              🛍️ Order Items ({currentOrder.items.length})
            </button>
            {allOrders.length > 1 && (
              <button
                onClick={() => setActiveTab('ALL_ORDERS')}
                className={`px-3 py-1 rounded-xl font-bold transition ${
                  activeTab === 'ALL_ORDERS'
                    ? 'bg-[#9D174D] text-amber-300 shadow'
                    : 'text-slate-600 hover:bg-amber-100'
                }`}
              >
                📋 All Orders ({allOrders.length})
              </button>
            )}
          </div>

          {onUpdateOrderStatus && (
            <button
              onClick={handleAdvanceStage}
              disabled={isSimulating}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 text-pink-950 font-extrabold px-3 py-1 rounded-xl shadow-sm text-[11px] flex items-center gap-1 shrink-0"
              title="Simulate step transition in real-time"
            >
              <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Simulate Next Stage →</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-slate-900">
          {activeTab === 'ALL_ORDERS' ? (
            <div className="space-y-3">
              <h4 className="font-serif-royal font-bold text-sm text-pink-950">Your {BRAND_NAME} Orders</h4>
              <div className="space-y-2">
                {allOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      if (onSelectOrder) onSelectOrder(ord);
                      setActiveTab('TRACKING');
                    }}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      ord.id === currentOrder.id
                        ? 'bg-amber-50 border-amber-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={ord.items[0]?.product.images[0]}
                          alt={ord.items[0]?.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-pink-950">#{ord.id}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-pink-100 text-pink-900 border border-pink-200">
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{ord.items[0]?.product.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">₹{ord.totalAmount.toLocaleString()} • {ord.orderDate}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'ITEMS' ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-3">
                <h4 className="font-serif-royal font-bold text-sm text-pink-950 flex items-center justify-between border-b pb-2 border-slate-100">
                  <span>Purchased Saree Collection</span>
                  <span className="text-xs text-amber-700">Total: ₹{currentOrder.totalAmount.toLocaleString()}</span>
                </h4>
                <div className="divide-y divide-slate-100">
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-200"
                        />
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{item.product.name}</h5>
                          <p className="text-[10px] text-slate-500">
                            Category: {item.product.category} • Fabric: {item.product.fabric}
                          </p>
                          {item.blouseStitching && (
                            <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 inline-block mt-0.5">
                              ✨ Customized Blouse Stitching Included
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-xs text-pink-950">
                          ₹{(item.product.salePrice * item.quantity).toLocaleString()}
                        </span>
                        <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address Box */}
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 text-xs space-y-1">
                <p className="font-bold text-pink-950 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-pink-800" /> Delivery Address
                </p>
                <p className="text-slate-700 font-semibold">{currentOrder.address.name} (+91 {currentOrder.address.phone})</p>
                <p className="text-slate-500">
                  {currentOrder.address.houseNo}, {currentOrder.address.street}, {currentOrder.address.city}, {currentOrder.address.state} - {currentOrder.address.pincode}
                </p>
              </div>
            </div>
          ) : (
            /* TRACKING TAB - Visual Real-Time Stage Stepper */
            <div className="space-y-5">
              
              {/* Top Banner Status Box */}
              <div className="bg-gradient-to-r from-pink-900 via-[#831843] to-amber-900 text-white p-4 rounded-2xl shadow-md border border-amber-400/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{STAGES_LIST[currentStageIndex]?.icon || '📦'}</span>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                        Current Real-Time Stage
                      </p>
                      <h3 className="font-serif-royal text-lg font-bold text-amber-100">
                        {currentOrder.status}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-amber-200/80">Estimated Delivery</p>
                    <p className="font-extrabold text-xs text-amber-300 bg-black/20 px-2 py-0.5 rounded-lg border border-amber-400/30">
                      📅 {currentOrder.estimatedDelivery}
                    </p>
                  </div>
                </div>

                {currentOrder.currentLocation && (
                  <div className="pt-2 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                    <span className="flex items-center gap-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" /> {currentOrder.currentLocation}
                    </span>
                    {currentOrder.masterWeaver && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-300 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" /> {currentOrder.masterWeaver}
                      </span>
                    )}
                    {currentOrder.courierPartner && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-300 font-medium">
                        <Truck className="w-3.5 h-3.5 text-amber-400" /> {currentOrder.courierPartner}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 5-Stage Stepper Component */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200 shadow-sm space-y-4">
                <h4 className="font-serif-royal font-bold text-xs uppercase tracking-wider text-pink-950 flex items-center justify-between">
                  <span>Handloom & Delivery Journey</span>
                  <span className="text-[11px] font-semibold text-amber-700">Stage {currentStageIndex + 1} of 5</span>
                </h4>

                {/* Desktop/Tablet Horizontal Stepper Bar */}
                <div className="relative py-2 hidden sm:block">
                  {/* Connecting Line */}
                  <div className="absolute top-7 left-8 right-8 h-1 bg-slate-200 rounded-full -z-0">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-pink-700 to-[#9D174D] rounded-full transition-all duration-500"
                      style={{
                        width: `${(currentStageIndex / (STAGES_LIST.length - 1)) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between relative z-10">
                    {STAGES_LIST.map((stg, idx) => {
                      const isCompleted = idx < currentStageIndex;
                      const isCurrent = idx === currentStageIndex;
                      return (
                        <div key={stg.key} className="flex flex-col items-center space-y-1.5 w-24 text-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md ${
                              isCompleted
                                ? 'bg-[#9D174D] text-white border-2 border-amber-400'
                                : isCurrent
                                ? 'bg-amber-400 text-pink-950 border-4 border-pink-900 scale-110 animate-pulse'
                                : 'bg-slate-100 text-slate-400 border border-slate-300'
                            }`}
                          >
                            {isCompleted ? <Check className="w-5 h-5 text-amber-300" /> : stg.icon}
                          </div>
                          <p
                            className={`text-[11px] font-extrabold leading-tight ${
                              isCurrent
                                ? 'text-[#9D174D]'
                                : isCompleted
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {stg.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Vertical Stepper View */}
                <div className="space-y-4 pt-1">
                  {STAGES_LIST.map((stg, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    const isPending = idx > currentStageIndex;

                    // Find note in history if present
                    const stepHistory = currentOrder.stageHistory?.find((h) => h.stage === stg.key);

                    return (
                      <div
                        key={stg.key}
                        className={`p-3 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-amber-50/90 border-amber-400 shadow-md ring-2 ring-amber-300/40'
                            : isCompleted
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold mt-0.5 ${
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-gradient-to-tr from-[#9D174D] to-amber-500 text-white animate-bounce'
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {isCompleted ? <Check className="w-4 h-4 text-white" /> : stg.icon}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h5
                                className={`text-xs font-extrabold ${
                                  isCurrent
                                    ? 'text-[#9D174D]'
                                    : isCompleted
                                    ? 'text-emerald-950'
                                    : 'text-slate-500'
                                }`}
                              >
                                {stg.label}
                                {isCurrent && (
                                  <span className="ml-2 text-[10px] bg-[#9D174D] text-amber-300 px-2 py-0.5 rounded-full font-bold">
                                    In Progress
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                    Completed ✓
                                  </span>
                                )}
                              </h5>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {stepHistory?.timestamp || (isCompleted ? 'Completed' : isCurrent ? 'Active Now' : 'Pending')}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 font-medium">
                              {stepHistory?.note || stg.description}
                            </p>

                            {stepHistory?.location && (
                              <p className="text-[10px] text-amber-800 font-semibold flex items-center gap-1 pt-0.5">
                                <MapPin className="w-3 h-3 text-amber-600" /> {stepHistory.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Silk Guarantee & Support Box */}
              <div className="bg-amber-100/60 border border-amber-300 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-6 h-6 text-amber-800 shrink-0" />
                  <div>
                    <h5 className="font-serif-royal font-bold text-pink-950">100% Authentic Silk Mark Certified</h5>
                    <p className="text-[10px] text-slate-600">
                      Handcrafted with original 24k gold zari thread & certified Mulberry silk.
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:+919876543210`}
                  className="bg-white border border-amber-400 text-pink-950 hover:bg-amber-200 font-bold px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-1 shrink-0"
                >
                  <PhoneCall className="w-3 h-3 text-pink-900" /> Help Support
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
