import React, { useState } from 'react';
import { CartItem, Address, Order } from '../types';
import { BRAND_NAME } from '../constants';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Coins,
  ShieldCheck,
  Tag,
  CreditCard,
  Truck,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart?: () => void;
  walletCoins: number;
  onPlaceOrder?: (order: Order) => void;
  onOrderSuccess?: (order: Order) => void;
  openAuth?: () => void;
  isLoggedIn?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  walletCoins,
  onPlaceOrder,
  onOrderSuccess,
  openAuth,
  isLoggedIn = true,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [useCoins, setUseCoins] = useState(false);

  // Address State
  const [address, setAddress] = useState<Address>({
    id: 'a1',
    name: 'Patron',
    phone: '9876543210',
    houseNo: 'Flat 402, Royal Residency',
    street: 'MG Road',
    pincode: '110001',
    city: 'New Delhi',
    state: 'Delhi',
    isDefault: true,
  });

  // Razorpay Checkout Modal state
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'RAZORPAY_NETBANKING' | 'COD'>('RAZORPAY_UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  const coinsDeduction = useCoins ? Math.min(walletCoins, subtotal * 0.2) : 0; // Max 20% by coins
  const deliveryFee = subtotal > 1999 || subtotal === 0 ? 0 : 99;
  const totalAmount = Math.max(0, subtotal - discountAmount - coinsDeduction + deliveryFee);
  const earnedCoins = Math.floor(subtotal * 0.05);

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'ROYAL500' && subtotal >= 2999) {
      setDiscountAmount(500);
      setCouponApplied('ROYAL500 (₹500 OFF)');
    } else if (couponCode.toUpperCase() === 'SAREE100') {
      setDiscountAmount(100);
      setCouponApplied('SAREE100 (₹100 OFF)');
    } else {
      alert('Invalid coupon code or minimum order amount not met. Try ROYAL500 or SAREE100!');
    }
  };

  const handleCheckoutClick = () => {
    if (!isLoggedIn && openAuth) {
      openAuth();
      return;
    }
    if (cartItems.length === 0) return;
    setShowRazorpayModal(true);
  };

  const executePaymentWithId = async (payId: string) => {
    setIsProcessingPayment(true);
    const orderId = `ord_${Date.now()}`;
    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const newOrder: Order = {
      id: orderId,
      items: cartItems,
      subtotal,
      discount: discountAmount,
      coinsUsed: Math.floor(coinsDeduction),
      deliveryFee,
      totalAmount,
      earnedCoins,
      paymentMethod,
      paymentId: payId,
      status: 'Placed',
      createdAt: new Date().toISOString(),
      address,
      orderDate: new Date().toLocaleDateString('en-IN'),
      estimatedDelivery: '5-7 Working Days',
      currentLocation: 'Order Placed & Confirmed',
      masterWeaver: 'Ustad Rameshwar Shastri (Loom #18)',
      stageHistory: [
        {
          stage: 'Placed',
          timestamp: `Today, ${nowStr}`,
          location: 'Order Confirmed',
          note: 'Order successfully placed via Razorpay checkout.',
          completed: true,
        },
      ],
    };

    // Save order to 'orders' Firestore collection
    try {
      const orderRef = doc(db, 'orders', orderId);
      await setDoc(orderRef, newOrder);
    } catch (err) {
      console.warn('Error saving order to Firestore collection:', err);
    }

    // Sync with server API
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });
    } catch (err) {
      console.warn('Backend API order sync offline fallback', err);
    }

    // Trigger completion handlers and clear cart
    setOrderSuccess(newOrder);
    if (onPlaceOrder) onPlaceOrder(newOrder);
    if (onOrderSuccess) onOrderSuccess(newOrder);
    if (onClearCart) onClearCart();

    setIsProcessingPayment(false);
    setShowRazorpayModal(false);
  };

  const executePayment = async () => {
    if (paymentMethod !== 'COD' && typeof (window as any).Razorpay !== 'undefined') {
      const options = {
        key: 'rzp_test_veeransh_sarees_key',
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        name: BRAND_NAME,
        description: 'Authentic Handloom Saree Purchase',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80',
        handler: function (response: any) {
          executePaymentWithId(response.razorpay_payment_id || `pay_rzp_${Date.now()}`);
        },
        prefill: {
          name: address.name,
          contact: address.phone,
        },
        theme: {
          color: '#9D174D',
        },
      };

      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.warn('Razorpay SDK error, proceeding with direct simulation:', err);
      }
    }

    // Direct simulation or COD
    setIsProcessingPayment(true);
    setTimeout(() => {
      executePaymentWithId(paymentMethod === 'COD' ? 'COD_VERIFIED' : `pay_rzp_${Date.now()}`);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/70 backdrop-blur-sm flex justify-end">
      <div className="bg-[#FDFBF7] w-full max-w-md h-full shadow-2xl flex flex-col border-l border-amber-500/40 animate-in slide-in-from-right duration-300 relative">
        
        {/* Header */}
        <div className="p-4 bg-[#9D174D] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <h2 className="font-serif-royal text-base font-bold text-white flex items-center gap-1.5">
              <span>Shopping Bag</span>
              <span className="text-amber-300 text-xs">({cartItems.length} items)</span>
            </h2>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {orderSuccess ? (
          <div className="flex-1 p-6 text-center space-y-4 flex flex-col justify-center items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-serif-royal text-2xl font-bold text-pink-950">
              Order Placed Successfully! 🎉
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Order ID: <span className="font-bold text-[#9D174D]">#{orderSuccess.id}</span>
              <br />
              Estimated Delivery: <span className="font-semibold text-emerald-700">{orderSuccess.estimatedDelivery}</span>
            </p>
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-300 text-xs font-bold text-amber-900">
              🪙 Earned +{orderSuccess.earnedCoins} SareeCoins credited to your wallet!
            </div>
            <button
              onClick={() => {
                setOrderSuccess(null);
                onClose();
              }}
              className="px-6 py-2.5 bg-[#9D174D] text-white font-bold text-xs rounded-xl hover:bg-[#831843] transition shadow"
            >
              Continue Shopping
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex-1 p-6 text-center space-y-3 flex flex-col justify-center items-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <Tag className="w-8 h-8" />
            </div>
            <h3 className="font-serif-royal text-lg font-bold text-slate-900">Your Shopping Bag is Empty</h3>
            <p className="text-xs text-slate-500">Explore our Banarasi, Kanjivaram & Designer Saree collections.</p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#9D174D] text-white font-bold text-xs rounded-xl shadow hover:bg-[#831843] transition"
            >
              Explore Collection
            </button>
          </div>
        ) : (
          <>
            {/* Scrollable Cart List & Billing */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Item Cards */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 p-3 bg-white rounded-2xl border border-amber-200/80 shadow-sm relative"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-22 object-cover rounded-xl shrink-0"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-serif-royal text-xs font-bold text-slate-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] text-amber-700 font-semibold">{item.product.category}</p>

                      {item.blouseStitching && (
                        <span className="text-[9px] bg-pink-100 text-pink-900 font-bold px-2 py-0.5 rounded-full inline-block">
                          + Custom Blouse Stitching
                        </span>
                      )}

                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        <span className="text-xs font-extrabold text-[#9D174D]">
                          ₹{(item.product.salePrice * item.quantity).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          ₹{(item.product.mrp * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-slate-200 text-slate-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-900">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-slate-200 text-slate-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-slate-400 hover:text-red-600 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code Block */}
              <div className="bg-white p-3.5 rounded-2xl border border-amber-300/70 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-pink-950">
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4 text-amber-600" /> Apply Coupon Code
                  </span>
                  <span className="text-[10px] text-amber-700">ROYAL500 / SAREE100</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter Coupon Code"
                    className="flex-1 uppercase px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-[#9D174D] outline-none font-bold text-slate-900"
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-3.5 py-1.5 bg-[#9D174D] text-white font-bold text-xs rounded-xl hover:bg-[#831843] transition"
                  >
                    Apply
                  </button>
                </div>

                {couponApplied && (
                  <p className="text-[11px] text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                    ✓ Coupon Applied: {couponApplied}
                  </p>
                )}
              </div>

              {/* Wallet Points Redemption Option */}
              {walletCoins > 0 && (
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold text-amber-950">Use SareeCoins Balance?</p>
                      <p className="text-[10px] text-amber-800">Available: 🪙 {walletCoins} Coins</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useCoins}
                    onChange={(e) => setUseCoins(e.target.checked)}
                    className="w-5 h-5 accent-[#9D174D] cursor-pointer"
                  />
                </div>
              )}

              {/* Delivery Address Details */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-pink-950">
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4 text-amber-600" /> Delivery Address
                  </span>
                </div>
                <div className="text-slate-700 font-medium leading-tight">
                  <p className="font-bold text-slate-900">{address.name} ({address.phone})</p>
                  <p>{address.houseNo}, {address.street}</p>
                  <p>{address.city}, {address.state} - {address.pincode}</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-white p-4 rounded-2xl border border-amber-300/80 space-y-2 text-xs">
                <h4 className="font-serif-royal font-bold text-pink-950 uppercase tracking-wider text-[11px] mb-1">
                  Bill Summary
                </h4>
                <div className="flex justify-between text-slate-600">
                  <span>Bag Subtotal</span>
                  <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {coinsDeduction > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Coins Redemption</span>
                    <span>- ₹{Math.floor(coinsDeduction)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Express Delivery Fee</span>
                  <span className="text-emerald-700 font-bold">
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-pink-950">
                  <span>Total Payable</span>
                  <span className="text-[#9D174D] text-base">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Checkout Footer */}
              <div className="p-3 bg-white border-t border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Final Payable</span>
                  <span className="text-lg font-extrabold text-[#9D174D]">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={handleCheckoutClick}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-pink-950 font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4 text-pink-950" />
                  <span>Proceed to Razorpay →</span>
                </button>
              </div>
            </>
          )}

        {/* Razorpay + COD Simulated Checkout Modal (Requirements: Razorpay + COD) */}
        {showRazorpayModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#FDFBF7] w-full max-w-sm rounded-3xl p-5 shadow-2xl border-2 border-amber-500/60 space-y-4 animate-in zoom-in-95 duration-200 relative text-slate-800">
              
              <button
                onClick={() => setShowRazorpayModal(false)}
                className="absolute top-3 right-3 p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Razorpay Brand Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  RZP
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1">
                    Razorpay Secure Checkout <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </h3>
                  <p className="text-[10px] text-slate-500">Merchant: {BRAND_NAME} Pvt Ltd</p>
                </div>
              </div>

              {/* Order Amount */}
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-300 text-center">
                <span className="text-[11px] text-slate-600 block">Amount to Pay</span>
                <span className="text-2xl font-extrabold text-[#9D174D]">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Payment Method Tabs */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Select Payment Method:</p>

                <div className="space-y-2 text-xs">
                  <label
                    onClick={() => setPaymentMethod('RAZORPAY_UPI')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'RAZORPAY_UPI'
                        ? 'bg-amber-100 border-amber-500 font-bold text-pink-950'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Instant UPI (GPay / PhonePe / Paytm)</span>
                    </div>
                    <input type="radio" checked={paymentMethod === 'RAZORPAY_UPI'} readOnly />
                  </label>

                  <label
                    onClick={() => setPaymentMethod('RAZORPAY_CARD')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'RAZORPAY_CARD'
                        ? 'bg-amber-100 border-amber-500 font-bold text-pink-950'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span>Credit / Debit Card</span>
                    </div>
                    <input type="radio" checked={paymentMethod === 'RAZORPAY_CARD'} readOnly />
                  </label>

                  <label
                    onClick={() => setPaymentMethod('COD')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'COD'
                        ? 'bg-amber-100 border-amber-500 font-bold text-pink-950'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-700" />
                      <span>Cash on Delivery (COD)</span>
                    </div>
                    <input type="radio" checked={paymentMethod === 'COD'} readOnly />
                  </label>
                </div>
              </div>

              {/* Confirm Payment Action */}
              <button
                onClick={executePayment}
                disabled={isProcessingPayment}
                className="w-full py-3 bg-[#9D174D] hover:bg-[#831843] text-amber-300 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                    <span>Processing Razorpay Order...</span>
                  </>
                ) : (
                  <span>Pay ₹{totalAmount.toLocaleString('en-IN')} & Complete Order →</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
