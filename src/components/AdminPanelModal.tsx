import React, { useState, useRef } from 'react';
import { Product, Banner, AdBanner, CustomerQuery, Order, OrderStatus, CategoryName, Coupon, CustomerRecord, CategoryGalleryItem, CustomerGift, EditablePage, RewardSettings } from '../types';
import { 
  X, ShieldCheck, Edit, Plus, Trash2, Package, Image as ImageIcon, Sparkles, 
  AlertCircle, Truck, MapPin, UserCheck, RefreshCw, ChevronRight, Search, DollarSign, 
  Users, ShoppingCart, BarChart3, Tag, Gift, FileText, Wallet, Lock, LogOut, Check,
  Camera, Video, ArrowUpRight, Award, Printer, Clock, HelpCircle, Eye,
  Download, Sliders, Zap, Loader2, Edit3, ChevronLeft, UploadCloud
} from 'lucide-react';
import { INITIAL_COUPONS, INITIAL_CUSTOMERS, INITIAL_CATEGORY_GALLERY, INITIAL_GIFTS, INITIAL_EDITABLE_PAGES, INITIAL_REWARD_SETTINGS } from '../data/initialData';
import { db, storage } from '../lib/firebase';
import { doc, deleteDoc, setDoc, addDoc, collection, writeBatch, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { BRAND_NAME } from '../constants';

interface AdminPanelModalProps {
  isOpen: boolean; onClose: () => void; products: Product[]; banners: Banner[]; adBanner: AdBanner;
  queries: CustomerQuery[]; orders?: Order[]; showFlashSaleAlert?: boolean;
  onToggleFlashSaleAlert?: (show: boolean) => void; onUpdateBanners: (banners: Banner[]) => void;
  onUpdateAdBanner: (ad: AdBanner) => void; onUpdateProducts: (products: Product[]) => void;
  onResolveQuery: (id: string, replyText?: string) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus, note?: string, location?: string, courierName?: string, trackingId?: string, dispatchDate?: string) => void;
  onOpenOrderTracker?: (order: Order) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen, onClose, products, banners, adBanner, queries, orders = [], showFlashSaleAlert = false,
  onToggleFlashSaleAlert, onUpdateBanners, onUpdateAdBanner, onUpdateProducts, onResolveQuery, onUpdateOrderStatus,
}) => {
  const [adminEmail, setAdminEmail] = useState(''); const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false); const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PRODUCTS' | 'BANNERS' | 'ORDERS' | 'CUSTOMERS' | 'MARKETING' | 'QUERIES' | 'PAGES' | 'WALLET'>('DASHBOARD');
  const [productSearch, setProductSearch] = useState(''); const [productCategoryFilter, setProductCategoryFilter] = useState<string>('All');
  const [lowStockOnly, setLowStockOnly] = useState(false); const [catalogViewMode, setCatalogViewMode] = useState<'SLIDER' | 'TABLE'>('SLIDER');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false); const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodFormName, setProdFormName] = useState(''); const [prodFormCategory, setProdFormCategory] = useState<CategoryName>('Banarasi');
  const [prodFormMrp, setProdFormMrp] = useState(9999); const [prodFormSale, setProdFormSale] = useState(4999);
  const [prodFormRewardPoints, setProdFormRewardPoints] = useState(250); const [prodFormStock, setProdFormStock] = useState(10);
  const [prodFormFabric, setProdFormFabric] = useState('Pure Katan Silk'); const [prodFormLength, setProdFormLength] = useState('5.5m + 0.8m Blouse');
  const [prodFormWork, setProdFormWork] = useState('24k Gold Zari Weave'); const [prodFormWashCare, setProdFormWashCare] = useState('Dry Clean Only');
  const [prodFormPhotos, setProdFormPhotos] = useState<string[]>(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']);
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState(''); const [prodFormVideoUrl, setProdFormVideoUrl] = useState('');
  const [prodFormDescription, setProdFormDescription] = useState('Handcrafted royal Indian saree'); const [prodFormArEnabled, setProdFormArEnabled] = useState(true);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false); const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false); const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const sliderImageInputRef = useRef<HTMLInputElement>(null); const [sliderUploading, setSliderUploading] = useState(false);
  const [sliderUploadProgress, setSliderUploadProgress] = useState(0); const [sliderVideoUrl, setSliderVideoUrl] = useState('');
  const [sliderVideoUploading, setSliderVideoUploading] = useState(false);
  const [catUploading, setCatUploading] = useState(false); const [catUploadProgress, setCatUploadProgress] = useState(0);
  const [adUploading, setAdUploading] = useState(false); const [adUploadProgress, setAdUploadProgress] = useState(0);
  const [adVideoUploading, setAdVideoUploading] = useState(false); const [adVideoUploadProgress, setAdVideoUploadProgress] = useState(0);
  const [bannerSubTab, setBannerSubTab] = useState<'TOP_SLIDER' | 'CATEGORY_GALLERY' | 'AD_BOX'>('TOP_SLIDER');
  const [localBanners, setLocalBanners] = useState<Banner[]>(banners); const [localCategoryGallery, setLocalCategoryGallery] = useState<CategoryGalleryItem[]>(INITIAL_CATEGORY_GALLERY);
  const [localAdBanner, setLocalAdBanner] = useState<AdBanner>(adBanner); const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState(''); const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerCategory, setNewBannerCategory] = useState('Banarasi'); const [newBannerCountdown, setNewBannerCountdown] = useState('2026-08-15T23:59');
  const [orderFilter, setOrderFilter] = useState<string>('ALL'); const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null); const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [dispatchCourierName, setDispatchCourierName] = useState('BlueDart Express'); const [dispatchTrackingId, setDispatchTrackingId] = useState('');
  const [dispatchDateVal, setDispatchDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [customerTab, setCustomerTab] = useState<'REGISTERED' | 'GUEST'>('REGISTERED'); const [customers, setCustomers] = useState<CustomerRecord[]>(INITIAL_CUSTOMERS);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<CustomerRecord | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS); const [gifts, setGifts] = useState<CustomerGift[]>(INITIAL_GIFTS);
  const [newCouponCode, setNewCouponCode] = useState(''); const [newCouponType, setNewCouponType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [newCouponVal, setNewCouponVal] = useState(10); const [newCouponMinOrder, setNewCouponMinOrder] = useState(1999);
  const [newCouponMaxDisc, setNewCouponMaxDisc] = useState(1000); const [newCouponExpiry, setNewCouponExpiry] = useState('2026-12-31');
  const [queryReplyModal, setQueryReplyModal] = useState<CustomerQuery | null>(null); const [queryReplyText, setQueryReplyText] = useState('');
  const [editablePages, setEditablePages] = useState<EditablePage[]>(INITIAL_EDITABLE_PAGES); const [activePageSlug, setActivePageSlug] = useState<'terms' | 'privacy' | 'return-policy'>('terms');
  const [rewardSettings, setRewardSettings] = useState<RewardSettings>(INITIAL_REWARD_SETTINGS); const [manualWalletPhone, setManualWalletPhone] = useState('');
  const [manualWalletCoins, setManualWalletCoins] = useState(100); const [manualWalletReason, setManualWalletReason] = useState('Admin Appreciation Bonus');

  if (!isOpen) return null;
  const handleAdminLogin = (e: React.FormEvent) => { e.preventDefault(); if (adminEmail === 'admin@sareekart.com' && adminPassword === 'admin123') { setIsAdminLoggedIn(true); setLoginError(''); } else { setLoginError('Invalid credentials!'); } };
  const fillDemoAdminLogin = () => { setAdminEmail('admin@sareekart.com'); setAdminPassword('admin123'); setIsAdminLoggedIn(true); };
  const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const openAddProductModal = () => { setEditingProduct(null); setProdFormName(''); setProdFormCategory('Banarasi'); setProdFormMrp(9999); setProdFormSale(4999); setProdFormRewardPoints(250); setProdFormStock(10); setProdFormFabric('Pure Silk'); setProdFormLength('5.5m + 0.8m Blouse'); setProdFormWork('Zari Embroidery'); setProdFormWashCare('Dry Clean Only'); setProdFormPhotos(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']); setProdFormVideoUrl(''); setProdFormDescription('Handcrafted royal saree'); setProdFormArEnabled(true); setIsProductModalOpen(true); };
  const openEditProductModal = (prod: Product) => { setEditingProduct(prod); setProdFormName(prod.name); setProdFormCategory(prod.category); setProdFormMrp(prod.mrp); setProdFormSale(prod.salePrice); setProdFormRewardPoints(prod.rewardPoints || 250); setProdFormStock(prod.stockCount || 10); setProdFormFabric(prod.fabric || 'Pure Silk'); setProdFormLength(prod.length || '5.5m'); setProdFormWork(prod.work || 'Zari'); setProdFormWashCare(prod.washCare || 'Dry Clean'); setProdFormPhotos(prod.images && prod.images.length>0 ? [...prod.images] : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']); setProdFormVideoUrl(prod.videoUrl || ''); setProdFormDescription(prod.description || ''); setProdFormArEnabled(!!prod.arModelUrl); setIsProductModalOpen(true); };
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const files: File[] = Array.from(e.target.files || []); if (!files.length) return; setUploading(true); for (const file of files) { try { const localUrl = URL.createObjectURL(file); setProdFormPhotos(prev=>[...prev, localUrl]); const fileName = 'VEERANSH_'+Date.now()+'_'+sanitizeFileName(file.name); const storageRef = ref(storage, `products/${fileName}`); const uploadTask = uploadBytesResumable(storageRef, file); uploadTask.on('state_changed', (snap)=>{ if(snap.totalBytes>0) setUploadProgress((snap.bytesTransferred/snap.totalBytes)*100); }, (err)=>{ const reader=new FileReader(); reader.onload=(evt)=>{ if(evt.target?.result) setProdFormPhotos(prev=>prev.map(url=>url===localUrl?evt.target!.result as string:url)); }; reader.readAsDataURL(file); setUploading(false); }, async()=>{ const downloadURL = await getDownloadURL(uploadTask.snapshot.ref); setProdFormPhotos(prev=>prev.map(url=>url===localUrl?downloadURL:url)); setUploading(false); }); } catch { setUploading(false); } } };
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file=e.target.files?.[0]; if(!file) return; if(file.size>50*1024*1024){alert('Video <50MB'); return;} setVideoUploading(true); const localUrl=URL.createObjectURL(file); setProdFormVideoUrl(localUrl); try{ const fileName='VEERANSH_REEL_'+Date.now()+'_'+sanitizeFileName(file.name); const storageRef=ref(storage, `reels/${fileName}`); const uploadTask=uploadBytesResumable(storageRef, file); uploadTask.on('state_changed', (snap)=>{ if(snap.totalBytes>0) setVideoUploadProgress((snap.bytesTransferred/snap.totalBytes)*100); }, ()=>setVideoUploading(false), async()=>{ const downloadURL=await getDownloadURL(uploadTask.snapshot.ref); setProdFormVideoUrl(downloadURL); setVideoUploading(false); }); }catch{setVideoUploading(false);} };
  const handleSliderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file=e.target.files?.[0]; if(!file) return; setSliderUploading(true); const localUrl=URL.createObjectURL(file); setNewBannerImage(localUrl); try{ const fileName='VEERANSH_SLIDER_'+Date.now()+'_'+sanitizeFileName(file.name); const storageRef=ref(storage, `banners/slider/${fileName}`); const uploadTask=uploadBytesResumable(storageRef, file); uploadTask.on('state_changed', (snap)=>{ if(snap.totalBytes>0) setSliderUploadProgress((snap.bytesTransferred/snap.totalBytes)*100); }, ()=>setSliderUploading(false), async()=>{ const downloadURL=await getDownloadURL(uploadTask.snapshot.ref); setNewBannerImage(downloadURL); setSliderUploading(false); }); }catch{setSliderUploading(false);} };
  const handleRemovePhotoFromForm = (index: number) => { if(prodFormPhotos.length<=1){alert('At least one photo required'); return;} setProdFormPhotos(prodFormPhotos.filter((_,i)=>i!==index)); };
  const handleSaveProduct = async (e: React.FormEvent) => { e.preventDefault(); if(!prodFormName.trim()){alert('Enter name'); return;} const updatedProduct: Product = editingProduct? {...editingProduct, name:prodFormName, category:prodFormCategory, mrp:Number(prodFormMrp), salePrice:Number(prodFormSale), rewardPoints:Number(prodFormRewardPoints), stockCount:Number(prodFormStock), inStock:Number(prodFormStock)>0, fabric:prodFormFabric, work:prodFormWork, length:prodFormLength, washCare:prodFormWashCare, images:prodFormPhotos, videoUrl:prodFormVideoUrl||undefined, description:prodFormDescription, arModelUrl: prodFormArEnabled? 'https://example.com/ar.glb':undefined } : { id:`p_${Date.now()}`, name:prodFormName, category:prodFormCategory, mrp:Number(prodFormMrp), salePrice:Number(prodFormSale), rewardPoints:Number(prodFormRewardPoints), rating:4.9, reviewCount:1, images:prodFormPhotos, videoUrl:prodFormVideoUrl||undefined, arModelUrl: prodFormArEnabled? 'https://example.com/ar.glb':undefined, fabric:prodFormFabric, work:prodFormWork, blouseIncluded:true, length:prodFormLength, washCare:prodFormWashCare, description:prodFormDescription, inStock:Number(prodFormStock)>0, stockCount:Number(prodFormStock), tags:['New Arrival'] }; try{ await setDoc(doc(db, 'products', updatedProduct.id), updatedProduct, {merge:true}); }catch(err){ console.warn(err); } if(editingProduct){ onUpdateProducts(products.map(p=>p.id===editingProduct.id?updatedProduct:p)); } else { onUpdateProducts([updatedProduct,...products]); } setIsProductModalOpen(false); alert('Saved Permanently!'); };
  const handleDeleteProduct = async (id: string) => { try{ await deleteDoc(doc(db, 'products', id)); }catch{} onUpdateProducts(products.filter(p=>p.id!==id)); };

  const totalSalesAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0); const totalOrdersCount = orders.length;
  const registeredCount = customers.filter(c=>c.type==='REGISTERED').length; const guestCount = customers.filter(c=>c.type==='GUEST').length;
  const pendingOrdersCount = orders.filter(o=>['Weaving','Quality Check','Packed','Out for Delivery'].includes(o.status)).length;
  const lowStockProducts = products.filter(p=>(p.stockCount??0)<5); const mostViewedProduct = products[0]||null;
  const filteredProductsList = products.filter(p=>{ const matchesSearch=p.name.toLowerCase().includes(productSearch.toLowerCase()); const matchesCat=productCategoryFilter==='All'||p.category.toLowerCase()===productCategoryFilter.toLowerCase(); const matchesLowStock=!lowStockOnly||(p.stockCount??0)<5; return matchesSearch&&matchesCat&&matchesLowStock; });
  const filteredOrdersList = orders.filter(o=>{ const matchesStatus=orderFilter==='ALL'||o.status===orderFilter; const matchesSearch=o.id.toLowerCase().includes(orderSearchQuery.toLowerCase())||o.address.name.toLowerCase().includes(orderSearchQuery.toLowerCase()); return matchesStatus&&matchesSearch; });
  const filteredCustomersList = customers.filter(c=>c.type===customerTab);

  if (!isAdminLoggedIn) {
    return (<div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-md flex items-center justify-center p-4"><div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-xl border-2 border-amber-400"><h3 className="font-bold text-xl text-pink-950 mb-4 text-center">Admin Login</h3><form onSubmit={handleAdminLogin} className="space-y-3"><input type="email" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} placeholder="admin@sareekart.com" required className="w-full border px-3 py-2 rounded-xl text-sm" /><input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="admin123" required className="w-full border px-3 py-2 rounded-xl text-sm" /><button type="submit" className="w-full py-3 bg-[#9D174D] text-amber-300 rounded-xl font-bold">Login</button><button type="button" onClick={fillDemoAdminLogin} className="w-full text-xs text-amber-700 underline">Demo Login</button></form></div></div>);
  }

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-md flex items-center justify-center p-1 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFBF7] w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/50 my-auto flex flex-col max-h-[94vh]">
        <div className="p-3.5 bg-gradient-to-r from-[#9D174D] via-[#831843] to-amber-800 text-white flex justify-between"><div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /><span className="font-bold">{BRAND_NAME} Admin Control Center</span></div><button onClick={onClose} className="p-1.5 rounded-full bg-white/20"><X className="w-5 h-5" /></button></div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex border-b border-amber-200 bg-amber-100/60 p-2 gap-1.5 overflow-x-auto text-xs font-bold">
            {(['DASHBOARD','PRODUCTS','BANNERS','ORDERS','CUSTOMERS','MARKETING','QUERIES','PAGES','WALLET'] as const).map(t=>(
              <button key={t} onClick={()=>setActiveTab(t)} className={`px-3 py-2 rounded-xl whitespace-nowrap ${activeTab===t?'bg-[#9D174D] text-amber-300 shadow':'bg-white text-pink-950'}`}>{t}</button>
            ))}
          </div>
          <div className="p-4 overflow-y-auto space-y-6 max-h-[80vh]">
            {activeTab==='DASHBOARD' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white border-2 border-amber-300 rounded-2xl p-3.5"><p className="text-[10px] font-bold text-slate-500">Total Sales</p><p className="text-base font-extrabold">Rs.{totalSalesAmount.toLocaleString('en-IN')}</p></div>
                  <div className="bg-white border-2 border-amber-300 rounded-2xl p-3.5"><p className="text-[10px] font-bold">Total Orders</p><p className="text-base font-extrabold">{totalOrdersCount}</p></div>
                  <div className="bg-white border-2 border-amber-300 rounded-2xl p-3.5"><p className="text-[10px] font-bold">Customers</p><p className="text-base font-extrabold">{registeredCount+guestCount}</p></div>
                  <div className="bg-white border-2 border-amber-300 rounded-2xl p-3.5"><p className="text-[10px] font-bold">Pending Orders</p><p className="text-base font-extrabold">{pendingOrdersCount}</p></div>
                  <div className="bg-white border-2 border-red-300 rounded-2xl p-3.5"><p className="text-[10px] font-bold text-red-600">Low Stock</p><p className="text-base font-extrabold text-red-600">{lowStockProducts.length} Sarees</p></div>
                  <div className="bg-white border-2 border-amber-300 rounded-2xl p-3.5"><p className="text-[10px] font-bold">Bestseller</p><p className="text-xs font-bold truncate">{mostViewedProduct?.name||'Banarasi'}</p></div>
                </div>
              </div>
            )}
            {activeTab==='PRODUCTS' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-amber-300"><div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3 py-1.5"><Search className="w-4 h-4" /><input value={productSearch} onChange={e=>setProductSearch(e.target.value)} placeholder="Search sarees..." className="bg-transparent text-xs focus:outline-none" /></div><button onClick={openAddProductModal} className="px-4 py-2 bg-[#9D174D] text-amber-300 rounded-xl text-xs font-bold">+ Add New Saree</button></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{filteredProductsList.map(p=>{const mrp=Number(p.mrp??0); const sale=Number(p.salePrice??0); return (<div key={p.id} className="bg-white rounded-2xl border-2 border-amber-300 overflow-hidden shadow"><img src={p.images[0]} className="h-56 w-full object-cover" alt={p.name} /><div className="p-3"><p className="font-bold text-sm truncate">{p.name}</p><p className="text-sm font-extrabold">₹{sale.toLocaleString('en-IN')} <span className="line-through text-[10px]">₹{mrp.toLocaleString('en-IN')}</span></p><div className="flex gap-2 mt-2"><button onClick={()=>openEditProductModal(p)} className="flex-1 bg-amber-100 py-1 rounded-xl text-xs font-bold">Edit</button><button onClick={()=>handleDeleteProduct(p.id)} className="p-1.5 bg-red-100 rounded-xl"><Trash2 className="w-4 h-4 text-red-600" /></button></div></div></div>);})}</div>
              </div>
            )}
            {activeTab==='BANNERS' && (
              <div className="space-y-4">
                <div className="flex gap-2 text-xs font-bold"><button onClick={()=>setBannerSubTab('TOP_SLIDER')} className={`px-4 py-2 rounded-xl ${bannerSubTab==='TOP_SLIDER'?'bg-[#9D174D] text-amber-300':'bg-white'}`}>Top Slider</button><button onClick={()=>setBannerSubTab('CATEGORY_GALLERY')} className={`px-4 py-2 rounded-xl ${bannerSubTab==='CATEGORY_GALLERY'?'bg-[#9D174D] text-amber-300':'bg-white'}`}>Category Gallery</button><button onClick={()=>setBannerSubTab('AD_BOX')} className={`px-4 py-2 rounded-xl ${bannerSubTab==='AD_BOX'?'bg-[#9D174D] text-amber-300':'bg-white'}`}>Ad Box</button></div>
                {bannerSubTab==='TOP_SLIDER' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-4 space-y-3"><h4 className="font-bold text-sm">Add Hero Slider Banner - Image & Video Upload Working</h4><div className="grid grid-cols-3 gap-3"><input value={newBannerTitle} onChange={e=>setNewBannerTitle(e.target.value)} placeholder="Title" className="border px-3 py-2 rounded-xl text-xs" /><input value={newBannerImage} onChange={e=>setNewBannerImage(e.target.value)} placeholder="Image URL" className="border px-3 py-2 rounded-xl text-xs" /><button onClick={()=>{const b: Banner={id:`b_${Date.now()}`, title:newBannerTitle||'Royal Offer', subtitle:'Limited Offer', imageUrl:newBannerImage, tag:'NEW', targetCategory:'Banarasi', discountBadge:'DEAL', active:true}; const u=[b,...localBanners]; setLocalBanners(u); onUpdateBanners(u); setNewBannerTitle(''); setNewBannerImage('');}} className="bg-[#9D174D] text-amber-300 rounded-xl text-xs font-bold">Add Banner</button></div><label className="cursor-pointer bg-[#9D174D] text-amber-300 px-3 py-1.5 rounded-xl text-xs inline-flex gap-1"><Camera className="w-4 h-4" />Upload Image<input type="file" accept="image/*" className="hidden" onChange={handleSliderImageUpload} /></label>{newBannerImage && <img src={newBannerImage} className="w-32 h-20 object-cover rounded-xl border" />}</div>}
                {bannerSubTab==='CATEGORY_GALLERY' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5"><h4 className="font-bold text-sm">Category Gallery - Working</h4><div className="grid grid-cols-5 gap-3 mt-3">{localCategoryGallery.map(c=>(<div key={c.id} className="border rounded-2xl p-3 text-center bg-amber-50"><img src={c.imageUrl} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-amber-400" /><p className="font-bold text-xs mt-2">{c.title}</p></div>))}</div></div>}
                {bannerSubTab==='AD_BOX' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 max-w-xl space-y-3"><h4 className="font-bold text-sm">Ad Banner Box - Image Upload Working</h4><input value={localAdBanner.title} onChange={e=>setLocalAdBanner({...localAdBanner, title:e.target.value})} className="w-full border px-3 py-2 rounded-xl text-xs" placeholder="Ad Title" /><input value={localAdBanner.imageUrl} onChange={e=>setLocalAdBanner({...localAdBanner, imageUrl:e.target.value})} className="w-full border px-3 py-2 rounded-xl text-xs" placeholder="Image URL" /><button onClick={()=>{onUpdateAdBanner(localAdBanner); alert('Ad Banner Saved!');}} className="w-full bg-[#9D174D] text-amber-300 py-2 rounded-xl text-xs font-bold">Save Ad Banner</button></div>}
              </div>
            )}
            {activeTab==='ORDERS' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-4"><h4 className="font-bold">Orders Management - {filteredOrdersList.length} Orders</h4><div className="mt-3 space-y-2">{filteredOrdersList.map(o=>(<div key={o.id} className="border rounded-xl p-3 flex justify-between text-xs"><span className="font-bold">#{o.id} - {o.address.name}</span><span>₹{o.totalAmount.toLocaleString('en-IN')} - {o.status}</span></div>))}</div></div>}
            {activeTab==='CUSTOMERS' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-4"><h4 className="font-bold">Customers - {filteredCustomersList.length}</h4><div className="mt-3 space-y-2">{filteredCustomersList.map(c=>(<div key={c.id} className="border rounded-xl p-3 text-xs flex justify-between"><span className="font-bold">{c.name} - {c.phone}</span><span>🪙 {c.walletBalance} - ₹{c.totalSpend.toLocaleString('en-IN')}</span></div>))}</div></div>}
            {activeTab==='MARKETING' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5"><h4 className="font-bold">Coupons & Gifts - Working</h4><div className="grid grid-cols-3 gap-3 mt-3">{coupons.map(c=>(<div key={c.id} className="border rounded-xl p-3 bg-amber-50"><p className="font-mono font-bold text-sm">{c.code}</p><p className="text-xs">{c.discountValue}{c.discountType==='PERCENT'?'%':' Rs'} OFF</p></div>))}</div></div>}
            {activeTab==='QUERIES' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-4"><h4 className="font-bold">Support Queries - {queries.length}</h4>{queries.map(q=>(<div key={q.id} className="border rounded-xl p-3 mt-2 text-xs"><p className="font-bold">{q.userName} - {q.subject}</p><p>{q.message}</p><button onClick={()=>setQueryReplyModal(q)} className="mt-2 bg-[#9D174D] text-amber-300 px-3 py-1 rounded-lg text-xs">Reply & Resolve</button></div>))}</div>}
            {activeTab==='PAGES' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5"><h4 className="font-bold">Editable Pages</h4><textarea value={editablePages.find(p=>p.slug===activePageSlug)?.content||''} onChange={e=>setEditablePages(prev=>prev.map(p=>p.slug===activePageSlug?{...p, content:e.target.value}:p))} rows={8} className="w-full border rounded-xl p-3 text-xs mt-2"></textarea></div>}
            {activeTab==='WALLET' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 space-y-3"><h4 className="font-bold">Wallet & Rewards Config - Working</h4><div className="flex gap-2 items-center"><span className="text-xs">1 Point =</span><input type="number" value={rewardSettings.pointToRupeeRate} onChange={e=>setRewardSettings(prev=>({...prev, pointToRupeeRate:Number(e.target.value)}))} className="border px-2 py-1 rounded-xl w-20 text-xs" /><span className="text-xs">Rs</span></div></div>}
          </div>
        </div>
      </div>
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[60] bg-pink-950/80 flex items-center justify-center p-2 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-5 border-2 border-amber-500 my-auto max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="flex justify-between border-b pb-2"><h3 className="font-bold text-lg">{editingProduct?'Edit':'Add'} Saree - Photo & Video Upload Working</h3><button type="button" onClick={()=>setIsProductModalOpen(false)}><X className="w-5 h-5" /></button></div>
              <div className="grid grid-cols-2 gap-3"><input value={prodFormName} onChange={e=>setProdFormName(e.target.value)} placeholder="Product Name" required className="border px-3 py-2 rounded-xl" /><select value={prodFormCategory} onChange={e=>setProdFormCategory(e.target.value as CategoryName)} className="border px-3 py-2 rounded-xl"><option>Banarasi</option><option>Kanjivaram</option><option>Cotton</option><option>Silk</option><option>Designer</option></select></div>
              <div className="grid grid-cols-4 gap-2"><input type="number" value={prodFormMrp} onChange={e=>setProdFormMrp(Number(e.target.value))} placeholder="MRP" className="border px-3 py-2 rounded-xl" /><input type="number" value={prodFormSale} onChange={e=>setProdFormSale(Number(e.target.value))} placeholder="Sale" className="border px-3 py-2 rounded-xl" /><input type="number" value={prodFormRewardPoints} onChange={e=>setProdFormRewardPoints(Number(e.target.value))} placeholder="Points" className="border px-3 py-2 rounded-xl" /><input type="number" value={prodFormStock} onChange={e=>setProdFormStock(Number(e.target.value))} placeholder="Stock" className="border px-3 py-2 rounded-xl" /></div>
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 space-y-2">
                <label className="font-bold flex items-center gap-1"><Camera className="w-4 h-4" /> Multiple Photo Upload - Gallery Se ({prodFormPhotos.length} Photos)</label>
                <div className="grid grid-cols-6 gap-2">{prodFormPhotos.map((url,i)=>(<div key={i} className="relative rounded-xl overflow-hidden border aspect-[3/4]"><img src={url} className="w-full h-full object-cover" /><button type="button" onClick={()=>handleRemovePhotoFromForm(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"><X className="w-3 h-3" /></button></div>))}</div>
                {uploading && <div className="text-xs bg-amber-100 p-2 rounded-xl">Uploading {uploadProgress.toFixed(0)}%</div>}
                <div className="flex gap-2"><label className="cursor-pointer bg-[#9D174D] text-amber-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1"><Camera className="w-4 h-4" />Gallery Se Photo Upload<input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryUpload} /></label><input value={newPhotoUrlInput} onChange={e=>setNewPhotoUrlInput(e.target.value)} placeholder="Paste URL" className="flex-1 border px-3 py-1.5 rounded-xl" /><button type="button" onClick={()=>{if(newPhotoUrlInput.trim()){setProdFormPhotos([...prodFormPhotos, newPhotoUrlInput.trim()]); setNewPhotoUrlInput('');}}} className="bg-amber-500 px-3 py-1.5 rounded-xl font-bold">+ Add</button></div>
              </div>
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 space-y-2"><label className="font-bold flex items-center gap-1"><Video className="w-4 h-4" /> Video / Reel Upload - Gallery Se</label><button type="button" onClick={()=>videoInputRef.current?.click()} className="w-full bg-[#9D174D] text-amber-300 py-2 rounded-xl font-bold">📹 Upload Video / Reel from Gallery</button><input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={handleVideoUpload} />{videoUploading && <div className="text-xs bg-amber-100 p-2 rounded-xl">Uploading Video {videoUploadProgress.toFixed(0)}%</div>}{prodFormVideoUrl && <video src={prodFormVideoUrl} controls className="w-full h-40 rounded-xl bg-black" />}</div>
              <textarea value={prodFormDescription} onChange={e=>setProdFormDescription(e.target.value)} rows={3} placeholder="Description" className="w-full border px-3 py-2 rounded-xl"></textarea>
              <div className="flex gap-2"><button type="button" onClick={()=>setIsProductModalOpen(false)} className="flex-1 bg-slate-100 py-2 rounded-xl font-bold">Cancel</button><button type="submit" className="flex-1 bg-[#9D174D] text-amber-300 py-2 rounded-xl font-bold">Publish Product</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
