import React, { useState, useRef } from 'react';
import { Product, Banner, AdBanner, CustomerQuery, Order, OrderStatus, CategoryName, Coupon, CustomerRecord, CategoryGalleryItem, CustomerGift, EditablePage, RewardSettings } from '../types';
import {
  X, ShieldCheck, Edit, Edit3, Plus, Trash2, CheckCircle, Package, Image as ImageIcon, Sparkles,
  AlertCircle, Truck, MapPin, UserCheck, RefreshCw, ChevronRight, ChevronLeft, Search, DollarSign,
  Users, ShoppingCart, BarChart3, Tag, Gift, FileText, Wallet, Lock, LogOut, Check,
  Camera, Video, ArrowUpRight, Award, Printer, Clock, HelpCircle, Eye, UploadCloud, Download, Loader2, Zap, Sliders
} from 'lucide-react';
import { INITIAL_COUPONS, INITIAL_CUSTOMERS, INITIAL_CATEGORY_GALLERY, INITIAL_GIFTS, INITIAL_EDITABLE_PAGES, INITIAL_REWARD_SETTINGS } from '../data/initialData';
import { db, storage } from '../lib/firebase';
import { doc, deleteDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { BRAND_NAME } from '../constants';
import BulkSaleUploader from './BulkSaleUploader';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  banners: Banner[];
  adBanner: AdBanner;
  queries: CustomerQuery[];
  orders?: Order[];
  showFlashSaleAlert?: boolean;
  onToggleFlashSaleAlert?: (show: boolean) => void;
  onUpdateBanners: (banners: Banner[]) => void;
  onUpdateAdBanner: (ad: AdBanner) => void;
  onUpdateProducts: (products: Product[]) => void;
  onResolveQuery: (id: string, replyText?: string) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus, note?: string, location?: string, courierName?: string, trackingId?: string, dispatchDate?: string) => void;
  onOpenOrderTracker?: (order: Order) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen, onClose, products, banners, adBanner, queries, orders = [], showFlashSaleAlert = false, onToggleFlashSaleAlert, onUpdateBanners, onUpdateAdBanner, onUpdateProducts, onResolveQuery, onUpdateOrderStatus, onOpenOrderTracker,
}) => {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PRODUCTS' | 'BANNERS' | 'ORDERS' | 'CUSTOMERS' | 'MARKETING' | 'QUERIES' | 'PAGES' | 'WALLET' | 'BULK_SALE'>('DASHBOARD');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [catalogViewMode, setCatalogViewMode] = useState<'SLIDER' | 'TABLE'>('SLIDER');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductConfirmId, setDeleteProductConfirmId] = useState<string | null>(null);
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);
  const [bulkFilesMap, setBulkFilesMap] = useState<Map<string, File>>(new Map());
  const [bulkPreviewRows, setBulkPreviewRows] = useState<any[]>([]);
  const [bulkTotalCsvRows, setBulkTotalCsvRows] = useState(0);
  const [bulkTotalImagesCount, setBulkTotalImagesCount] = useState(0);
  const [bulkTotalVideosCount, setBulkTotalVideosCount] = useState(0);
  const [bulkGlobalMrp, setBulkGlobalMrp] = useState<string>('');
  const [bulkGlobalSale, setBulkGlobalSale] = useState<string>('');
  const [bulkGlobalCategory, setBulkGlobalCategory] = useState<CategoryName | ''>('');
  const [bulkGlobalStock, setBulkGlobalStock] = useState<string>('');
  const [bulkIsUploading, setBulkIsUploading] = useState(false);
  const [bulkProgressImagesUploaded, setBulkProgressImagesUploaded] = useState(0);
  const [bulkProgressTotalImages, setBulkProgressTotalImages] = useState(0);
  const [bulkProgressProductsCreated, setBulkProgressProductsCreated] = useState(0);
  const [bulkProgressTotalProducts, setBulkProgressTotalProducts] = useState(0);
  const [bulkSuccessCount, setBulkSuccessCount] = useState(0);
  const [bulkFailedCount, setBulkFailedCount] = useState(0);
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState<CategoryName>('Banarasi');
  const [prodFormMrp, setProdFormMrp] = useState(9999);
  const [prodFormSale, setProdFormSale] = useState(4999);
  const [prodFormRewardPoints, setProdFormRewardPoints] = useState(250);
  const [prodFormStock, setProdFormStock] = useState(10);
  const [prodFormSku, setProdFormSku] = useState('SK-BAN-001');
  const [prodFormFabric, setProdFormFabric] = useState('Pure Katan Silk');
  const [prodFormBlouseFabric, setProdFormBlouseFabric] = useState('Unstitched Zari Brocade');
  const [prodFormLength, setProdFormLength] = useState('5.5m + 0.8m Blouse');
  const [prodFormWork, setProdFormWork] = useState('24k Gold Zari Weave');
  const [prodFormWashCare, setProdFormWashCare] = useState('Dry Clean Only');
  const [prodFormColors, setProdFormColors] = useState<string[]>(['Red', 'Gold']);
  const [prodFormPhotos, setProdFormPhotos] = useState<string[]>(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']);
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState('');
  const [prodFormVideoUrl, setProdFormVideoUrl] = useState('');
  const [prodFormDescription, setProdFormDescription] = useState('Handcrafted royal Indian saree with authentic Silk Mark certification.');
  const [prodFormArEnabled, setProdFormArEnabled] = useState(true);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const sliderImageInputRef = useRef<HTMLInputElement>(null);
  const [sliderUploading, setSliderUploading] = useState(false);
  const [sliderUploadProgress, setSliderUploadProgress] = useState(0);
  const [sliderVideoUrl, setSliderVideoUrl] = useState('');
  const [sliderVideoUploading, setSliderVideoUploading] = useState(false);
  const [catUploading, setCatUploading] = useState(false);
  const [catUploadProgress, setCatUploadProgress] = useState(0);
  const [adUploading, setAdUploading] = useState(false);
  const [adUploadProgress, setAdUploadProgress] = useState(0);
  const [adVideoUploading, setAdVideoUploading] = useState(false);
  const [adVideoUploadProgress, setAdVideoUploadProgress] = useState(0);
  const [bannerSubTab, setBannerSubTab] = useState<'TOP_SLIDER' | 'CATEGORY_GALLERY' | 'AD_BOX'>('TOP_SLIDER');
  const [localBanners, setLocalBanners] = useState<Banner[]>(banners);
  const [localCategoryGallery, setLocalCategoryGallery] = useState<CategoryGalleryItem[]>(INITIAL_CATEGORY_GALLERY);
  const [localAdBanner, setLocalAdBanner] = useState<AdBanner>(adBanner);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerCategory, setNewBannerCategory] = useState('Banarasi');
  const [newBannerCountdown, setNewBannerCountdown] = useState('2026-08-15T23:59');
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [dispatchCourierName, setDispatchCourierName] = useState('BlueDart Express');
  const [dispatchTrackingId, setDispatchTrackingId] = useState('');
  const [dispatchDateVal, setDispatchDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [customerTab, setCustomerTab] = useState<'REGISTERED' | 'GUEST'>('REGISTERED');
  const [customers, setCustomers] = useState<CustomerRecord[]>(INITIAL_CUSTOMERS);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<CustomerRecord | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [gifts, setGifts] = useState<CustomerGift[]>(INITIAL_GIFTS);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [newCouponVal, setNewCouponVal] = useState(10);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState(1999);
  const [newCouponMaxDisc, setNewCouponMaxDisc] = useState(1000);
  const [newCouponExpiry, setNewCouponExpiry] = useState('2026-12-31');
  const [queryReplyModal, setQueryReplyModal] = useState<CustomerQuery | null>(null);
  const [queryReplyText, setQueryReplyText] = useState('');
  const [editablePages, setEditablePages] = useState<EditablePage[]>(INITIAL_EDITABLE_PAGES);
  const [activePageSlug, setActivePageSlug] = useState<'terms' | 'privacy' | 'return-policy'>('terms');
  const [rewardSettings, setRewardSettings] = useState<RewardSettings>(INITIAL_REWARD_SETTINGS);
  const [manualWalletPhone, setManualWalletPhone] = useState('');
  const [manualWalletCoins, setManualWalletCoins] = useState(100);
  const [manualWalletReason, setManualWalletReason] = useState('Admin Appreciation Bonus');

  if (!isOpen) return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === 'admin@sareekart.com' && adminPassword === 'admin123') {
      setIsAdminLoggedIn(true); setLoginError('');
    } else { setLoginError('Invalid credentials! Use admin@sareekart.com / admin123'); }
  };
  const fillDemoAdminLogin = () => { setAdminEmail('admin@sareekart.com'); setAdminPassword('admin123'); setIsAdminLoggedIn(true); setLoginError(''); };

  const openAddProductModal = () => {
    setEditingProduct(null); setProdFormName(''); setProdFormCategory('Banarasi'); setProdFormMrp(9999); setProdFormSale(4999); setProdFormRewardPoints(250); setProdFormStock(10);
    setProdFormSku(`SK-${Date.now().toString().slice(-4)}`); setProdFormFabric('Pure Silk'); setProdFormBlouseFabric('Unstitched Zari Brocade'); setProdFormLength('5.5m + 0.8m Blouse');
    setProdFormWork('Zari Embroidery'); setProdFormWashCare('Dry Clean Only'); setProdFormColors(['Red', 'Gold']);
    setProdFormPhotos(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']); setProdFormVideoUrl(''); setProdFormDescription('Handcrafted royal Indian saree woven with pure zari threads.'); setProdFormArEnabled(true); setIsProductModalOpen(true);
  };
  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod); setProdFormName(prod.name); setProdFormCategory(prod.category); setProdFormMrp(prod.mrp); setProdFormSale(prod.salePrice); setProdFormRewardPoints(prod.rewardPoints || 250); setProdFormStock(prod.stockCount || 10);
    setProdFormSku(`SK-${prod.id.toUpperCase()}`); setProdFormFabric(prod.fabric || 'Pure Silk'); setProdFormBlouseFabric('Unstitched Zari Brocade'); setProdFormLength(prod.length || '5.5m + 0.8m Blouse');
    setProdFormWork(prod.work || 'Zari Embroidery'); setProdFormWashCare(prod.washCare || 'Dry Clean Only'); setProdFormColors(['Red', 'Gold']);
    setProdFormPhotos(prod.images && prod.images.length > 0? [...prod.images] : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']); setProdFormVideoUrl(prod.videoUrl || ''); setProdFormDescription(prod.description || ''); setProdFormArEnabled(!!prod.arModelUrl); setIsProductModalOpen(true);
  };
  const handleAddPhotoToForm = () => { if (!newPhotoUrlInput.trim()) return; setProdFormPhotos([...prodFormPhotos, newPhotoUrlInput.trim()]); setNewPhotoUrlInput(''); };
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []); if (!files.length) return; setUploading(true);
    for (const file of files) {
      try {
        const localUrl = URL.createObjectURL(file); setProdFormPhotos((prev) => [...prev, localUrl]);
        const fileName = `VEERANSH_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; const storageRef = ref(storage, `products/${fileName}`); const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed', (s) => { if (s.totalBytes > 0) setUploadProgress((s.bytesTransferred / s.totalBytes) * 100); }, () => { setUploading(false); setUploadProgress(0); }, async () => { const url = await getDownloadURL(uploadTask.snapshot.ref); setProdFormPhotos((prev) => prev.map((u) => (u === localUrl? url : u))); setUploading(false); setUploadProgress(0); });
      } catch (err) { setUploading(false); }
    }
  };
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setVideoUploading(true); const localUrl = URL.createObjectURL(file); setProdFormVideoUrl(localUrl);
    try { const fileName = `VEERANSH_REEL_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; const storageRef = ref(storage, `reels/${fileName}`); const uploadTask = uploadBytesResumable(storageRef, file); uploadTask.on('state_changed', (s) => { if (s.totalBytes > 0) setVideoUploadProgress((s.bytesTransferred / s.totalBytes) * 100); }, () => setVideoUploading(false), async () => { const url = await getDownloadURL(uploadTask.snapshot.ref); setProdFormVideoUrl(url); setVideoUploading(false); }); } catch (err) { setVideoUploading(false); }
  };
  const handleSliderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setSliderUploading(true); const localUrl = URL.createObjectURL(file); setNewBannerImage(localUrl);
    try { const fileName = `VEERANSH_SLIDER_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; const storageRef = ref(storage, `banners/slider/${fileName}`); const uploadTask = uploadBytesResumable(storageRef, file); uploadTask.on('state_changed', (s) => { if (s.totalBytes > 0) setSliderUploadProgress((s.bytesTransferred / s.totalBytes) * 100); }, () => setSliderUploading(false), async () => { const url = await getDownloadURL(uploadTask.snapshot.ref); setNewBannerImage(url); setSliderUploading(false); }); } catch (err) { setSliderUploading(false); }
  };
  const handleSliderVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setSliderVideoUploading(true); const localUrl = URL.createObjectURL(file); setSliderVideoUrl(localUrl);
    try { const fileName = `VEERANSH_SLIDER_VID_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; const storageRef = ref(storage, `banners/slider/${fileName}`); const uploadTask = uploadBytesResumable(storageRef, file); uploadTask.on('state_changed', () => {}, () => setSliderVideoUploading(false), async () => { const url = await getDownloadURL(uploadTask.snapshot.ref); setSliderVideoUrl(url); setSliderVideoUploading(false); }); } catch (err) { setSliderVideoUploading(false); }
  };
  const handleCategoryGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setCatUploading(true); const inputEl = document.getElementById('new-cat-image') as HTMLInputElement; const localUrl = URL.createObjectURL(file); if (inputEl) inputEl.value = localUrl;
    try { const fileName = `VEERANSH_CAT_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; const storageRef = ref(storage, `banners/category/${fileName}`); const uploadTask = uploadBytesResumable(storageRef, file); uploadTask.on('state_changed', (s) => { if (s.totalBytes > 0) setCatUploadProgress((s.bytesTransferred / s.totalBytes) * 100); }, () => setCatUploading(false), async () => { const url = await getDownloadURL(uploadTask.snapshot.ref); if (inputEl) inputEl.value = url; setCatUploading(false); }); } catch (err) { setCatUploading(false); }
  };
  const handleAdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setAdUploading(true); const localUrl = URL.createObjectURL(file); setLocalAdBanner((prev) => ({...prev, imageUrl: localUrl }));
    try { const fileName = `VEERANSH_AD_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; const storageRef = ref(storage, `banners/ad/${fileName}`); const uploadTask = uploadBytesResumable(storageRef, file); uploadTask.on('state_changed', (s) => { if (s.totalBytes > 0) setAdUploadProgress((s.bytesTransferred / s.totalBytes) * 100); }, () => setAdUploading(false), async () => { const url = await getDownloadURL(uploadTask.snapshot.ref); setLocalAdBanner((prev) => ({...prev, imageUrl: url })); setAdUploading(false); }); } catch (err) { setAdUploading(false); }
  };
  const handleAdVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setAdVideoUploading(true); const localUrl = URL.createObjectURL(file); setLocalAdBanner((prev) => ({...prev, videoUrl: localUrl }));
    try { const fileName = `VEERANSH_AD_VIDEO_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; const storageRef = ref(storage, `banners/ad/${fileName}`); const uploadTask = uploadBytesResumable(storageRef, file); uploadTask.on('state_changed', (s) => { if (s.totalBytes > 0) setAdVideoUploadProgress((s.bytesTransferred / s.totalBytes) * 100); }, () => setAdVideoUploading(false), async () => { const url = await getDownloadURL(uploadTask.snapshot.ref); setLocalAdBanner((prev) => ({...prev, videoUrl: url })); setAdVideoUploading(false); }); } catch (err) { setAdVideoUploading(false); }
  };
  const handleRemovePhotoFromForm = (index: number) => { if (prodFormPhotos.length <= 1) { alert('At least one product photo is required.'); return; } const nextPhotos = prodFormPhotos.filter((_, i) => i!== index); setProdFormPhotos(nextPhotos); if (editingProduct) { try { setDoc(doc(db, 'products', editingProduct.id), { images: nextPhotos }, { merge: true }); } catch (err) {} } };
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); if (!prodFormName.trim()) { alert('Please enter a product name'); return; }
    if (editingProduct) {
      const updatedProduct: Product = {...editingProduct, name: prodFormName, category: prodFormCategory, mrp: Number(prodFormMrp), salePrice: Number(prodFormSale), rewardPoints: Number(prodFormRewardPoints), stockCount: Number(prodFormStock), inStock: Number(prodFormStock) > 0, fabric: prodFormFabric, work: prodFormWork, length: prodFormLength, washCare: prodFormWashCare, images: prodFormPhotos, videoUrl: prodFormVideoUrl || undefined, description: prodFormDescription, arModelUrl: prodFormArEnabled? 'https://example.com/ar-saree-model.glb' : undefined, };
      try { await setDoc(doc(db, 'products', editingProduct.id), updatedProduct, { merge: true }); } catch (err) {}
      const updatedList = products.map((p) => (p.id === editingProduct.id? updatedProduct : p)); onUpdateProducts(updatedList); setIsProductModalOpen(false); alert('Saved Permanently!');
    } else {
      const newProd: Product = { id: `p_${Date.now()}`, name: prodFormName, category: prodFormCategory, mrp: Number(prodFormMrp), salePrice: Number(prodFormSale), rewardPoints: Number(prodFormRewardPoints), rating: 4.9, reviewCount: 1, images: prodFormPhotos, videoUrl: prodFormVideoUrl || undefined, arModelUrl: prodFormArEnabled? 'https://example.com/ar-saree-model.glb' : undefined, fabric: prodFormFabric, work: prodFormWork, blouseIncluded: true, length: prodFormLength, washCare: prodFormWashCare, description: prodFormDescription, inStock: Number(prodFormStock) > 0, stockCount: Number(prodFormStock), tags: ['New Arrival'], };
      try { await setDoc(doc(db, 'products', newProd.id), newProd); } catch (err) {}
      onUpdateProducts([newProd,...products]); setIsProductModalOpen(false); alert('Saved Permanently!');
    }
    setIsProductModalOpen(false);
  };
  const handleDeleteProduct = async (id: string) => { try { await deleteDoc(doc(db, 'products', id)); } catch (err) {} const updated = products.filter((p) => p.id!== id); onUpdateProducts(updated); setDeleteProductConfirmId(null); alert('Deleted'); };
  const parseCsvText = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim()!== ''); if (lines.length <= 1) return [];
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '')); const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const rawLine = lines[i]; if (!rawLine.trim()) continue; const values: string[] = []; let insideQuotes = false; let currentValue = '';
      for (let c = 0; c < rawLine.length; c++) { const char = rawLine[c]; if (char === '"') { insideQuotes =!insideQuotes; } else if (char === ',' &&!insideQuotes) { values.push(currentValue.trim().replace(/^"|"$/g, '')); currentValue = ''; } else { currentValue += char; } }
      values.push(currentValue.trim().replace(/^"|"$/g, '')); const rowObj: Record<string, string> = {}; headers.forEach((h, idx) => { rowObj[h] = values[idx] || ''; });
      rows.push({ productName: rowObj['productName'] || `Royal Saree #${i}`, category: (rowObj['category'] as CategoryName) || 'Banarasi', mrp: Number(rowObj['mrp']) || 9999, salePrice: Number(rowObj['salePrice']) || 4999, rewardPoints: Number(rowObj['rewardPoints']) || 250, stock: Number(rowObj['stock']) || 15, fabric: rowObj['fabric'] || 'Pure Katan Silk', blouseFabric: rowObj['blouseFabric'] || 'Running Blouse Piece', length: rowObj['length'] || '6.3m', colors: rowObj['colors'] || 'Royal Red, Gold', work: rowObj['work'] || 'Heavy Gold Zari Weave', washCare: rowObj['washCare'] || 'Dry Clean Only', description: rowObj['description'] || 'Traditional handloom saree.', enableAR: rowObj['enableAR']?.toUpperCase() === 'TRUE', imageFileNames: (rowObj['imageFileNames'] || '').split('|').map((img: string) => img.trim()).filter(Boolean), videoFileName: rowObj['videoFileName']?.trim() || undefined, });
    } return rows;
  };
  const handleDownloadCsvTemplate = () => {
    const headers = "productName,category,mrp,salePrice,rewardPoints,stock,fabric,blouseFabric,length,colors,work,washCare,description,enableAR,imageFileNames,videoFileName";
    const sample1 = '"Royal Red Banarasi Katan Zari","Banarasi","14999","5999","300","15","Katan Silk","Blouse Running","6.3m","Red-Gold","Zari Work","Dry Wash","Traditional wedding Banarasi","TRUE","banarasi_red_01.jpg|banarasi_red_02.jpg","banarasi_red_reel.mp4"';
    const csvContent = "data:text/csv;charset=utf-8," + [headers, sample1].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "veeransh_sarees_bulk_upload_template.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setBulkCsvFile(file); const reader = new FileReader(); reader.onload = (evt) => { const text = evt.target?.result as string; if (text) { const parsed = parseCsvText(text); setBulkPreviewRows(parsed); setBulkTotalCsvRows(parsed.length); } }; reader.readAsText(file);
  };
  const handleMediaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = Array.from(e.target.files || []); if (!filesList.length) return; const newMap = new Map<string, File>(bulkFilesMap); let imgCount = 0; let vidCount = 0;
    filesList.forEach((file) => { newMap.set(file.name.toLowerCase(), file); if (file.type.startsWith('image/')) imgCount++; if (file.type.startsWith('video/')) vidCount++; });
    setBulkFilesMap(newMap); setBulkTotalImagesCount((prev) => prev + imgCount); setBulkTotalVideosCount((prev) => prev + vidCount);
  };
  const handleStartMegaUpload = async () => {
    if (bulkPreviewRows.length === 0) { alert('Please upload a valid CSV file first.'); return; }
    setBulkIsUploading(true); setBulkSuccessCount(0); setBulkFailedCount(0);
    const totalImgFiles = bulkPreviewRows.reduce((sum, r) => sum + r.imageFileNames.length, 0);
    setBulkProgressTotalImages(totalImgFiles); setBulkProgressTotalProducts(bulkPreviewRows.length); setBulkProgressImagesUploaded(0); setBulkProgressProductsCreated(0);
    const CHUNK_SIZE = 20; const newCreatedProducts: Product[] = [];
    for (let i = 0; i < bulkPreviewRows.length; i += CHUNK_SIZE) {
      const chunk = bulkPreviewRows.slice(i, i + CHUNK_SIZE);
      for (const row of chunk) {
        try {
          const uploadedImageUrls: string[] = [];
          for (const fileName of row.imageFileNames) {
            const fileObj = bulkFilesMap.get(fileName.toLowerCase());
            if (fileObj) { try { const sRef = ref(storage, `bulk-sale-2026/${Date.now()}_${fileObj.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`); const snap = await uploadBytesResumable(sRef, fileObj); const url = await getDownloadURL(snap.ref); uploadedImageUrls.push(url); } catch (err) { uploadedImageUrls.push('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'); } }
            else { uploadedImageUrls.push('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'); }
            setBulkProgressImagesUploaded((prev) => prev + 1);
          }
          let uploadedVideoUrl: string | undefined = undefined;
          if (row.videoFileName) {
            const videoObj = bulkFilesMap.get(row.videoFileName.toLowerCase());
            if (videoObj) { try { const vRef = ref(storage, `bulk-sale-videos/${Date.now()}_${videoObj.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`); const snap = await uploadBytesResumable(vRef, videoObj); uploadedVideoUrl = await getDownloadURL(snap.ref); } catch (err) {} }
          }
          const prodId = `p_bulk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const newProd: Product = { id: prodId, name: row.productName, category: row.category, mrp: row.mrp, salePrice: row.salePrice, rewardPoints: row.rewardPoints, rating: 4.9, reviewCount: 1, images: uploadedImageUrls.length > 0? uploadedImageUrls : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'], videoUrl: uploadedVideoUrl, arModelUrl: row.enableAR? 'https://example.com/ar-saree-model.glb' : undefined, fabric: row.fabric, work: row.work, blouseIncluded: true, length: row.length, washCare: row.washCare, description: row.description, inStock: row.stock > 0, stockCount: row.stock, tags: ['MEGA SALE', 'New Arrival'], isBulkSale: true, saleTag: 'MEGA SALE', };
          try { await addDoc(collection(db, 'products'), newProd); } catch (err) {}
          newCreatedProducts.push(newProd); setBulkSuccessCount((prev) => prev + 1);
        } catch (err) { setBulkFailedCount((prev) => prev + 1); }
        setBulkProgressProductsCreated((prev) => prev + 1);
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    setBulkIsUploading(false); onUpdateProducts([...newCreatedProducts,...products]); alert(`${newCreatedProducts.length} Sarees Uploaded Successfully!`);
  };

  const totalSalesAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersCount = orders.length;
  const registeredCount = customers.filter((c) => c.type === 'REGISTERED').length;
  const guestCount = customers.filter((c) => c.type === 'GUEST').length;
  const pendingOrdersCount = orders.filter((o) => ['Weaving', 'Quality Check', 'Packed', 'Out for Delivery'].includes(o.status)).length;
  const lowStockProducts = products.filter((p) => (p.stockCount?? 0) < 5);
  const mostViewedProduct = products[0] || null;
  const filteredProductsList = products.filter((p) => { const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()); const matchesCat = productCategoryFilter === 'All' || p.category.toLowerCase() === productCategoryFilter.toLowerCase(); const matchesLowStock =!lowStockOnly || (p.stockCount?? 0) < 5; return matchesSearch && matchesCat && matchesLowStock; });
  const filteredOrdersList = orders.filter((o) => { const matchesStatus = orderFilter === 'ALL' || o.status === orderFilter; const matchesSearch = o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || o.address.name.toLowerCase().includes(orderSearchQuery.toLowerCase()) || o.address.phone.includes(orderSearchQuery); return matchesStatus && matchesSearch; });
  const filteredCustomersList = customers.filter((c) => c.type === customerTab);

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-md flex items-center justify-center p-1 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFBF7] w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/50 my-auto flex flex-col relative max-h-[94vh]">
        <div className="p-3.5 bg-gradient-to-r from-[#9D174D] via-[#831843] to-amber-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-pink-950 font-bold shadow"><ShieldCheck className="w-5 h-5 text-pink-950" /></div><div><h2 className="font-serif-royal text-lg font-bold text-white flex items-center gap-2 leading-tight">{BRAND_NAME} Admin Control Center<span className="bg-amber-400 text-pink-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Super Admin</span></h2><p className="text-[11px] text-amber-200">Real-Time Inventory, Orders, Customers & Marketing Portal</p></div></div>
          <div className="flex items-center gap-2">{isAdminLoggedIn && <button onClick={() => setIsAdminLoggedIn(false)} className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-bold flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Logout</button>}<button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"><X className="w-5 h-5" /></button></div>
        </div>
        {!isAdminLoggedIn? (
          <div className="p-6 sm:p-12 flex flex-col items-center justify-center bg-gradient-to-b from-[#FDFBF7] to-amber-50/50 my-auto">
            <div className="w-full max-w-md bg-white border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#9D174D] via-amber-500 to-[#9D174D]" />
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-300"><Lock className="w-8 h-8 text-[#9D174D]" /></div>
              <h3 className="font-serif-royal text-xl font-bold text-pink-950 mb-1">Admin Security Verification</h3>
              <p className="text-xs text-slate-500 mb-6">Enter official {BRAND_NAME} credentials</p>
              {loginError && <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center justify-center gap-1.5"><AlertCircle className="w-4 h-4" /><span>{loginError}</span></div>}
              <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                <div><label className="block text-xs font-bold text-pink-950 mb-1">Admin Email</label><input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@sareekart.com" required className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-pink-800 text-xs bg-amber-50/30" /></div>
                <div><label className="block text-xs font-bold text-pink-950 mb-1">Admin Password</label><input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" required className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-pink-800 text-xs bg-amber-50/30" /></div>
                <button type="submit" className="w-full py-3 bg-[#9D174D] hover:bg-pink-900 text-amber-300 font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4" /> Authenticate & Open Dashboard</button>
                <div className="pt-2 text-center"><button type="button" onClick={fillDemoAdminLogin} className="text-xs font-bold text-amber-700 underline bg-amber-100/80 px-3 py-1.5 rounded-full border border-amber-300">✨ Click for Demo One-Tap Login</button></div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* 100% FIXED NAVIGATION - NO SYNTAX ERROR */}
            <div className="flex border-b border-amber-200 bg-amber-100/60 p-2 gap-1.5 overflow-x-auto text-xs font-bold shrink-0">
              <button onClick={() => setActiveTab('DASHBOARD')} className={activeTab === 'DASHBOARD'? 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-[#9D174D] text-amber-300 shadow' : 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-white text-pink-950 hover:bg-amber-200/80'}><BarChart3 className="w-4 h-4" /> Dashboard</button>
              <button onClick={() => setActiveTab('PRODUCTS')} className={activeTab === 'PRODUCTS'? 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-[#9D174D] text-amber-300 shadow' : 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-white text-pink-950 hover:bg-amber-200/80'}><Package className="w-4 h-4" /> Catalog ({products.length})</button>
              <button onClick={() => setActiveTab('BULK_SALE')} className={activeTab === 'BULK_SALE'? 'px-3.5 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap font-black border border-amber-400 bg-gradient-to-r from-[#9D174D] to-purple-900 text-amber-300 shadow-lg scale-105' : 'px-3.5 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap font-black border border-amber-400 bg-amber-200 text-[#9D174D] hover:bg-amber-300'}><UploadCloud className="w-4 h-4 animate-bounce" /> Bulk Sale Upload (1000s)</button>
              <button onClick={() => setActiveTab('BANNERS')} className={activeTab === 'BANNERS'? 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-[#9D174D] text-amber-300 shadow' : 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-white text-pink-950 hover:bg-amber-200/80'}><ImageIcon className="w-4 h-4" /> Banners</button>
              <button onClick={() => setActiveTab('ORDERS')} className={activeTab === 'ORDERS'? 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-[#9D174D] text-amber-300 shadow' : 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-white text-pink-950 hover:bg-amber-200/80'}><Truck className="w-4 h-4" /> Orders ({orders.length})</button>
              <button onClick={() => setActiveTab('CUSTOMERS')} className={activeTab === 'CUSTOMERS'? 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-[#9D174D] text-amber-300 shadow' : 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-white text-pink-950 hover:bg-amber-200/80'}><Users className="w-4 h-4" /> Customers</button>
              <button onClick={() => setActiveTab('MARKETING')} className={activeTab === 'MARKETING'? 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-[#9D174D] text-amber-300 shadow' : 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-white text-pink-950 hover:bg-amber-200/80'}><Tag className="w-4 h-4" /> Coupons</button>
              <button onClick={() => setActiveTab('QUERIES')} className={activeTab === 'QUERIES'? 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-[#9D174D] text-amber-300 shadow' : 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-white text-pink-950 hover:bg-amber-200/80'}><HelpCircle className="w-4 h-4" /> Support</button>
              <button onClick={() => setActiveTab('PAGES')} className={activeTab === 'PAGES'? 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-[#9D174D] text-amber-300 shadow' : 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-white text-pink-950 hover:bg-amber-200/80'}><FileText className="w-4 h-4" /> Policies</button>
              <button onClick={() => setActiveTab('WALLET')} className={activeTab === 'WALLET'? 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-[#9D174D] text-amber-300 shadow' : 'px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap bg-white text-pink-950 hover:bg-amber-200/80'}><Wallet className="w-4 h-4" /> Rewards</button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-130px)] space-y-6">
              {activeTab === 'DASHBOARD' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-sm"><div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-slate-500 uppercase">Total Sales</span><div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">₹</div></div><p className="text-base font-extrabold text-pink-950">₹{totalSalesAmount.toLocaleString('en-IN')}</p></div>
                    <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-sm"><div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-slate-500 uppercase">Total Orders</span><div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center"><ShoppingCart className="w-3.5 h-3.5" /></div></div><p className="text-base font-extrabold text-pink-950">{totalOrdersCount}</p></div>
                    <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-sm"><div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-slate-500 uppercase">Customers</span><div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center"><Users className="w-3.5 h-3.5" /></div></div><p className="text-base font-extrabold text-pink-950">{registeredCount + guestCount}</p></div>
                    <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-sm"><div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-slate-500 uppercase">Pending</span><div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center"><Clock className="w-3.5 h-3.5" /></div></div><p className="text-base font-extrabold text-amber-700">{pendingOrdersCount}</p></div>
                    <div className="bg-white border-2 border-red-300/80 rounded-2xl p-3.5 shadow-sm"><div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-red-600 uppercase">Low Stock</span><div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center"><AlertCircle className="w-3.5 h-3.5" /></div></div><p className="text-base font-extrabold text-red-600">{lowStockProducts.length}</p></div>
                    <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-sm"><div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-slate-500 uppercase">Top Product</span><div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center"><Award className="w-3.5 h-3.5" /></div></div><p className="text-xs font-bold text-pink-950 truncate">{mostViewedProduct?.name}</p></div>
                  </div>
                </div>
              )}
              {activeTab === 'PRODUCTS' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5"><h3 className="font-bold text-pink-950">Catalog - {filteredProductsList.length} Sarees</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">{filteredProductsList.slice(0,8).map(p => <div key={p.id} className="border border-amber-200 rounded-xl p-2"><img src={p.images[0]} className="w-full h-24 object-cover rounded-lg" /><p className="text-xs font-bold mt-1 truncate">{p.name}</p><p className="text-xs text-pink-900 font-extrabold">₹{p.salePrice}</p></div>)}</div></div>}
              {activeTab === 'BULK_SALE' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-[#9D174D] via-purple-900 to-pink-950 p-5 rounded-3xl text-amber-300 border-2 border-amber-400"><h2 className="text-2xl font-bold">Bulk Saree Uploader — 1000s Sarees MEGA SALE</h2><p className="text-xs text-amber-100/90">CSV + Photos folder, 20-product chunks</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 space-y-3"><h3 className="font-bold text-pink-950">1. CSV Catalog</h3><button onClick={handleDownloadCsvTemplate} className="w-full py-2.5 bg-amber-100 text-[#9D174D] font-bold text-xs rounded-xl border border-amber-300 flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download Template</button><input type="file" accept=".csv" onChange={handleCsvFileChange} className="w-full text-xs" />{bulkCsvFile && <div className="bg-emerald-50 border border-emerald-300 p-2 rounded-xl text-xs font-bold">{bulkCsvFile.name} - {bulkTotalCsvRows} Sarees</div>}</div>
                    <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 space-y-3"><h3 className="font-bold text-pink-950">2. Photos Folder</h3><input type="file" /* @ts-ignore */ webkitdirectory="true" directory="" multiple onChange={handleMediaFilesChange} className="w-full text-xs" /><div className="bg-amber-50 border border-amber-300 p-2 rounded-xl text-xs font-bold">Files: {bulkFilesMap.size} | Images: {bulkTotalImagesCount}</div></div>
                    <div className="bg-gradient-to-br from-amber-100 to-pink-100 border-2 border-amber-400 rounded-3xl p-5 space-y-3"><h3 className="font-bold text-pink-950">3. Launch Upload</h3><button onClick={handleStartMegaUpload} disabled={bulkIsUploading || bulkPreviewRows.length === 0} className={`w-full py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 ${bulkIsUploading || bulkPreviewRows.length === 0? 'bg-slate-300 text-slate-500' : 'bg-gradient-to-r from-[#9D174D] to-purple-900 text-amber-300'}`}>{bulkIsUploading? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : <><Zap className="w-5 h-5" /> START UPLOAD</>}</button><div className="text-xs font-bold">Ready: {bulkPreviewRows.length} Sarees</div></div>
                  </div>
                  {bulkIsUploading && <div className="bg-pink-950 text-amber-300 border-2 border-amber-400 p-6 rounded-3xl"><div className="flex justify-between font-bold"><span>Uploading {bulkProgressImagesUploaded}/{bulkProgressTotalImages} Images</span><span>{bulkProgressProductsCreated}/{bulkProgressTotalProducts} Products</span></div><div className="w-full bg-pink-900 rounded-full h-3 mt-2"><div className="bg-amber-400 h-full" style={{ width: `${bulkProgressTotalProducts > 0? (bulkProgressProductsCreated / bulkProgressTotalProducts) * 100 : 0}%` }} /></div></div>}
                  <BulkSaleUploader />
                </div>
              )}
              {activeTab === 'BANNERS' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 font-bold text-pink-950">Banners Management - {localBanners.length} Banners</div>}
              {activeTab === 'ORDERS' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 font-bold text-pink-950">Orders - {filteredOrdersList.length} Orders</div>}
              {activeTab === 'CUSTOMERS' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 font-bold text-pink-950">Customers - {filteredCustomersList.length} Customers</div>}
              {activeTab === 'MARKETING' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 font-bold text-pink-950">Coupons - {coupons.length} Active</div>}
              {activeTab === 'QUERIES' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 font-bold text-pink-950">Support Queries - {queries.length}</div>}
              {activeTab === 'PAGES' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 font-bold text-pink-950">Policies Editor</div>}
              {activeTab === 'WALLET' && <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 font-bold text-pink-950">Wallet Config - Rate: {rewardSettings.pointToRupeeRate}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
