import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { BRAND_NAME } from './constants';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Product, Banner, AdBanner, CartItem, Order, UserProfile, CustomerQuery, OrderStatus } from './types';
import { INITIAL_PRODUCTS, INITIAL_BANNERS, INITIAL_AD_BANNER, INITIAL_QUERIES, INITIAL_ORDERS } from './data/initialData';
import { Navbar } from './components/Navbar';
import { BannerSlider } from './components/BannerSlider';
import { CategoryGallery } from './components/CategoryGallery';
import { AdBannerBox } from './components/AdBannerBox';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ARTryOnModal } from './components/ARTryOnModal';
import { AIChatbotDrawer } from './components/AIChatbotDrawer';
import { VoiceSearchModal } from './components/VoiceSearchModal';
import { ImageSearchModal } from './components/ImageSearchModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { AuthModal } from './components/AuthModal';
import { WalletModal } from './components/WalletModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AIRecommendationEngineModal } from './components/AIRecommendationEngineModal';
import { AIRecommendationEngineWidget } from './components/AIRecommendationEngineWidget';
import { WishlistPriceDropNotification } from './components/WishlistPriceDropNotification';
import { AIDrapingGuideModal } from './components/AIDrapingGuideModal';
import { AIStyleQuizModal } from './components/AIStyleQuizModal';

export function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [adBanner, setAdBanner] = useState<AdBanner>(INITIAL_AD_BANNER);
  const [queries, setQueries] = useState<CustomerQuery[]>(INITIAL_QUERIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [browsingHistory, setBrowsingHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sareekart_browsing_history');
      return saved? JSON.parse(saved) : ['p1', 'p3'];
    } catch { return ['p1', 'p3']; }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sareekart_wishlist');
      return saved? JSON.parse(saved) : ['p1'];
    } catch { return ['p1']; }
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sareekart_cart');
      return saved? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('sareekart_orders');
      return saved && JSON.parse(saved).length > 0? JSON.parse(saved) : INITIAL_ORDERS;
    } catch { return INITIAL_ORDERS; }
  });

  const [walletCoins, setWalletCoins] = useState<number>(250);
  const [showFlashSaleAlert, setShowFlashSaleAlert] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile>({
    name: 'Royal Veeransh Patron',
    phone: '9876543210',
    email: 'patron@veeranshsarees.com',
    walletCoins: 250,
    isLoggedIn: false,
    savedAddresses: [],
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAIStylistOpen, setIsAIStylistOpen] = useState(false);
  const [isAIEngineModalOpen, setIsAIEngineModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isARTryOnOpen, setIsARTryOnOpen] = useState(false);
  const [arTryOnProduct, setArTryOnProduct] = useState<Product | null>(null);
  const [isDrapingTutorialOpen, setIsDrapingTutorialOpen] = useState(false);
  const [isStyleQuizOpen, setIsStyleQuizOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  useEffect(() => { localStorage.setItem('sareekart_browsing_history', JSON.stringify(browsingHistory)); }, [browsingHistory]);
  useEffect(() => { localStorage.setItem('sareekart_wishlist', JSON.stringify(wishlistIds)); }, [wishlistIds]);
  useEffect(() => { localStorage.setItem('sareekart_cart', JSON.stringify(cartItems)); }, [cartItems]);
  useEffect(() => { localStorage.setItem('sareekart_orders', JSON.stringify(orders)); }, [orders]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUser({
              name: data.name || fbUser.displayName || 'Royal Veeransh Patron',
              phone: data.phone || fbUser.phoneNumber?.replace('+91', '') || '9876543210',
              email: data.email || fbUser.email || 'patron@veeranshsarees.com',
              walletCoins: data.walletCoins?? 250,
              isLoggedIn: true,
              savedAddresses: data.savedAddresses || [],
            });
            if (data.wishlistIds && Array.isArray(data.wishlistIds)) setWishlistIds(data.wishlistIds);
            if (data.cartItems && Array.isArray(data.cartItems)) setCartItems(data.cartItems);
            if (data.walletCoins!== undefined) setWalletCoins(data.walletCoins);
          } else {
            const initialUserData = {
              uid: fbUser.uid,
              name: fbUser.displayName || 'Royal Veeransh Patron',
              email: fbUser.email || 'patron@veeranshsarees.com',
              phone: fbUser.phoneNumber? fbUser.phoneNumber.replace('+91', '') : '9876543210',
              walletCoins: 250,
              wishlistIds,
              cartItems,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialUserData, { merge: true });
            setUser({ name: initialUserData.name, phone: initialUserData.phone, email: initialUserData.email, walletCoins: 250, isLoggedIn: true, savedAddresses: [] });
          }
        } catch (err) { console.error('Error syncing user profile from Firestore:', err); }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (auth.currentUser && user.isLoggedIn) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      setDoc(userDocRef, { wishlistIds, cartItems, walletCoins, name: user.name, phone: user.phone, email: user.email, updatedAt: new Date().toISOString() }, { merge: true }).catch((err) => console.log('Firestore user doc sync error:', err));
    }
  }, [wishlistIds, cartItems, walletCoins, user]);

  useEffect(() => {
    let unsubscribeProducts: () => void = () => {};
    try {
      if (db) {
        unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
          if (!snapshot.empty) {
            const firestoreProds: Product[] = snapshot.docs.map((docSnap) => ({ id: docSnap.id,...docSnap.data() } as Product));
            setProducts((prev) => {
              const existingIds = new Set(firestoreProds.map((p) => p.id));
              const nonDupPrev = prev.filter((p) =>!existingIds.has(p.id));
              return [...firestoreProds,...nonDupPrev];
            });
          }
        }, (err) => console.log('Firestore products snapshot fallback', err));
      }
    } catch (e) { console.log('Firestore init fallback', e); }

    fetch('/api/products')
     .then((res) => { if (!res.ok) throw new Error(`API 404 - Using Local Data`); return res.json(); })
     .then((data) => {
        if (data.success && data.products) {
          setProducts((prev) => {
            const fsIds = new Set(prev.map((p) => p.id));
            const fresh = data.products.filter((p: Product) => p && p.id &&!fsIds.has(p.id));
            return [...prev,...fresh];
          });
        }
      })
     .catch((err) => console.log('Using default products data fallback', err));

    fetch('/api/banners')
     .then((res) => { if (!res.ok) throw new Error('API 404 - Banners Local'); return res.json(); })
     .then((data) => {
        if (data.success) {
          if (data.banners) setBanners(data.banners);
          if (data.adBanner) setAdBanner(data.adBanner);
        }
      })
     .catch((err) => console.log('Using default banners data fallback', err));

    fetch('/api/wallet')
     .then((res) => { if (!res.ok) throw new Error('API 404 - Wallet Local'); return res.json(); })
     .then((data) => { if (data.success && data.walletCoins) setWalletCoins(data.walletCoins); })
     .catch((err) => console.log('Using default wallet data fallback', err));

    const fetchOrders = () => {
      fetch('/api/orders')
       .then((res) => { if (!res.ok) throw new Error('API 404 - Orders Local'); return res.json(); })
       .then((data) => {
          if (data.success && data.orders && data.orders.length > 0) {
            setOrders(data.orders);
            setTrackedOrder((prev) => {
              if (!prev) return data.orders[0];
              const updated = data.orders.find((o: Order) => o.id === prev.id);
              return updated || prev;
            });
          }
        })
       .catch((err) => console.log('Using initial orders data fallback', err));
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => { try { unsubscribeProducts(); } catch {} clearInterval(interval); };
  }, []);

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, note?: string, location?: string, courierName?: string, trackingId?: string, dispatchDate?: string) => {
    fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, note, location, courierName, trackingId, dispatchDate }),
    })
     .then((res) => { if (!res.ok) throw new Error(`API ${res.status}`); return res.json(); })
     .then((data) => {
        if (data.success && data.order) {
          setOrders((prev) => prev.map((o) => (o.id === orderId? data.order : o)));
          if (trackedOrder?.id === orderId) setTrackedOrder(data.order);
        }
      })
     .catch(() => {
        setOrders((prev) => prev.map((o) => {
          if (o.id === orderId) {
            const updatedStageHistory = [...(o.stageHistory || []), { stage: newStatus, timestamp: `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, location: location || 'Logistics Hub', note: note || `Order stage advanced to ${newStatus}`, completed: newStatus === 'Delivered' }];
            return {...o, status: newStatus, courierPartner: courierName || o.courierPartner, trackingNumber: trackingId || o.trackingNumber, currentLocation: location || o.currentLocation, stageHistory: updatedStageHistory };
          }
          return o;
        }));
      });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setBrowsingHistory((prev) => { const filtered = prev.filter((id) => id!== product.id); return [product.id,...filtered].slice(0, 20); });
  };
  const handleToggleWishlist = (productId: string) => { setWishlistIds((prev) => prev.includes(productId)? prev.filter((id) => id!== productId) : [...prev, productId]); };
  const handleAddToCart = (product: Product, blouseStitching: boolean = false) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && item.blouseStitching === blouseStitching);
      if (existing) return prev.map((item) => item.product.id === product.id && item.blouseStitching === blouseStitching? {...item, quantity: item.quantity + 1 } : item);
      return [...prev, { product, quantity: 1, blouseStitching }];
    });
    setIsCartOpen(true);
  };
  const handleUpdateQuantity = (productId: string, delta: number) => { setCartItems((prev) => prev.map((item) => { if (item.product.id === productId) { const newQty = item.quantity + delta; return newQty > 0? {...item, quantity: newQty } : null; } return item; }).filter(Boolean) as CartItem[]); };
  const handleRemoveCartItem = (productId: string) => { setCartItems((prev) => prev.filter((item) => item.product.id!== productId)); };
  const handleSelectCategoryAndScroll = (categoryName: string) => { setSelectedCategory(categoryName); setTimeout(() => { const el = document.getElementById('product-catalog'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); };
  const handleOrderSuccess = (newOrder: Order) => { setOrders((prev) => [newOrder,...prev]); setCartItems([]); if (newOrder.earnedCoins > 0) setWalletCoins((prev) => prev + newOrder.earnedCoins); if (newOrder.coinsUsed > 0) setWalletCoins((prev) => Math.max(0, prev - newOrder.coinsUsed)); };
  const handleOpenARTryOn = (product: Product) => { setArTryOnProduct(product); setIsARTryOnOpen(true); handleSelectProduct(product); };
  const handleTriggerSimulatedDrop = (productId: string, newPrice: number) => { setProducts((prev) => prev.map((p) => (p.id === productId? {...p, salePrice: newPrice, isFlashSale: true } : p))); };
  const hasWishlistPriceDrop = products.some((p) => wishlistIds.includes(p.id) && (p.isFlashSale || p.mrp > p.salePrice));
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.fabric.toLowerCase().includes(q) || p.work.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });
  const pageTitle = selectedCategory!== 'All'? `${selectedCategory} Pure Silk Sarees Direct from Master Artisans | ${BRAND_NAME}` : searchQuery? `Search: "${searchQuery}" | ${BRAND_NAME} Handloom Sarees` : `${BRAND_NAME} | Luxury Handloom Silk, Banarasi & Kanjivaram Sarees`;
  const pageDesc = selectedCategory!== 'All'? `Explore our exclusive ${selectedCategory} handloom saree collection with certified gold & silver Zari. Enjoy AR virtual try-on and direct weaver pricing.` : `Shop pure Banarasi, Kanjivaram, Organza, and Chanderi silk sarees direct from weavers. Certified purity, AR try-on, and worldwide express air shipping on ${BRAND_NAME}.`;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 flex flex-col font-sans max-w-md sm:max-w-2xl lg:max-w-5xl mx-auto shadow-2xl border-x border-amber-200 relative">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
      </Helmet>
      <WishlistPriceDropNotification products={products} wishlistIds={wishlistIds} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} onOpenWishlist={() => setIsWishlistOpen(true)} onTriggerSimulatedDrop={handleTriggerSimulatedDrop} />
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} openVoiceSearch={() => setIsVoiceSearchOpen(true)} openImageSearch={() => setIsImageSearchOpen(true)} cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)} openCart={() => setIsCartOpen(true)} wishlistCount={wishlistIds.length} openWishlist={() => setIsWishlistOpen(true)} openAIStylist={() => setIsAIStylistOpen(true)} openAuth={() => setIsAuthOpen(true)} openWallet={() => setIsWalletOpen(true)} isLoggedIn={user.isLoggedIn} walletCoins={walletCoins} openAdmin={() => setIsAdminOpen(true)} hasWishlistPriceDrop={hasWishlistPriceDrop} openDrapingGuide={() => setIsDrapingTutorialOpen(true)} openStyleQuiz={() => setIsStyleQuizOpen(true)} openOrderTracker={() => { if (orders.length > 0) setTrackedOrder(orders[0]); setIsOrderTrackerOpen(true); }} />
      <main className="flex-1 pb-20 space-y-2">
        <BannerSlider banners={banners} showFlashSaleAlert={showFlashSaleAlert} onCategorySelect={(cat) => handleSelectCategoryAndScroll(cat)} openAdmin={() => setIsAdminOpen(true)} />
        <CategoryGallery selectedCategory={selectedCategory} onSelectCategory={(cat) => handleSelectCategoryAndScroll(cat)} openStyleQuiz={() => setIsStyleQuizOpen(true)} />
        <AIRecommendationEngineWidget products={products} browsingHistory={browsingHistory} orders={orders} wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} onOpenARTryOn={handleOpenARTryOn} onOpenEngineModal={() => setIsAIEngineModalOpen(true)} />
        <AdBannerBox adBanner={adBanner} onCategorySelect={(cat) => handleSelectCategoryAndScroll(cat)} openAdmin={() => setIsAdminOpen(true)} />
        <ProductGrid products={filteredProducts} wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} selectedCategory={selectedCategory} />
      </main>
      <footer className="bg-[#831843] text-amber-100 text-center py-6 px-4 text-xs space-y-2 border-t border-amber-500/30">
        <p className="font-bold text-sm text-white">👑 {BRAND_NAME}</p>
        <p className="text-[11px] text-amber-200/80">Handcrafted Banarasi, Kanjivaram, Cotton & Silk Sarees delivered worldwide.</p>
      </footer>
      <AIRecommendationEngineModal isOpen={isAIEngineModalOpen} onClose={() => setIsAIEngineModalOpen(false)} products={products} browsingHistory={browsingHistory} orders={orders} wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} onOpenARTryOn={handleOpenARTryOn} />
      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} isWishlisted={selectedProduct? wishlistIds.includes(selectedProduct.id) : false} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onBuyNow={(prod, blouse) => { handleAddToCart(prod, blouse); setSelectedProduct(null); setIsCartOpen(true); }} openARTryOn={handleOpenARTryOn} />
      <ARTryOnModal isOpen={isARTryOnOpen} onClose={() => setIsARTryOnOpen(false)} product={arTryOnProduct} />
      <AIChatbotDrawer isOpen={isAIStylistOpen} onClose={() => setIsAIStylistOpen(false)} products={products} onSelectProduct={(p) => { handleSelectProduct(p); setIsAIStylistOpen(false); }} />
      <VoiceSearchModal isOpen={isVoiceSearchOpen} onClose={() => setIsVoiceSearchOpen(false)} onSearchResult={(term) => { setSearchQuery(term); setIsVoiceSearchOpen(false); }} />
      <ImageSearchModal isOpen={isImageSearchOpen} onClose={() => setIsImageSearchOpen(false)} products={products} onSelectProduct={(p) => { handleSelectProduct(p); setIsImageSearchOpen(false); }} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartItems} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={handleRemoveCartItem} onClearCart={() => setCartItems([])} walletCoins={walletCoins} onOrderSuccess={handleOrderSuccess} onPlaceOrder={handleOrderSuccess} openAuth={() => setIsAuthOpen(true)} isLoggedIn={user.isLoggedIn} />
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} products={products} wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onSelectProduct={handleSelectProduct} onTriggerSimulatedDrop={handleTriggerSimulatedDrop} onOpenCart={() => setIsCartOpen(true)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} user={user} orders={orders} onLoginSuccess={(u) => { setUser({...u, isLoggedIn: true }); setIsAuthOpen(false); }} onOpenOrderTracker={(ord) => { setTrackedOrder(ord); setIsOrderTrackerOpen(true); }} />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} coins={walletCoins} userPhone={user.phone} onAddCoins={(amount) => setWalletCoins((prev) => prev + amount)} />
      <AdminPanelModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} products={products} banners={banners} adBanner={adBanner} queries={queries} orders={orders} showFlashSaleAlert={showFlashSaleAlert} onToggleFlashSaleAlert={setShowFlashSaleAlert} onUpdateBanners={setBanners} onUpdateAdBanner={setAdBanner} onUpdateProducts={setProducts} onUpdateOrderStatus={handleUpdateOrderStatus} onOpenOrderTracker={(ord) => { setTrackedOrder(ord); setIsOrderTrackerOpen(true); }} onResolveQuery={(id) => setQueries((prev) => prev.map((q) => (q.id === id? {...q, status: 'RESOLVED' } : q))) } />
      <OrderTrackerModal isOpen={isOrderTrackerOpen} onClose={() => setIsOrderTrackerOpen(false)} order={trackedOrder} />
      <AIDrapingGuideModal isOpen={isDrapingTutorialOpen} onClose={() => setIsDrapingTutorialOpen(false)} product={selectedProduct || products[0] || null} />
      <AIStyleQuizModal isOpen={isStyleQuizOpen} onClose={() => setIsStyleQuizOpen(false)} products={products} onSelectProduct={(product) => handleSelectProduct(product)} onAddToCart={(product) => handleAddToCart(product)} />
    </div>
  );
}
export default App;
