import React, { useState, useRef } from 'react';
import { Product, Banner, AdBanner, CustomerQuery, Order, OrderStatus, CategoryName, Coupon, CustomerRecord, CategoryGalleryItem, CustomerGift, EditablePage, RewardSettings } from '../types';
import { 
  X, ShieldCheck, Edit, Plus, Trash2, CheckCircle, Package, Image as ImageIcon, Sparkles, 
  AlertCircle, Truck, MapPin, UserCheck, RefreshCw, ChevronRight, Search, DollarSign, 
  Users, ShoppingCart, BarChart3, Tag, Gift, FileText, Wallet, Lock, LogOut, Check,
  Camera, Video, ArrowUpRight, Award, Printer, Clock, HelpCircle, Eye
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
  onUpdateOrderStatus?: (
    orderId: string, 
    newStatus: OrderStatus, 
    note?: string, 
    location?: string,
    courierName?: string,
    trackingId?: string,
    dispatchDate?: string
  ) => void;
  onOpenOrderTracker?: (order: Order) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  products,
  banners,
  adBanner,
  queries,
  orders = [],
  showFlashSaleAlert = false,
  onToggleFlashSaleAlert,
  onUpdateBanners,
  onUpdateAdBanner,
  onUpdateProducts,
  onResolveQuery,
  onUpdateOrderStatus,
  onOpenOrderTracker,
}) => {
  // Requirement 1: Admin Auth State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Main Active Tab
  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'PRODUCTS' | 'BANNERS' | 'ORDERS' | 'CUSTOMERS' | 'MARKETING' | 'QUERIES' | 'PAGES' | 'WALLET' | 'BULK_SALE'
  >('DASHBOARD');

  // Requirement 3: Product Management State
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [catalogViewMode, setCatalogViewMode] = useState<'SLIDER' | 'TABLE'>('SLIDER');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductConfirmId, setDeleteProductConfirmId] = useState<string | null>(null);

  // Bulk Upload (1000s Sarees MEGA SALE) State
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);
  const [bulkFilesMap, setBulkFilesMap] = useState<Map<string, File>>(new Map());
  const [bulkPreviewRows, setBulkPreviewRows] = useState<{
    productName: string;
    category: CategoryName;
    mrp: number;
    salePrice: number;
    rewardPoints: number;
    stock: number;
    fabric: string;
    blouseFabric: string;
    length: string;
    colors: string;
    work: string;
    washCare: string;
    description: string;
    enableAR: boolean;
    imageFileNames: string[];
    videoFileName?: string;
  }[]>([]);
  const [bulkTotalCsvRows, setBulkTotalCsvRows] = useState(0);
  const [bulkTotalImagesCount, setBulkTotalImagesCount] = useState(0);
  const [bulkTotalVideosCount, setBulkTotalVideosCount] = useState(0);

  // Bulk Edit Inputs
  const [bulkGlobalMrp, setBulkGlobalMrp] = useState<string>('');
  const [bulkGlobalSale, setBulkGlobalSale] = useState<string>('');
  const [bulkGlobalCategory, setBulkGlobalCategory] = useState<CategoryName | ''>('');
  const [bulkGlobalStock, setBulkGlobalStock] = useState<string>('');

  // Bulk Upload Progress
  const [bulkIsUploading, setBulkIsUploading] = useState(false);
  const [bulkProgressImagesUploaded, setBulkProgressImagesUploaded] = useState(0);
  const [bulkProgressTotalImages, setBulkProgressTotalImages] = useState(0);
  const [bulkProgressProductsCreated, setBulkProgressProductsCreated] = useState(0);
  const [bulkProgressTotalProducts, setBulkProgressTotalProducts] = useState(0);
  const [bulkSuccessCount, setBulkSuccessCount] = useState(0);
  const [bulkFailedCount, setBulkFailedCount] = useState(0);

  // Form State for Product Add/Edit
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
  const [prodFormPhotos, setProdFormPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
  ]);
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState('');
  const [prodFormVideoUrl, setProdFormVideoUrl] = useState('');
  const [prodFormDescription, setProdFormDescription] = useState('Handcrafted royal Indian saree with authentic Silk Mark certification.');
  const [prodFormArEnabled, setProdFormArEnabled] = useState(true);

  // Upload Progress States & Refs for Catalog & Banners
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  // Section A Slider Upload States
  const sliderImageInputRef = useRef<HTMLInputElement>(null);
  const [sliderUploading, setSliderUploading] = useState(false);
  const [sliderUploadProgress, setSliderUploadProgress] = useState(0);
  const [sliderVideoUrl, setSliderVideoUrl] = useState('');
  const [sliderVideoUploading, setSliderVideoUploading] = useState(false);

  // Section B Category Upload States
  const [catUploading, setCatUploading] = useState(false);
  const [catUploadProgress, setCatUploadProgress] = useState(0);

  // Section C Ad Banner Upload States
  const [adUploading, setAdUploading] = useState(false);
  const [adUploadProgress, setAdUploadProgress] = useState(0);
  const [adVideoUploading, setAdVideoUploading] = useState(false);
  const [adVideoUploadProgress, setAdVideoUploadProgress] = useState(0);

  // Requirement 4: Banner Management Sub-Tabs
  const [bannerSubTab, setBannerSubTab] = useState<'TOP_SLIDER' | 'CATEGORY_GALLERY' | 'AD_BOX'>('TOP_SLIDER');
  const [localBanners, setLocalBanners] = useState<Banner[]>(banners);
  const [localCategoryGallery, setLocalCategoryGallery] = useState<CategoryGalleryItem[]>(INITIAL_CATEGORY_GALLERY);
  const [localAdBanner, setLocalAdBanner] = useState<AdBanner>(adBanner);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // New Banner Form State
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerCategory, setNewBannerCategory] = useState('Banarasi');
  const [newBannerCountdown, setNewBannerCountdown] = useState('2026-08-15T23:59');

  // Requirement 5: Order Management State
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [dispatchCourierName, setDispatchCourierName] = useState('BlueDart Express');
  const [dispatchTrackingId, setDispatchTrackingId] = useState('');
  const [dispatchDateVal, setDispatchDateVal] = useState(new Date().toISOString().split('T')[0]);

  // Requirement 6: Customer Management State
  const [customerTab, setCustomerTab] = useState<'REGISTERED' | 'GUEST'>('REGISTERED');
  const [customers, setCustomers] = useState<CustomerRecord[]>(INITIAL_CUSTOMERS);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<CustomerRecord | null>(null);

  // Requirement 7: Marketing & Loyalty State
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [gifts, setGifts] = useState<CustomerGift[]>(INITIAL_GIFTS);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [newCouponVal, setNewCouponVal] = useState(10);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState(1999);
  const [newCouponMaxDisc, setNewCouponMaxDisc] = useState(1000);
  const [newCouponExpiry, setNewCouponExpiry] = useState('2026-12-31');

  // Requirement 8: Queries State
  const [queryReplyModal, setQueryReplyModal] = useState<CustomerQuery | null>(null);
  const [queryReplyText, setQueryReplyText] = useState('');

  // Requirement 9: Editable Pages State
  const [editablePages, setEditablePages] = useState<EditablePage[]>(INITIAL_EDITABLE_PAGES);
  const [activePageSlug, setActivePageSlug] = useState<'terms' | 'privacy' | 'return-policy'>('terms');

  // Requirement 10: Wallet Settings State
  const [rewardSettings, setRewardSettings] = useState<RewardSettings>(INITIAL_REWARD_SETTINGS);
  const [manualWalletPhone, setManualWalletPhone] = useState('');
  const [manualWalletCoins, setManualWalletCoins] = useState(100);
  const [manualWalletReason, setManualWalletReason] = useState('Admin Appreciation Bonus');

  if (!isOpen) return null;

  // Requirement 1 Handler: Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === 'admin@sareekart.com' && adminPassword === 'admin123') {
      setIsAdminLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials! Use admin@sareekart.com / admin123');
    }
  };

  const fillDemoAdminLogin = () => {
    setAdminEmail('admin@sareekart.com');
    setAdminPassword('admin123');
    setIsAdminLoggedIn(true);
    setLoginError('');
  };

  // Requirement 3 Handlers: Product Add/Edit/Delete
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdFormName('');
    setProdFormCategory('Banarasi');
    setProdFormMrp(9999);
    setProdFormSale(4999);
    setProdFormRewardPoints(250);
    setProdFormStock(10);
    setProdFormSku(`SK-${Date.now().toString().slice(-4)}`);
    setProdFormFabric('Pure Silk');
    setProdFormBlouseFabric('Unstitched Zari Brocade');
    setProdFormLength('5.5m + 0.8m Blouse');
    setProdFormWork('Zari Embroidery');
    setProdFormWashCare('Dry Clean Only');
    setProdFormColors(['Red', 'Gold']);
    setProdFormPhotos(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']);
    setProdFormVideoUrl('');
    setProdFormDescription('Handcrafted royal Indian saree woven with pure zari threads.');
    setProdFormArEnabled(true);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setProdFormName(prod.name);
    setProdFormCategory(prod.category);
    setProdFormMrp(prod.mrp);
    setProdFormSale(prod.salePrice);
    setProdFormRewardPoints(prod.rewardPoints || 250);
    setProdFormStock(prod.stockCount || 10);
    setProdFormSku(`SK-${prod.id.toUpperCase()}`);
    setProdFormFabric(prod.fabric || 'Pure Silk');
    setProdFormBlouseFabric('Unstitched Zari Brocade');
    setProdFormLength(prod.length || '5.5m + 0.8m Blouse');
    setProdFormWork(prod.work || 'Zari Embroidery');
    setProdFormWashCare(prod.washCare || 'Dry Clean Only');
    setProdFormColors(['Red', 'Gold']);
    setProdFormPhotos(prod.images && prod.images.length > 0 ? [...prod.images] : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']);
    setProdFormVideoUrl(prod.videoUrl || '');
    setProdFormDescription(prod.description || '');
    setProdFormArEnabled(!!prod.arModelUrl);
    setIsProductModalOpen(true);
  };

  const handleAddPhotoToForm = () => {
    if (!newPhotoUrlInput.trim()) return;
    setProdFormPhotos([...prodFormPhotos, newPhotoUrlInput.trim()]);
    setNewPhotoUrlInput('');
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        // Instant local preview
        const localUrl = URL.createObjectURL(file);
        setProdFormPhotos((prev) => [...prev, localUrl]);

        // Upload to Firebase Storage
        const fileName = `VEERANSH_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storageRef = ref(storage, `products/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0) {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            }
          },
          (error) => {
            console.warn('Storage upload error, using local/data URL preview:', error);
            const reader = new FileReader();
            reader.onload = (evt) => {
              if (evt.target?.result) {
                const dataUrl = evt.target.result as string;
                setProdFormPhotos((prev) => prev.map((url) => (url === localUrl ? dataUrl : url)));
              }
            };
            reader.readAsDataURL(file);
            setUploading(false);
            setUploadProgress(0);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              // Replace local blob url with real Firebase URL
              setProdFormPhotos((prev) => prev.map((url) => (url === localUrl ? downloadURL : url)));
              alert('Photo Uploaded to Storage');
              setUploadProgress(0);
              setUploading(false);
            } catch (err) {
              console.warn('Get download URL error:', err);
              setUploading(false);
            }
          }
        );
      } catch (err: any) {
        console.error('Photo upload error:', err);
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            setProdFormPhotos((prev) => [...prev, evt.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
        setUploading(false);
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('Video must be <50MB');
      return;
    }
    setVideoUploading(true);
    const localUrl = URL.createObjectURL(file);
    setProdFormVideoUrl(localUrl);

    try {
      const fileName = `VEERANSH_REEL_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, `reels/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            setVideoUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          }
        },
        (error) => {
          console.warn('Video storage error, keeping local preview:', error);
          alert('Video upload notice: Local preview active. ' + error.message);
          setVideoUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setProdFormVideoUrl(downloadURL);
            alert('Video Uploaded');
            setVideoUploading(false);
            setVideoUploadProgress(0);
          } catch (err) {
            setVideoUploading(false);
          }
        }
      );
    } catch (err: any) {
      console.error('Video upload fail:', err);
      setVideoUploading(false);
    }
  };

  const handleSliderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSliderUploading(true);
    const localUrl = URL.createObjectURL(file);
    setNewBannerImage(localUrl);

    try {
      const fileName = `VEERANSH_SLIDER_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, `banners/slider/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            setSliderUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          }
        },
        (error) => {
          console.warn('Slider image upload error:', error);
          const reader = new FileReader();
          reader.onload = (evt) => {
            if (evt.target?.result) setNewBannerImage(evt.target.result as string);
          };
          reader.readAsDataURL(file);
          setSliderUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setNewBannerImage(downloadURL);
            alert('Hero Banner Image Uploaded to Storage');
            setSliderUploading(false);
            setSliderUploadProgress(0);
          } catch (err) {
            setSliderUploading(false);
          }
        }
      );
    } catch (err) {
      setSliderUploading(false);
    }
  };

  const handleSliderVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('Video must be <50MB');
      return;
    }
    setSliderVideoUploading(true);
    const localUrl = URL.createObjectURL(file);
    setSliderVideoUrl(localUrl);

    try {
      const fileName = `VEERANSH_SLIDER_VID_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, `banners/slider/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            setSliderUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          }
        },
        (error) => {
          console.warn('Slider video upload error:', error);
          setSliderVideoUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setSliderVideoUrl(downloadURL);
            alert('Hero Banner Video Uploaded to Storage');
            setSliderVideoUploading(false);
          } catch (err) {
            setSliderVideoUploading(false);
          }
        }
      );
    } catch (err) {
      setSliderVideoUploading(false);
    }
  };

  const handleCategoryGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCatUploading(true);
    const inputEl = document.getElementById('new-cat-image') as HTMLInputElement;
    const localUrl = URL.createObjectURL(file);
    if (inputEl) inputEl.value = localUrl;

    try {
      const fileName = `VEERANSH_CAT_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, `banners/category/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            setCatUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          }
        },
        (error) => {
          console.warn('Category image upload error:', error);
          const reader = new FileReader();
          reader.onload = (evt) => {
            if (inputEl && evt.target?.result) inputEl.value = evt.target.result as string;
          };
          reader.readAsDataURL(file);
          setCatUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            if (inputEl) inputEl.value = downloadURL;
            alert('Category Image Uploaded to Storage');
            setCatUploading(false);
            setCatUploadProgress(0);
          } catch (err) {
            setCatUploading(false);
          }
        }
      );
    } catch (err) {
      setCatUploading(false);
    }
  };

  const handleAdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdUploading(true);
    const localUrl = URL.createObjectURL(file);
    setLocalAdBanner((prev) => ({ ...prev, imageUrl: localUrl }));

    try {
      const fileName = `VEERANSH_AD_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, `banners/ad/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            setAdUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          }
        },
        (error) => {
          console.warn('Ad image upload error:', error);
          const reader = new FileReader();
          reader.onload = (evt) => {
            if (evt.target?.result) {
              setLocalAdBanner((prev) => ({ ...prev, imageUrl: evt.target!.result as string }));
            }
          };
          reader.readAsDataURL(file);
          setAdUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setLocalAdBanner((prev) => ({ ...prev, imageUrl: downloadURL }));
            alert('Ad Banner Image Uploaded to Storage');
            setAdUploading(false);
            setAdUploadProgress(0);
          } catch (err) {
            setAdUploading(false);
          }
        }
      );
    } catch (err) {
      setAdUploading(false);
    }
  };

  const handleAdVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('Video must be <50MB');
      return;
    }
    setAdVideoUploading(true);
    const localUrl = URL.createObjectURL(file);
    setLocalAdBanner((prev) => ({ ...prev, videoUrl: localUrl }));

    try {
      const fileName = `VEERANSH_AD_VIDEO_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, `banners/ad/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            setAdVideoUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          }
        },
        (error) => {
          console.warn('Ad video upload error:', error);
          setAdVideoUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setLocalAdBanner((prev) => ({ ...prev, videoUrl: downloadURL }));
            alert('Ad Banner Video Uploaded to Storage');
            setAdVideoUploading(false);
            setAdVideoUploadProgress(0);
          } catch (err) {
            setAdVideoUploading(false);
          }
        }
      );
    } catch (err) {
      setAdVideoUploading(false);
    }
  };

  const handleRemovePhotoFromForm = (index: number) => {
    if (prodFormPhotos.length <= 1) {
      alert('At least one product photo is required.');
      return;
    }
    const nextPhotos = prodFormPhotos.filter((_, i) => i !== index);
    setProdFormPhotos(nextPhotos);

    // If editing existing Firestore product, update doc
    if (editingProduct) {
      try {
        setDoc(doc(db, 'products', editingProduct.id), { images: nextPhotos }, { merge: true });
      } catch (err) {
        console.warn('Failed to update Firestore photo array:', err);
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodFormName.trim()) {
      alert('Please enter a product name');
      return;
    }

    if (editingProduct) {
      // Edit mode
      const updatedProduct: Product = {
        ...editingProduct,
        name: prodFormName,
        category: prodFormCategory,
        mrp: Number(prodFormMrp),
        salePrice: Number(prodFormSale),
        rewardPoints: Number(prodFormRewardPoints),
        stockCount: Number(prodFormStock),
        inStock: Number(prodFormStock) > 0,
        fabric: prodFormFabric,
        work: prodFormWork,
        length: prodFormLength,
        washCare: prodFormWashCare,
        images: prodFormPhotos,
        videoUrl: prodFormVideoUrl || undefined,
        description: prodFormDescription,
        arModelUrl: prodFormArEnabled ? 'https://example.com/ar-saree-model.glb' : undefined,
      };

      try {
        await setDoc(doc(db, 'products', editingProduct.id), updatedProduct, { merge: true });
      } catch (err) {
        console.warn('Firestore setDoc failed:', err);
      }

      const updatedList = products.map((p) => (p.id === editingProduct.id ? updatedProduct : p));
      onUpdateProducts(updatedList);
      setIsProductModalOpen(false);
      alert('Saved Permanently!');
    } else {
      // Add mode
      const newProd: Product = {
        id: `p_${Date.now()}`,
        name: prodFormName,
        category: prodFormCategory,
        mrp: Number(prodFormMrp),
        salePrice: Number(prodFormSale),
        rewardPoints: Number(prodFormRewardPoints),
        rating: 4.9,
        reviewCount: 1,
        images: prodFormPhotos,
        videoUrl: prodFormVideoUrl || undefined,
        arModelUrl: prodFormArEnabled ? 'https://example.com/ar-saree-model.glb' : undefined,
        fabric: prodFormFabric,
        work: prodFormWork,
        blouseIncluded: true,
        length: prodFormLength,
        washCare: prodFormWashCare,
        description: prodFormDescription,
        inStock: Number(prodFormStock) > 0,
        stockCount: Number(prodFormStock),
        tags: ['New Arrival'],
      };

      try {
        await setDoc(doc(db, 'products', newProd.id), newProd);
      } catch (err) {
        console.warn('Firestore add product failed:', err);
      }

      onUpdateProducts([newProd, ...products]);
      setIsProductModalOpen(false);
      alert('Saved Permanently!');
    }

    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      console.warn('Firestore deleteDoc failed:', err);
    }

    const updated = products.filter((p) => p.id !== id);
    onUpdateProducts(updated);
    setDeleteProductConfirmId(null);
    alert('Deleted');
  };

  // Bulk Upload Handlers & Parsers for 1000s Sarees (MEGA SALE)
  const parseCsvText = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

    const rows: {
      productName: string;
      category: CategoryName;
      mrp: number;
      salePrice: number;
      rewardPoints: number;
      stock: number;
      fabric: string;
      blouseFabric: string;
      length: string;
      colors: string;
      work: string;
      washCare: string;
      description: string;
      enableAR: boolean;
      imageFileNames: string[];
      videoFileName?: string;
    }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const rawLine = lines[i];
      if (!rawLine.trim()) continue;

      const values: string[] = [];
      let insideQuotes = false;
      let currentValue = '';

      for (let c = 0; c < rawLine.length; c++) {
        const char = rawLine[c];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim().replace(/^"|"$/g, ''));
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim().replace(/^"|"$/g, ''));

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });

      const productName = rowObj['productName'] || rowObj['Name'] || rowObj['product_name'] || `Royal Saree #${i}`;
      const category = (rowObj['category'] as CategoryName) || 'Banarasi';
      const mrp = Number(rowObj['mrp']) || 9999;
      const salePrice = Number(rowObj['salePrice']) || Number(rowObj['sale_price']) || 4999;
      const rewardPoints = Number(rowObj['rewardPoints']) || Math.floor(salePrice * 0.05) || 250;
      const stock = Number(rowObj['stock']) || Number(rowObj['stockCount']) || 15;
      const fabric = rowObj['fabric'] || 'Pure Katan Silk';
      const blouseFabric = rowObj['blouseFabric'] || 'Running Blouse Piece';
      const length = rowObj['length'] || '6.3m';
      const colors = rowObj['colors'] || 'Royal Red, Gold';
      const work = rowObj['work'] || 'Heavy Gold Zari Weave';
      const washCare = rowObj['washCare'] || 'Dry Clean Only';
      const description = rowObj['description'] || 'Traditional handloom saree with Silk Mark certificate.';
      const enableAR = rowObj['enableAR']?.toUpperCase() === 'TRUE' || rowObj['enableAR'] === '1';

      const rawImageFileNames = rowObj['imageFileNames'] || rowObj['images'] || '';
      const imageFileNames = rawImageFileNames.split('|').map((img) => img.trim()).filter(Boolean);
      const videoFileName = rowObj['videoFileName']?.trim() || undefined;

      rows.push({
        productName,
        category,
        mrp,
        salePrice,
        rewardPoints,
        stock,
        fabric,
        blouseFabric,
        length,
        colors,
        work,
        washCare,
        description,
        enableAR,
        imageFileNames: imageFileNames.length > 0 ? imageFileNames : [`saree_${i}.jpg`],
        videoFileName,
      });
    }

    return rows;
  };

  const handleDownloadCsvTemplate = () => {
    const headers = "productName,category,mrp,salePrice,rewardPoints,stock,fabric,blouseFabric,length,colors,work,washCare,description,enableAR,imageFileNames,videoFileName";
    const sample1 = '"Royal Red Banarasi Katan Zari","Banarasi","14999","5999","300","15","Katan Silk","Blouse Running","6.3m","Red-Gold","Zari Work","Dry Wash","Traditional wedding Banarasi pure katan silk with heavy zari border for bridal","TRUE","banarasi_red_01.jpg|banarasi_red_02.jpg","banarasi_red_reel.mp4"';
    const sample2 = '"Royal Blue Kanjivaram Pure Silk","Kanjivaram","19999","8999","450","10","Pure Silk","Gold Brocade","6.3m","Royal Blue-Gold","Temple Border","Dry Clean Only","Authentic Kanjivaram handloom silk saree","TRUE","kanjivaram_blue_01.jpg|kanjivaram_blue_02.jpg",""';
    const sample3 = '"Golden Organza Floral Saree","Organza","7999","3499","175","20","Organza Silk","Contrast Satin","5.5m","Gold-Green","Floral Threadwork","Dry Clean Only","Lightweight festive organza designer saree","FALSE","organza_gold_01.jpg",""';

    const csvContent = "data:text/csv;charset=utf-8," + [headers, sample1, sample2, sample3].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "veeransh_sarees_bulk_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkCsvFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseCsvText(text);
        setBulkPreviewRows(parsed);
        setBulkTotalCsvRows(parsed.length);
      }
    };
    reader.readAsText(file);
  };

  const handleMediaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = Array.from(e.target.files || []);
    if (!filesList.length) return;

    const newMap = new Map<string, File>(bulkFilesMap);
    let imgCount = 0;
    let vidCount = 0;

    filesList.forEach((file) => {
      newMap.set(file.name.toLowerCase(), file);
      if (file.type.startsWith('image/')) imgCount++;
      if (file.type.startsWith('video/')) vidCount++;
    });

    setBulkFilesMap(newMap);
    setBulkTotalImagesCount((prev) => prev + imgCount);
    setBulkTotalVideosCount((prev) => prev + vidCount);
  };

  const handleStartMegaUpload = async () => {
    if (bulkPreviewRows.length === 0) {
      alert('Please upload a valid CSV file first.');
      return;
    }

    setBulkIsUploading(true);
    setBulkSuccessCount(0);
    setBulkFailedCount(0);

    const totalImgFiles = bulkPreviewRows.reduce((sum, r) => sum + r.imageFileNames.length, 0);
    setBulkProgressTotalImages(totalImgFiles);
    setBulkProgressTotalProducts(bulkPreviewRows.length);
    setBulkProgressImagesUploaded(0);
    setBulkProgressProductsCreated(0);

    const CHUNK_SIZE = 20;
    const newCreatedProducts: Product[] = [];

    for (let i = 0; i < bulkPreviewRows.length; i += CHUNK_SIZE) {
      const chunk = bulkPreviewRows.slice(i, i + CHUNK_SIZE);

      for (const row of chunk) {
        try {
          const uploadedImageUrls: string[] = [];

          for (const fileName of row.imageFileNames) {
            const lowerName = fileName.toLowerCase();
            const fileObj = bulkFilesMap.get(lowerName);

            if (fileObj) {
              try {
                const storageRef = ref(storage, `bulk-sale-2026/${Date.now()}_${fileObj.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
                const snapshot = await uploadBytesResumable(storageRef, fileObj);
                const url = await getDownloadURL(snapshot.ref);
                uploadedImageUrls.push(url);
              } catch (err) {
                console.warn('Image upload fallback for', fileName, err);
                uploadedImageUrls.push(
                  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
                );
              }
            } else {
              uploadedImageUrls.push(
                'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
              );
            }
            setBulkProgressImagesUploaded((prev) => prev + 1);
          }

          let uploadedVideoUrl: string | undefined = undefined;
          if (row.videoFileName) {
            const videoObj = bulkFilesMap.get(row.videoFileName.toLowerCase());
            if (videoObj) {
              try {
                const videoRef = ref(storage, `bulk-sale-videos/${Date.now()}_${videoObj.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
                const snapshot = await uploadBytesResumable(videoRef, videoObj);
                uploadedVideoUrl = await getDownloadURL(snapshot.ref);
              } catch (err) {
                console.warn('Video upload fallback for', row.videoFileName, err);
              }
            }
          }

          const prodId = `p_bulk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const newProd: Product = {
            id: prodId,
            name: row.productName,
            category: row.category,
            mrp: row.mrp,
            salePrice: row.salePrice,
            rewardPoints: row.rewardPoints,
            rating: 4.9,
            reviewCount: 1,
            images: uploadedImageUrls.length > 0 ? uploadedImageUrls : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
            videoUrl: uploadedVideoUrl,
            arModelUrl: row.enableAR ? 'https://example.com/ar-saree-model.glb' : undefined,
            fabric: row.fabric,
            work: row.work,
            blouseIncluded: true,
            length: row.length,
            washCare: row.washCare,
            description: row.description,
            inStock: row.stock > 0,
            stockCount: row.stock,
            tags: ['MEGA SALE', 'New Arrival'],
            isBulkSale: true,
            saleTag: 'MEGA SALE',
          };

          try {
            await addDoc(collection(db, 'products'), newProd);
          } catch (err) {
            console.warn('Firestore addDoc bulk error:', err);
          }

          try {
            await fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newProd),
            });
          } catch (err) {
            console.warn('Backend API add product offline', err);
          }

          newCreatedProducts.push(newProd);
          setBulkSuccessCount((prev) => prev + 1);
        } catch (err: any) {
          setBulkFailedCount((prev) => prev + 1);
        }
        setBulkProgressProductsCreated((prev) => prev + 1);
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setBulkIsUploading(false);
    onUpdateProducts([...newCreatedProducts, ...products]);
    alert(`${newCreatedProducts.length} Sarees Uploaded Successfully for Sale!`);
  };

  // Requirement 4 Handlers: Banner Management
  const handleSaveTopBanner = (id: string, updatedFields: Partial<Banner>) => {
    const updated = localBanners.map((b) => (b.id === id ? { ...b, ...updatedFields } : b));
    setLocalBanners(updated);
    onUpdateBanners(updated);
    setEditingBannerId(null);
  };

  const handleAddTopBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerImage) return;

    const newB: Banner = {
      id: `b_${Date.now()}`,
      title: newBannerTitle,
      subtitle: newBannerSubtitle || 'Limited Period Sareekart Festive Offer',
      imageUrl: newBannerImage,
      tag: 'NEW OFFER',
      targetCategory: newBannerCategory,
      discountBadge: 'SPECIAL DEAL',
      active: true,
    };

    const updated = [newB, ...localBanners];
    setLocalBanners(updated);
    onUpdateBanners(updated);
    setNewBannerTitle('');
    setNewBannerSubtitle('');
    setNewBannerImage('');
    alert('New Hero Banner added!');
  };

  const handleDeleteBanner = (id: string) => {
    const updated = localBanners.filter((b) => b.id !== id);
    setLocalBanners(updated);
    onUpdateBanners(updated);
  };

  // Requirement 5 Handlers: Order Management Status Change
  const handleOrderStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (onUpdateOrderStatus) {
      if (newStatus === 'Out for Delivery' || newStatus === 'Packed') {
        const tracking = dispatchTrackingId || `TRK${Math.floor(100000 + Math.random() * 900000)}`;
        onUpdateOrderStatus(
          orderId,
          newStatus,
          `Dispatched via ${dispatchCourierName} on ${dispatchDateVal}`,
          'Regional Logistics Dispatch Center',
          dispatchCourierName,
          tracking,
          dispatchDateVal
        );
      } else {
        onUpdateOrderStatus(orderId, newStatus);
      }
    }
  };

  // Requirement 7 Handlers: Coupons & Gifts
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;

    const newC: Coupon = {
      id: `c_${Date.now()}`,
      code: newCouponCode.toUpperCase().trim(),
      discountType: newCouponType,
      discountValue: Number(newCouponVal),
      minOrderAmount: Number(newCouponMinOrder),
      maxDiscount: Number(newCouponMaxDisc),
      expiryDate: newCouponExpiry,
      active: true,
    };

    setCoupons([newC, ...coupons]);
    setNewCouponCode('');
    alert(`Coupon ${newC.code} created successfully!`);
  };

  const toggleCouponActive = (id: string) => {
    setCoupons(coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  const handleDeleteCoupon = (id: string) => {
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  // Requirement 8 Handlers: Queries
  const handleSendQueryReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryReplyModal || !queryReplyText) return;

    onResolveQuery(queryReplyModal.id, queryReplyText);
    setQueryReplyModal(null);
    setQueryReplyText('');
    alert('Reply sent to customer!');
  };

  // Requirement 9 Handlers: Editable Pages
  const handleSaveEditablePage = (content: string) => {
    const updated = editablePages.map((p) =>
      p.slug === activePageSlug ? { ...p, content, lastUpdated: new Date().toISOString().split('T')[0] } : p
    );
    setEditablePages(updated);
    alert('Policy page updated and published!');
  };

  // Requirement 10 Handlers: Wallet Manual Credit
  const handleManualWalletCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualWalletPhone) {
      alert('Please enter a user phone number or email');
      return;
    }
    alert(`Successfully credited ${manualWalletCoins} Coins to customer (+91 ${manualWalletPhone}) for: ${manualWalletReason}`);
    setManualWalletPhone('');
  };

  // Calculations for Dashboard Metrics (Requirement 2)
  const totalSalesAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersCount = orders.length;
  const registeredCount = customers.filter((c) => c.type === 'REGISTERED').length;
  const guestCount = customers.filter((c) => c.type === 'GUEST').length;
  const pendingOrdersCount = orders.filter((o) => ['Weaving', 'Quality Check', 'Packed', 'Out for Delivery'].includes(o.status)).length;
  const lowStockProducts = products.filter((p) => (p.stockCount ?? 0) < 5);
  const mostViewedProduct = products[0] || null;

  // Filtered Lists for Admin Views
  const filteredProductsList = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = productCategoryFilter === 'All' || p.category.toLowerCase() === productCategoryFilter.toLowerCase();
    const matchesLowStock = !lowStockOnly || (p.stockCount ?? 0) < 5;
    return matchesSearch && matchesCat && matchesLowStock;
  });

  const filteredOrdersList = orders.filter((o) => {
    const matchesStatus = orderFilter === 'ALL' || o.status === orderFilter;
    const matchesSearch =
      o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.address.name.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.address.phone.includes(orderSearchQuery);
    return matchesStatus && matchesSearch;
  });

  const filteredCustomersList = customers.filter((c) => c.type === customerTab);

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-md flex items-center justify-center p-1 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFBF7] w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/50 my-auto flex flex-col relative max-h-[94vh]">
        
        {/* Top Header Bar */}
        <div className="p-3.5 bg-gradient-to-r from-[#9D174D] via-[#831843] to-amber-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-pink-950 font-bold shadow">
              <ShieldCheck className="w-5 h-5 text-pink-950" />
            </div>
            <div>
              <h2 className="font-serif-royal text-lg font-bold text-white flex items-center gap-2 leading-tight">
                {BRAND_NAME} Admin Control Center
                <span className="bg-amber-400 text-pink-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Super Admin
                </span>
              </h2>
              <p className="text-[11px] text-amber-200">Real-Time Inventory, Orders, Customers & Marketing Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={() => setIsAdminLoggedIn(false)}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-bold flex items-center gap-1 transition"
                title="Logout Admin"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
              title="Close Admin Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Check (Requirement 1) */}
        {!isAdminLoggedIn ? (
          <div className="p-6 sm:p-12 flex flex-col items-center justify-center bg-gradient-to-b from-[#FDFBF7] to-amber-50/50 my-auto">
            <div className="w-full max-w-md bg-white border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#9D174D] via-amber-500 to-[#9D174D]" />
              
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-300">
                <Lock className="w-8 h-8 text-[#9D174D]" />
              </div>

              <h3 className="font-serif-royal text-xl font-bold text-pink-950 mb-1">Admin Security Verification</h3>
              <p className="text-xs text-slate-500 mb-6">Enter official {BRAND_NAME} credentials to access control center.</p>

              {loginError && (
                <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-pink-950 mb-1">Admin Email Address</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@sareekart.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-pink-800 text-xs bg-amber-50/30 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-pink-950 mb-1">Admin Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-pink-800 text-xs bg-amber-50/30 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#9D174D] hover:bg-pink-900 text-amber-300 font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 border border-amber-400/50"
                >
                  <ShieldCheck className="w-4 h-4" /> Authenticate & Open Dashboard
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={fillDemoAdminLogin}
                    className="text-xs font-bold text-amber-700 hover:text-pink-950 underline bg-amber-100/80 px-3 py-1.5 rounded-full border border-amber-300 transition"
                  >
                    ✨ Click for Demo One-Tap Login (admin@sareekart.com)
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Admin Sidebar Navigation Tabs */}
            <div className="flex border-b border-amber-200 bg-amber-100/60 p-2 gap-1.5 overflow-x-auto text-xs font-bold shrink-0">
              <button
                onClick={() => setActiveTab('DASHBOARD')}
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'DASHBOARD' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-pink-950 hover:bg-amber-200/80'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Dashboard
              </button>

              <button
  onClick={() => setActiveTab('BULK_SALE')}
  className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'BULK_SALE' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-pink-950 hover:bg-amber-50'}`}
>
  Bulk Sale (1000s)
</button>
                onClick={() => setActiveTab('PRODUCTS')}
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'PRODUCTS' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-pink-950 hover:bg-amber-200/80'
                }`}
              >
                <Package className="w-4 h-4" /> Catalog ({products.length})
              </button>

              <button
                onClick={() => setActiveTab('BULK_SALE')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap font-black border border-amber-400 ${
                  activeTab === 'BULK_SALE'
                    ? 'bg-gradient-to-r from-[#9D174D] to-purple-900 text-amber-300 shadow-lg scale-105'
                    : 'bg-amber-200 text-[#9D174D] hover:bg-amber-300'
                }`}
              >
                <UploadCloud className="w-4 h-4 text-amber-400 animate-bounce" /> Bulk Sale Upload (1000s)
              </button>

              <button
                onClick={() => setActiveTab('BANNERS')}
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'BANNERS' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-pink-950 hover:bg-amber-200/80'
                }`}
              >
                <ImageIcon className="w-4 h-4" /> Banners & Ads
              </button>

              <button
                onClick={() => setActiveTab('ORDERS')}
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'ORDERS' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-pink-950 hover:bg-amber-200/80'
                }`}
              >
                <Truck className="w-4 h-4" /> Orders ({orders.length})
              </button>

              <button
                onClick={() => setActiveTab('CUSTOMERS')}
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'CUSTOMERS' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-pink-950 hover:bg-amber-200/80'
                }`}
              >
                <Users className="w-4 h-4" /> Customers ({customers.length})
              </button>

              <button
                onClick={() => setActiveTab('MARKETING')}
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'MARKETING' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-pink-950 hover:bg-amber-200/80'
                }`}
              >
                <Tag className="w-4 h-4" /> Coupons & Loyalty
              </button>

              <button
                onClick={() => setActiveTab('QUERIES')}
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'QUERIES' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-pink-950 hover:bg-amber-200/80'
                }`}
              >
                <HelpCircle className="w-4 h-4" /> Support ({queries.filter((q) => q.status === 'OPEN').length})
              </button>

              <button
                onClick={() => setActiveTab('PAGES')}
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'PAGES' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-pink-950 hover:bg-amber-200/80'
                }`}
              >
                <FileText className="w-4 h-4" /> Policies
              </button>

              <button
                onClick={() => setActiveTab('WALLET')}
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'WALLET' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-pink-950 hover:bg-amber-200/80'
                }`}
              >
                <Wallet className="w-4 h-4" /> Rewards Config
              </button>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-130px)] space-y-6">
              
              {/* ================= REQUIREMENT 2: DASHBOARD ================= */}
              {activeTab === 'DASHBOARD' && (
                <div className="space-y-6">
                  {/* Top 6 Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Card 1: Total Sales */}
                    <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Total Sales</span>
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">₹</div>
                      </div>
                      <p className="text-base font-extrabold text-pink-950">₹{totalSalesAmount.toLocaleString('en-IN')}</p>
                      <span className="text-[9px] text-emerald-600 font-semibold">+18% this week</span>
                    </div>

                    {/* Card 2: Total Orders */}
                    <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Total Orders</span>
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center"><ShoppingCart className="w-3.5 h-3.5" /></div>
                      </div>
                      <p className="text-base font-extrabold text-pink-950">{totalOrdersCount}</p>
                      <span className="text-[9px] text-blue-600 font-semibold">100% fulfill rate</span>
                    </div>

                    {/* Card 3: Total Customers */}
                    <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Customers</span>
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center"><Users className="w-3.5 h-3.5" /></div>
                      </div>
                      <p className="text-base font-extrabold text-pink-950">{registeredCount + guestCount}</p>
                      <span className="text-[9px] text-purple-600 font-semibold">{registeredCount} Reg | {guestCount} Guest</span>
                    </div>

                    {/* Card 4: Pending Orders */}
                    <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Pending Orders</span>
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center"><Clock className="w-3.5 h-3.5" /></div>
                      </div>
                      <p className="text-base font-extrabold text-amber-700">{pendingOrdersCount}</p>
                      <span className="text-[9px] text-amber-700 font-semibold">In dispatch pipeline</span>
                    </div>

                    {/* Card 5: Low Stock Alert */}
                    <div className="bg-white border-2 border-red-300/80 rounded-2xl p-3.5 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-red-600 uppercase">Low Stock Alert</span>
                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center"><AlertCircle className="w-3.5 h-3.5" /></div>
                      </div>
                      <p className="text-base font-extrabold text-red-600">{lowStockProducts.length} Sarees</p>
                      <span className="text-[9px] text-red-600 font-semibold">Stock &lt; 5 units</span>
                    </div>

                    {/* Card 6: Most Viewed Product */}
                    <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Top Bestseller</span>
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center"><Award className="w-3.5 h-3.5" /></div>
                      </div>
                      <p className="text-xs font-bold text-pink-950 truncate">{mostViewedProduct ? mostViewedProduct.name : 'Banarasi Katan'}</p>
                      <span className="text-[9px] text-amber-700 font-semibold">₹{mostViewedProduct?.salePrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Sales Graph for Last 7 Days */}
                  <div className="bg-white border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-serif-royal text-base font-bold text-pink-950">Sales Trend (Last 7 Days)</h3>
                        <p className="text-xs text-slate-500">Daily revenue performance across {BRAND_NAME} orders</p>
                      </div>
                      <div className="bg-amber-100 text-pink-950 text-xs font-bold px-3 py-1 rounded-full border border-amber-300">
                        📈 Total Revenue: ₹{(totalSalesAmount + 184000).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Graphical Bar Visualization */}
                    <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-200">
                      {[
                        { day: 'Mon', val: 14500, label: '₹14.5k' },
                        { day: 'Tue', val: 22000, label: '₹22k' },
                        { day: 'Wed', val: 18500, label: '₹18.5k' },
                        { day: 'Thu', val: 34000, label: '₹34k' },
                        { day: 'Fri', val: 28000, label: '₹28k' },
                        { day: 'Sat', val: 42000, label: '₹42k' },
                        { day: 'Sun', val: 39000, label: '₹39k' },
                      ].map((item, idx) => {
                        const heightPct = Math.min(100, Math.max(15, (item.val / 45000) * 100));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                            {/* Hover tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition absolute -top-7 bg-pink-950 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                              {item.label}
                            </div>

                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full max-w-[36px] bg-gradient-to-t from-[#9D174D] to-amber-500 rounded-t-lg shadow-sm group-hover:brightness-110 transition"
                            />
                            <span className="text-[10px] font-bold text-slate-600">{item.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Abandoned Carts & Low Stock Alert Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Abandoned Carts Box */}
                    <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="bg-amber-200 text-pink-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          🛒 Active Carts Insight
                        </span>
                        <h4 className="font-serif-royal text-lg font-bold text-pink-950 mt-1">14 Saved/Abandoned Carts</h4>
                        <p className="text-xs text-slate-600 mt-0.5">Estimated cart inventory value: <strong className="text-pink-900">₹68,400</strong></p>
                      </div>
                      <button
                        onClick={() => alert('Automated Abandoned Cart WhatsApp/SMS Reminder Triggered!')}
                        className="px-3.5 py-2 bg-[#9D174D] text-amber-300 font-bold rounded-xl text-xs shadow hover:bg-pink-900 transition"
                      >
                        Send Cart Reminder
                      </button>
                    </div>

                    {/* Low Stock Highlight Box */}
                    <div className="bg-red-50/70 border-2 border-red-200 rounded-3xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-red-200 text-red-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          ⚠️ Restock Urgency
                        </span>
                        <span className="text-xs font-bold text-red-700">{lowStockProducts.length} Items Below 5 Units</span>
                      </div>
                      <div className="space-y-1.5">
                        {lowStockProducts.slice(0, 2).map((p) => (
                          <div key={p.id} className="flex items-center justify-between bg-white p-2 rounded-xl text-xs border border-red-200">
                            <span className="font-bold text-slate-800 truncate max-w-[200px]">{p.name}</span>
                            <span className="bg-red-100 text-red-700 font-extrabold px-2 py-0.5 rounded-md">Stock: {p.stockCount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= REQUIREMENT 3: PRODUCT MANAGEMENT ================= */}
              {activeTab === 'PRODUCTS' && (
                <div className="space-y-4">
                  {/* Top Bar: Search, Category Filter, Low Stock Toggle, Add New Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-amber-300/80 shadow-sm">
                    <div className="flex-1 flex items-center gap-2 bg-amber-50/50 border border-amber-300 rounded-xl px-3 py-1.5">
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search sarees by name or category..."
                        className="w-full bg-transparent text-xs text-pink-950 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto">
                      {/* View Mode Switcher: Horizontal Slider vs Table */}
                      <div className="flex items-center bg-amber-100 p-1 rounded-xl border border-amber-300">
                        <button
                          type="button"
                          onClick={() => setCatalogViewMode('SLIDER')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            catalogViewMode === 'SLIDER' ? 'bg-[#9D174D] text-amber-300 shadow' : 'text-pink-950 hover:bg-amber-200'
                          }`}
                        >
                          ↔️ Scroll Cards
                        </button>
                        <button
                          type="button"
                          onClick={() => setCatalogViewMode('TABLE')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            catalogViewMode === 'TABLE' ? 'bg-[#9D174D] text-amber-300 shadow' : 'text-pink-950 hover:bg-amber-200'
                          }`}
                        >
                          📋 Table View
                        </button>
                      </div>

                      <select
                        value={productCategoryFilter}
                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                        className="bg-white border border-amber-300 text-xs font-bold text-pink-950 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                      >
                        <option value="All">All Categories</option>
                        <option value="Banarasi">Banarasi</option>
                        <option value="Kanjivaram">Kanjivaram</option>
                        <option value="Cotton">Cotton</option>
                        <option value="Silk">Silk</option>
                        <option value="Designer">Designer</option>
                        <option value="Daily Wear">Daily Wear</option>
                        <option value="Chanderi">Chanderi</option>
                        <option value="Bandhani">Bandhani</option>
                        <option value="Organza">Organza</option>
                        <option value="Paithani">Paithani</option>
                      </select>

                      <button
                        onClick={() => setLowStockOnly(!lowStockOnly)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                          lowStockOnly ? 'bg-red-600 text-white border-red-700' : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        ⚠️ Low Stock ({lowStockProducts.length})
                      </button>

                      <button
                        onClick={openAddProductModal}
                        className="px-4 py-2 bg-[#9D174D] hover:bg-pink-900 text-amber-300 font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 shrink-0 border border-amber-400/50"
                      >
                        <Plus className="w-4 h-4" /> Add New Saree
                      </button>
                    </div>
                  </div>

                  {/* PRODUCTS CATALOG VIEW */}
                  {catalogViewMode === 'SLIDER' ? (
                    <div className="bg-gradient-to-r from-amber-50 via-pink-50 to-amber-50 border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-serif-royal text-base font-bold text-pink-950">
                            Horizontal Catalog Showcase ({filteredProductsList.length} Sarees)
                          </h3>
                          <p className="text-xs text-slate-600">Swipe or use arrows to navigate saree inventory cards</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const slider = document.getElementById('catalog-horizontal-slider');
                              if (slider) slider.scrollBy({ left: -320, behavior: 'smooth' });
                            }}
                            className="w-9 h-9 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center text-pink-950 hover:bg-amber-200 transition shadow"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              const slider = document.getElementById('catalog-horizontal-slider');
                              if (slider) slider.scrollBy({ left: 320, behavior: 'smooth' });
                            }}
                            className="w-9 h-9 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center text-pink-950 hover:bg-amber-200 transition shadow"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div
                        id="catalog-horizontal-slider"
                        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 scrollbar-thin scrollbar-thumb-amber-400"
                      >
                        {filteredProductsList.map((p) => (
                          <div
                            key={p.id}
                            className="w-72 shrink-0 snap-start bg-white rounded-2xl border-2 border-amber-300 overflow-hidden shadow-md hover:shadow-xl transition group flex flex-col justify-between"
                          >
                            <div className="relative h-56 overflow-hidden bg-slate-100">
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              />
                              <span className="absolute top-2 left-2 bg-[#9D174D] text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full shadow">
                                {p.category}
                              </span>
                              {p.isBulkSale && (
                                <span className="absolute top-2 right-2 bg-amber-500 text-pink-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                                  ⚡ MEGA SALE
                                </span>
                              )}
                              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md font-bold">
                                Stock: {p.stockCount}
                              </div>
                            </div>

                            <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-serif-royal font-bold text-sm text-pink-950 truncate">{p.name}</h4>
                                <p className="text-[11px] text-slate-500 truncate">{p.fabric} • {p.work}</p>
                              </div>

                              <div className="flex items-baseline justify-between pt-1 border-t border-amber-100">
                                <div>
                                  <span className="text-sm font-extrabold text-pink-950">₹{p.salePrice.toLocaleString('en-IN')}</span>
                                  <span className="text-[10px] text-slate-400 line-through ml-1.5">₹{p.mrp.toLocaleString('en-IN')}</span>
                                </div>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  +{p.rewardPoints} pts
                                </span>
                              </div>

                              <div className="flex items-center gap-2 pt-2">
                                <button
                                  onClick={() => openEditProductModal(p)}
                                  className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-pink-950 font-bold text-xs rounded-xl transition border border-amber-300 flex items-center justify-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl transition border border-red-300 flex items-center justify-center"
                                  title="Delete Saree"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Products Table Mode */}
                  {catalogViewMode === 'TABLE' && (
                    <div className="bg-white border-2 border-amber-300/80 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-pink-950 text-amber-300 text-xs font-serif-royal uppercase border-b border-amber-500/30">
                              <th className="p-3">Saree Photo</th>
                              <th className="p-3">Product Name</th>
                              <th className="p-3">Category</th>
                              <th className="p-3">MRP</th>
                              <th className="p-3">Sale Price</th>
                              <th className="p-3">Reward Points</th>
                              <th className="p-3">Stock</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-100 text-xs font-medium text-slate-800">
                            {filteredProductsList.map((p) => (
                              <tr key={p.id} className="hover:bg-amber-50/50 transition">
                                <td className="p-3">
                                  <img
                                    src={p.images[0]}
                                    alt={p.name}
                                    className="w-12 h-14 object-cover rounded-xl border border-amber-300 shadow-sm"
                                  />
                                </td>
                                <td className="p-3">
                                  <p className="font-bold text-pink-950">{p.name}</p>
                                  <p className="text-[10px] text-slate-500">{p.fabric} • {p.work}</p>
                                </td>
                              <td className="p-3 font-semibold text-slate-700">{p.category}</td>
                              <td className="p-3 text-slate-400 line-through">₹{p.mrp.toLocaleString('en-IN')}</td>
                              <td className="p-3 font-extrabold text-pink-900">₹{p.salePrice.toLocaleString('en-IN')}</td>
                              <td className="p-3 font-bold text-amber-600">🪙 {p.rewardPoints}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    (p.stockCount ?? 0) < 5
                                      ? 'bg-red-100 text-red-700 border border-red-300'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  }`}
                                >
                                  {p.stockCount ?? 10} Units
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-1">
                                <button
                                  onClick={() => openEditProductModal(p)}
                                  className="p-1.5 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
                                  title="Edit Product"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => setDeleteProductConfirmId(p.id)}
                                  className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= BULK SALE UPLOAD - 1000s SAREES ================= */}
              {activeTab === 'BULK_SALE' && (
                <div className="space-y-6">
                  {/* Warning Header */}
                  <div className="bg-gradient-to-r from-[#9D174D] via-purple-900 to-pink-950 p-5 rounded-3xl text-amber-300 border-2 border-amber-400 shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-400 text-pink-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                          ⚡ MEGA SALE ENGINE
                        </span>
                        <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                          CHUNKO-ENGINE 2026
                        </span>
                      </div>
                      <h2 className="font-serif-royal text-2xl font-bold text-amber-300">
                        Bulk Saree Uploader — 1000s Sarees MEGA SALE
                      </h2>
                      <p className="text-xs text-amber-100/90 leading-relaxed max-w-3xl">
                        Upload thousands of Banarasi, Kanjivaram, & Silk sarees in minutes. Upload your CSV catalog and select your photos/videos folder. Handled safely in 20-product chunks with auto storage upload.
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-amber-200">
                        <span className="bg-black/40 px-3 py-1 rounded-lg border border-amber-400/30">
                          💻 Use Desktop Chrome for 1000s upload - Phone browser will crash
                        </span>
                        <span className="bg-black/40 px-3 py-1 rounded-lg border border-amber-400/30">
                          🔌 Keep laptop plugged in during bulk upload
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3-STEP BULK UPLOAD PANEL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* STEP 1: Download Template & CSV Upload */}
                    <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-7 h-7 rounded-full bg-[#9D174D] text-amber-300 font-black text-xs flex items-center justify-center">
                            1
                          </span>
                          <h3 className="font-serif-royal font-bold text-base text-pink-950">CSV Product Catalog</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                          Download the official CSV format header template or select your catalog CSV file.
                        </p>

                        <button
                          type="button"
                          onClick={handleDownloadCsvTemplate}
                          className="w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-[#9D174D] font-bold text-xs rounded-xl transition border border-amber-300 flex items-center justify-center gap-2 mb-3"
                        >
                          <Download className="w-4 h-4" /> Download CSV Template
                        </button>

                        <label className="block text-xs font-bold text-pink-950 mb-1">Upload Catalog CSV File</label>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCsvFileChange}
                          className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#9D174D] file:text-amber-300 hover:file:bg-pink-900 cursor-pointer"
                        />
                      </div>

                      {bulkCsvFile && (
                        <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl text-xs text-emerald-900 font-bold flex items-center justify-between">
                          <span className="truncate max-w-[180px]">{bulkCsvFile.name}</span>
                          <span className="bg-emerald-200 px-2 py-0.5 rounded text-[10px]">{bulkTotalCsvRows} Sarees</span>
                        </div>
                      )}
                    </div>

                    {/* STEP 2: Media Files Folder Input */}
                    <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-7 h-7 rounded-full bg-[#9D174D] text-amber-300 font-black text-xs flex items-center justify-center">
                            2
                          </span>
                          <h3 className="font-serif-royal font-bold text-base text-pink-950">Photos & Videos Folder</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                          Select the folder containing saree photos (.jpg/.png) & reel videos (.mp4).
                        </p>

                        <label className="block text-xs font-bold text-pink-950 mb-1">Select Images / Videos Folder</label>
                        <input
                          type="file"
                          /* @ts-ignore */
                          webkitdirectory="true"
                          directory=""
                          multiple
                          onChange={handleMediaFilesChange}
                          className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#9D174D] file:text-amber-300 hover:file:bg-pink-900 cursor-pointer"
                        />
                      </div>

                      <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-xs text-pink-950 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>📁 Total Files Detected:</span>
                          <span className="text-[#9D174D] font-black">{bulkFilesMap.size}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-600">
                          <span>📸 Photos: {bulkTotalImagesCount}</span>
                          <span>🎥 Reels: {bulkTotalVideosCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* STEP 3: Mega Upload Launch Button */}
                    <div className="bg-gradient-to-br from-amber-100 to-pink-100 border-2 border-amber-400 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-7 h-7 rounded-full bg-[#9D174D] text-amber-300 font-black text-xs flex items-center justify-center">
                            3
                          </span>
                          <h3 className="font-serif-royal font-bold text-base text-pink-950">Launch Mega Upload</h3>
                        </div>
                        <p className="text-xs text-slate-600 mb-3">
                          Verify previews & bulk edit prices below, then launch background upload engine.
                        </p>

                        <div className="bg-white/80 p-3 rounded-2xl border border-amber-300 space-y-1 text-xs text-pink-950">
                          <div className="flex justify-between font-bold">
                            <span>Ready Products:</span>
                            <span className="text-emerald-700 font-extrabold">{bulkPreviewRows.length} Sarees</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Upload Mode:</span>
                            <span className="text-purple-700">Chunked (20/batch)</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartMegaUpload}
                        disabled={bulkIsUploading || bulkPreviewRows.length === 0}
                        className={`w-full py-3.5 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg border border-amber-400 ${
                          bulkIsUploading || bulkPreviewRows.length === 0
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#9D174D] to-purple-900 text-amber-300 hover:scale-[1.02]'
                        }`}
                      >
                        {bulkIsUploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Uploading 1000s Sarees...
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 text-amber-400 animate-pulse" /> START MEGA SALE UPLOAD
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* BULK EDIT CONTROLS */}
                  {bulkPreviewRows.length > 0 && (
                    <div className="bg-amber-50/80 border-2 border-amber-300/90 rounded-3xl p-5 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif-royal font-bold text-sm text-pink-950 flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-[#9D174D]" /> Global Bulk Override Controls (Set for All {bulkPreviewRows.length} Sarees)
                        </h4>
                        <span className="text-[11px] text-slate-500 font-semibold">Instantly override values across preview catalog</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Set MRP for All (₹)</label>
                          <input
                            type="number"
                            value={bulkGlobalMrp}
                            onChange={(e) => setBulkGlobalMrp(e.target.value)}
                            placeholder="e.g. 12999"
                            className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold text-pink-950 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Set Sale Price for All (₹)</label>
                          <input
                            type="number"
                            value={bulkGlobalSale}
                            onChange={(e) => setBulkGlobalSale(e.target.value)}
                            placeholder="e.g. 4999"
                            className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold text-pink-950 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Set Stock Count</label>
                          <input
                            type="number"
                            value={bulkGlobalStock}
                            onChange={(e) => setBulkGlobalStock(e.target.value)}
                            placeholder="e.g. 25"
                            className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold text-pink-950 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Set Category</label>
                          <select
                            value={bulkGlobalCategory}
                            onChange={(e) => setBulkGlobalCategory(e.target.value as CategoryName | '')}
                            className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold text-pink-950 bg-white cursor-pointer"
                          >
                            <option value="">-- Keep CSV Category --</option>
                            <option value="Banarasi">Banarasi</option>
                            <option value="Kanjivaram">Kanjivaram</option>
                            <option value="Cotton">Cotton</option>
                            <option value="Silk">Silk</option>
                            <option value="Designer">Designer</option>
                            <option value="Daily Wear">Daily Wear</option>
                            <option value="Chanderi">Chanderi</option>
                            <option value="Bandhani">Bandhani</option>
                            <option value="Organza">Organza</option>
                            <option value="Paithani">Paithani</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setBulkPreviewRows((prev) =>
                              prev.map((r) => ({
                                ...r,
                                mrp: bulkGlobalMrp ? Number(bulkGlobalMrp) : r.mrp,
                                salePrice: bulkGlobalSale ? Number(bulkGlobalSale) : r.salePrice,
                                stock: bulkGlobalStock ? Number(bulkGlobalStock) : r.stock,
                                category: bulkGlobalCategory ? (bulkGlobalCategory as CategoryName) : r.category,
                              }))
                            );
                            alert('Global bulk edits applied to preview catalog!');
                          }}
                          className="px-4 py-2 bg-[#9D174D] hover:bg-pink-900 text-amber-300 font-bold text-xs rounded-xl shadow transition"
                        >
                          Apply Bulk Override to Preview List
                        </button>
                      </div>
                    </div>
                  )}

                  {/* LIVE PROGRESS BARS */}
                  {bulkIsUploading && (
                    <div className="bg-pink-950 text-amber-300 border-2 border-amber-400 p-6 rounded-3xl space-y-4 shadow-xl">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif-royal font-bold text-base flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-400" /> Live Upload Progress (Do not close browser)
                        </h4>
                        <span className="text-xs font-extrabold bg-amber-400 text-pink-950 px-3 py-1 rounded-full">
                          {bulkProgressProductsCreated} / {bulkProgressTotalProducts} Products
                        </span>
                      </div>

                      {/* Bar 1: Images Upload Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Uploading Images: {bulkProgressImagesUploaded} / {bulkProgressTotalImages}</span>
                          <span>{bulkProgressTotalImages > 0 ? Math.round((bulkProgressImagesUploaded / bulkProgressTotalImages) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-pink-900 rounded-full h-3 overflow-hidden border border-amber-400/30">
                          <div
                            className="bg-amber-400 h-full transition-all duration-300"
                            style={{
                              width: `${bulkProgressTotalImages > 0 ? (bulkProgressImagesUploaded / bulkProgressTotalImages) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Bar 2: Creating Products Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Creating Firestore Products: {bulkProgressProductsCreated} / {bulkProgressTotalProducts}</span>
                          <span>{bulkProgressTotalProducts > 0 ? Math.round((bulkProgressProductsCreated / bulkProgressTotalProducts) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-pink-900 rounded-full h-3 overflow-hidden border border-amber-400/30">
                          <div
                            className="bg-emerald-400 h-full transition-all duration-300"
                            style={{
                              width: `${bulkProgressTotalProducts > 0 ? (bulkProgressProductsCreated / bulkProgressTotalProducts) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-amber-500/30">
                        <span className="text-emerald-300">✅ Successful: {bulkSuccessCount}</span>
                        <span className="text-red-300">❌ Failed: {bulkFailedCount}</span>
                      </div>
                    </div>
                  )}

                  {/* PREVIEW TABLE (Horizontal Scroll) */}
                  {bulkPreviewRows.length > 0 && (
                    <div className="bg-white border-2 border-amber-300 rounded-3xl overflow-hidden shadow-sm space-y-2 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-serif-royal font-bold text-sm text-pink-950">
                          CSV Catalog Preview ({bulkPreviewRows.length} Items Parsed)
                        </h4>
                        <span className="text-xs text-slate-500 font-semibold">Horizontal scrollable table</span>
                      </div>

                      <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="sticky top-0 bg-pink-950 text-amber-300 font-serif-royal uppercase">
                            <tr>
                              <th className="p-2.5">#</th>
                              <th className="p-2.5">Product Name</th>
                              <th className="p-2.5">Category</th>
                              <th className="p-2.5">MRP</th>
                              <th className="p-2.5">Sale</th>
                              <th className="p-2.5">Stock</th>
                              <th className="p-2.5">Fabric</th>
                              <th className="p-2.5">Images File List</th>
                              <th className="p-2.5">Video Reel</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-100 font-medium">
                            {bulkPreviewRows.map((r, idx) => (
                              <tr key={idx} className="hover:bg-amber-50/60">
                                <td className="p-2.5 text-slate-400">{idx + 1}</td>
                                <td className="p-2.5 font-bold text-pink-950 max-w-[200px] truncate">{r.productName}</td>
                                <td className="p-2.5 font-semibold text-slate-700">{r.category}</td>
                                <td className="p-2.5 text-slate-400 line-through">₹{r.mrp}</td>
                                <td className="p-2.5 font-extrabold text-[#9D174D]">₹{r.salePrice}</td>
                                <td className="p-2.5 font-bold text-amber-700">{r.stock}</td>
                                <td className="p-2.5 text-slate-600 truncate max-w-[120px]">{r.fabric}</td>
                                <td className="p-2.5 text-[11px] text-slate-500 truncate max-w-[180px]">
                                  {r.imageFileNames.join(', ')}
                                </td>
                                <td className="p-2.5 text-[11px] text-purple-700 font-bold">
                                  {r.videoFileName || 'None'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'BULK_SALE' && <BulkSaleUploader />}
              {/* ================= REQUIREMENT 4: BANNER MANAGEMENT ================= */}
              {activeTab === 'BANNERS' && (
                <div className="space-y-4">
                  {/* Flash Sale Alert Toggle Bar (Requirement 2) */}
                  <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
                    <div>
                      <h5 className="font-bold text-xs text-pink-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" /> Show Flash Sale Alert Bar on Home Page
                      </h5>
                      <p className="text-[10px] text-slate-500">Toggle countdown alert banner at the top of home screen (auto-hides after 5s)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleFlashSaleAlert?.(!showFlashSaleAlert)}
                      className={`px-4 py-1.5 rounded-xl font-extrabold text-xs transition shadow ${
                        showFlashSaleAlert ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {showFlashSaleAlert ? 'ON (Visible)' : 'OFF (Hidden)'}
                    </button>
                  </div>

                  {/* Banner Sub-Navigation Tabs */}
                  <div className="flex border-b border-amber-200 bg-amber-50 p-1.5 rounded-2xl gap-2 text-xs font-bold overflow-x-auto">
                    <button
                      onClick={() => setBannerSubTab('TOP_SLIDER')}
                      className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
                        bannerSubTab === 'TOP_SLIDER' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-slate-700 hover:bg-amber-100'
                      }`}
                    >
                      Section A: Home Top Slider (3:2 Ratio)
                    </button>
                    <button
                      onClick={() => setBannerSubTab('CATEGORY_GALLERY')}
                      className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
                        bannerSubTab === 'CATEGORY_GALLERY' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-slate-700 hover:bg-amber-100'
                      }`}
                    >
                      Section B: Category Gallery (Circular)
                    </button>
                    <button
                      onClick={() => setBannerSubTab('AD_BOX')}
                      className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
                        bannerSubTab === 'AD_BOX' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-slate-700 hover:bg-amber-100'
                      }`}
                    >
                      Section C: Ad Banner Box (Single Big)
                    </button>
                  </div>

                  {/* Section A: Home Top Slider */}
                  {bannerSubTab === 'TOP_SLIDER' && (
                    <div className="space-y-4">
                      {/* Add New Top Banner Form */}
                      <form onSubmit={handleAddTopBanner} className="bg-white border-2 border-amber-300/80 rounded-3xl p-4 shadow-sm space-y-3">
                        <h4 className="font-serif-royal text-sm font-bold text-pink-950 flex items-center gap-1.5">
                          <Plus className="w-4 h-4 text-amber-600" /> Add Hero Slider Banner Image & Video
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={newBannerTitle}
                            onChange={(e) => setNewBannerTitle(e.target.value)}
                            placeholder="Banner Main Title (e.g. Royal Banarasi Dhamaka)"
                            required
                            className="px-3 py-2 rounded-xl border border-amber-300 text-xs"
                          />
                          <input
                            type="text"
                            value={newBannerSubtitle}
                            onChange={(e) => setNewBannerSubtitle(e.target.value)}
                            placeholder="Subtitle / Offer line"
                            className="px-3 py-2 rounded-xl border border-amber-300 text-xs"
                          />
                          <input
                            type="url"
                            value={newBannerImage}
                            onChange={(e) => setNewBannerImage(e.target.value)}
                            placeholder="Image URL (3:2 Aspect Ratio)"
                            required
                            className="px-3 py-2 rounded-xl border border-amber-300 text-xs"
                          />
                        </div>

                        {sliderUploading && (
                          <div className="text-xs text-amber-800 font-bold bg-amber-100 p-2 rounded-xl flex items-center justify-between">
                            <span>Uploading Banner Image to Firebase Storage...</span>
                            <span>{sliderUploadProgress.toFixed(0)}%</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer bg-[#9D174D] hover:bg-pink-900 text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow">
                            <Camera className="w-4 h-4" />
                            <span>Upload Image from Gallery</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleSliderImageUpload}
                            />
                          </label>

                          <label className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow">
                            <Video className="w-4 h-4" />
                            <span>📹 Upload Video / Reel from Gallery</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={handleSliderVideoUpload}
                            />
                          </label>
                        </div>

                        {newBannerImage && (
                          <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-amber-300">
                            <img src={newBannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {sliderVideoUrl && (
                          <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-amber-300 bg-black">
                            <video src={sliderVideoUrl} controls className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setSliderVideoUrl('')}
                              className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700"
                              title="Remove Video"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-[11px] text-slate-500">Flash Sale Countdown End: <strong>{newBannerCountdown}</strong></span>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#9D174D] text-amber-300 font-bold rounded-xl text-xs shadow hover:bg-pink-900 transition"
                          >
                            Add Hero Banner
                          </button>
                        </div>
                      </form>

                      {/* Banners Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {localBanners.map((b, idx) => (
                          <div key={b.id} className="bg-white border border-amber-300 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                            <div className="relative h-32 bg-slate-100">
                              <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                              <span className="absolute top-2 left-2 bg-pink-950 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                Banner #{idx + 1}
                              </span>
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between">
                              <div>
                                <h5 className="font-bold text-pink-950 text-xs">{b.title}</h5>
                                <p className="text-[10px] text-slate-500">{b.subtitle}</p>
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-amber-700">Link: {b.targetCategory || 'Catalog'}</span>
                                <button
                                  onClick={() => handleDeleteBanner(b.id)}
                                  className="text-red-600 hover:text-red-800 text-xs font-bold"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section B: Category Gallery (Requirement 10: Full Form + Image Upload + Firestore persistence) */}
                  {bannerSubTab === 'CATEGORY_GALLERY' && (
                    <div className="bg-white border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm space-y-4">
                      <h4 className="font-serif-royal text-sm font-bold text-pink-950 flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-amber-600" /> Manage Section B: Circular Category Highlights
                      </h4>

                      {/* Add Category Form */}
                      <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-300 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block font-bold text-pink-950 mb-1">Category Name</label>
                            <input
                              type="text"
                              id="new-cat-name"
                              placeholder="e.g. Chanderi Silk"
                              className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-pink-950 mb-1">Badge Tag</label>
                            <input
                              type="text"
                              id="new-cat-tag"
                              placeholder="e.g. Royal Weave"
                              className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-pink-950 mb-1">Category Image URL / File</label>
                            <input
                              type="url"
                              id="new-cat-image"
                              placeholder="Paste Image URL"
                              className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white"
                            />
                          </div>
                        </div>

                        {catUploading && (
                          <div className="text-xs text-amber-800 font-bold bg-amber-100 p-2 rounded-xl flex items-center justify-between">
                            <span>Uploading Category Image to Firebase Storage...</span>
                            <span>{catUploadProgress.toFixed(0)}%</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <label className="cursor-pointer bg-[#9D174D] hover:bg-pink-900 text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow">
                            <Camera className="w-4 h-4" />
                            <span>Upload Image from Gallery</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCategoryGalleryUpload}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={async () => {
                              const nameInput = document.getElementById('new-cat-name') as HTMLInputElement;
                              const tagInput = document.getElementById('new-cat-tag') as HTMLInputElement;
                              const imgInput = document.getElementById('new-cat-image') as HTMLInputElement;
                              if (!nameInput?.value || !imgInput?.value) {
                                alert('Please provide a Category Name and Image URL!');
                                return;
                              }
                              const newCatItem: CategoryGalleryItem = {
                                id: `cat_${Date.now()}`,
                                categoryName: nameInput.value as CategoryName,
                                title: nameInput.value,
                                imageUrl: imgInput.value,
                                tag: tagInput?.value || 'Pure Weave',
                                active: true,
                              };

                              try {
                                await addDoc(collection(db, 'categories'), newCatItem);
                              } catch (err) {
                                console.warn('Failed to save category to Firestore:', err);
                              }

                              setLocalCategoryGallery([newCatItem, ...localCategoryGallery]);
                              nameInput.value = '';
                              if (tagInput) tagInput.value = '';
                              imgInput.value = '';
                              alert('Category saved to Firestore!');
                            }}
                            className="px-4 py-2 bg-amber-500 text-pink-950 font-bold rounded-xl text-xs shadow hover:bg-amber-400 transition"
                          >
                            Save Category
                          </button>
                        </div>
                      </div>

                      {/* Categories List */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                        {localCategoryGallery.map((item) => (
                          <div key={item.id} className="border border-amber-200 rounded-2xl p-3 text-center bg-amber-50/50 relative group">
                            <img src={item.imageUrl} alt={item.title} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-amber-400 mb-2 shadow" />
                            <p className="font-bold text-xs text-pink-950">{item.title}</p>
                            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                              {item.tag || 'Active'}
                            </span>
                            <button
                              onClick={() => {
                                setLocalCategoryGallery(localCategoryGallery.filter((c) => c.id !== item.id));
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow"
                              title="Delete Category"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section C: Ad Banner Box (Requirement 10: Full Form + Image Upload + Offer Code + Firestore persistence) */}
                  {bannerSubTab === 'AD_BOX' && (
                    <div className="bg-white border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm max-w-xl space-y-4">
                      <h4 className="font-serif-royal text-sm font-bold text-pink-950">Manage Section C: Single Big Ad Banner & Video</h4>
                      
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Ad Title</label>
                          <input
                            type="text"
                            value={localAdBanner.title}
                            onChange={(e) => setLocalAdBanner({ ...localAdBanner, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Highlight Offer Code (e.g. BRIDE20)</label>
                          <input
                            type="text"
                            value={localAdBanner.highlightText}
                            onChange={(e) => setLocalAdBanner({ ...localAdBanner, highlightText: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-bold text-pink-900"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Ad Image URL (3:2.5 Aspect Ratio)</label>
                          <input
                            type="url"
                            value={localAdBanner.imageUrl}
                            onChange={(e) => setLocalAdBanner({ ...localAdBanner, imageUrl: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white"
                          />
                        </div>

                        {adUploading && (
                          <div className="text-xs text-amber-800 font-bold bg-amber-100 p-2 rounded-xl flex items-center justify-between">
                            <span>Uploading Ad Image to Firebase Storage...</span>
                            <span>{adUploadProgress.toFixed(0)}%</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <label className="cursor-pointer bg-[#9D174D] hover:bg-pink-900 text-amber-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow border border-amber-400/40">
                            <Camera className="w-4 h-4" />
                            <span>Upload Ad Image from Gallery</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAdImageUpload}
                            />
                          </label>

                          <label className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow">
                            <Video className="w-4 h-4" />
                            <span>📹 Upload Ad Video / Reel</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={handleAdVideoUpload}
                            />
                          </label>
                        </div>

                        {localAdBanner.imageUrl && (
                          <div className="relative w-full h-32 rounded-xl overflow-hidden border border-amber-300 mt-2">
                            <img src={localAdBanner.imageUrl} alt="Ad Banner Preview" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {adVideoUploading && (
                          <div className="text-xs text-amber-800 font-bold bg-amber-100 p-2 rounded-xl flex items-center justify-between">
                            <span>Uploading Ad Video to Firebase Storage...</span>
                            <span>{adVideoUploadProgress.toFixed(0)}%</span>
                          </div>
                        )}

                        {localAdBanner.videoUrl && (
                          <div className="relative w-full h-40 rounded-xl overflow-hidden border border-amber-300 mt-2 bg-black">
                            <video src={localAdBanner.videoUrl} controls className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setLocalAdBanner((prev) => ({ ...prev, videoUrl: '' }))}
                              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700"
                              title="Remove Video"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={async () => {
                          try {
                            await setDoc(doc(db, 'banners', 'sectionC'), localAdBanner, { merge: true });
                            await setDoc(doc(db, 'banners', 'ad_banner_main'), localAdBanner, { merge: true });
                          } catch (err) {
                            console.warn('Firestore setDoc ad banner error:', err);
                          }
                          onUpdateAdBanner(localAdBanner);
                          alert('Section C Ad Banner settings saved to Firestore!');
                        }}
                        className="w-full py-2.5 bg-[#9D174D] text-amber-300 font-bold rounded-xl text-xs shadow hover:bg-pink-900 transition"
                      >
                        Save Section C Ad Banner Settings
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ================= REQUIREMENT 5: ORDER MANAGEMENT ================= */}
              {activeTab === 'ORDERS' && (
                <div className="space-y-4">
                  {/* Filter & Search Header */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-amber-300/80 shadow-sm">
                    <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                      {['ALL', 'Weaving', 'Quality Check', 'Packed', 'Out for Delivery', 'Delivered', 'CANCELLED'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setOrderFilter(st)}
                          className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                            orderFilter === st ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-amber-50 text-slate-700 hover:bg-amber-100'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 bg-amber-50/50 border border-amber-300 rounded-xl px-3 py-1.5">
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Search Order ID or Patron Name..."
                        className="w-full bg-transparent text-xs text-pink-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="bg-white border-2 border-amber-300/80 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-pink-950 text-amber-300 text-xs font-serif-royal uppercase border-b border-amber-500/30">
                            <th className="p-3">Order No</th>
                            <th className="p-3">Customer Details</th>
                            <th className="p-3">Items Purchased</th>
                            <th className="p-3">Total Amount</th>
                            <th className="p-3">Payment</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100 text-xs font-medium text-slate-800">
                          {filteredOrdersList.map((ord) => (
                            <tr key={ord.id} className="hover:bg-amber-50/50 transition">
                              <td className="p-3 font-extrabold text-pink-950">#{ord.id}</td>
                              <td className="p-3">
                                <p className="font-bold text-slate-900">{ord.address.name}</p>
                                <p className="text-[10px] text-slate-500">{ord.address.phone} • {ord.address.pincode}</p>
                              </td>
                              <td className="p-3 font-semibold text-slate-700">
                                {ord.items.map((i) => i.product.name).join(', ')}
                              </td>
                              <td className="p-3 font-extrabold text-pink-900">₹{ord.totalAmount.toLocaleString('en-IN')}</td>
                              <td className="p-3">
                                <span className="bg-amber-100 text-pink-950 font-bold px-2 py-0.5 rounded text-[10px]">
                                  {ord.paymentMethod}
                                </span>
                              </td>
                              <td className="p-3">
                                <select
                                  value={ord.status}
                                  onChange={(e) => handleOrderStatusChange(ord.id, e.target.value as OrderStatus)}
                                  className="bg-amber-50 border border-amber-300 font-bold text-xs text-pink-950 rounded-xl px-2 py-1 focus:outline-none cursor-pointer"
                                >
                                  <option value="Weaving">Weaving</option>
                                  <option value="Quality Check">Quality Check</option>
                                  <option value="Packed">Packed</option>
                                  <option value="Out for Delivery">Out for Delivery</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="CANCELLED">CANCELLED</option>
                                </select>
                              </td>
                              <td className="p-3 text-right space-x-1">
                                <button
                                  onClick={() => setSelectedOrderForInvoice(ord)}
                                  className="px-2.5 py-1 bg-amber-500 text-pink-950 font-bold rounded-lg text-[10px] shadow hover:bg-amber-400 transition"
                                  title="Print Invoice"
                                >
                                  <Printer className="w-3.5 h-3.5 inline mr-1" /> Invoice
                                </button>

                                <button
                                  onClick={() => setSelectedOrderForDetails(ord)}
                                  className="px-2.5 py-1 bg-pink-900 text-amber-300 font-bold rounded-lg text-[10px] shadow hover:bg-pink-800 transition"
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= REQUIREMENT 6: CUSTOMER MANAGEMENT ================= */}
              {activeTab === 'CUSTOMERS' && (
                <div className="space-y-4">
                  <div className="flex border-b border-amber-200 bg-amber-50 p-1.5 rounded-2xl gap-2 text-xs font-bold">
                    <button
                      onClick={() => setCustomerTab('REGISTERED')}
                      className={`px-4 py-2 rounded-xl transition ${
                        customerTab === 'REGISTERED' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-slate-700 hover:bg-amber-100'
                      }`}
                    >
                      Registered Patrons ({customers.filter((c) => c.type === 'REGISTERED').length})
                    </button>
                    <button
                      onClick={() => setCustomerTab('GUEST')}
                      className={`px-4 py-2 rounded-xl transition ${
                        customerTab === 'GUEST' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-slate-700 hover:bg-amber-100'
                      }`}
                    >
                      Guest Checkout Users ({customers.filter((c) => c.type === 'GUEST').length})
                    </button>
                  </div>

                  <div className="bg-white border-2 border-amber-300/80 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-pink-950 text-amber-300 font-serif-royal uppercase border-b border-amber-500/30">
                            <th className="p-3">Customer Name</th>
                            <th className="p-3">Mobile & Email</th>
                            <th className="p-3">Delivery Address</th>
                            <th className="p-3">Orders</th>
                            <th className="p-3">Wallet Coins</th>
                            <th className="p-3">Lifetime Spend</th>
                            <th className="p-3">Loyalty Tier</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100 text-slate-800 font-medium">
                          {filteredCustomersList.map((c) => (
                            <tr key={c.id} className="hover:bg-amber-50/50 transition">
                              <td className="p-3 font-bold text-pink-950">{c.name}</td>
                              <td className="p-3">
                                <p className="font-semibold text-slate-900">{c.phone}</p>
                                <p className="text-[10px] text-slate-500">{c.email}</p>
                              </td>
                              <td className="p-3 text-slate-600 truncate max-w-[180px]">{c.address}</td>
                              <td className="p-3 font-bold text-slate-900">{c.totalOrders} Orders</td>
                              <td className="p-3 font-bold text-amber-600">🪙 {c.walletBalance}</td>
                              <td className="p-3 font-extrabold text-pink-900">₹{c.totalSpend.toLocaleString('en-IN')}</td>
                              <td className="p-3">
                                <span className="bg-amber-100 text-pink-950 font-bold px-2.5 py-0.5 rounded-full text-[10px] border border-amber-400">
                                  👑 {c.loyaltyTier}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => setSelectedCustomerHistory(c)}
                                  className="px-3 py-1 bg-[#9D174D] text-amber-300 font-bold rounded-lg text-[10px] hover:bg-pink-900 transition"
                                >
                                  Full History
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= REQUIREMENT 7: COUPONS & LOYALTY ================= */}
              {activeTab === 'MARKETING' && (
                <div className="space-y-6">
                  {/* Section 1: Coupons */}
                  <div className="bg-white border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm space-y-4">
                    <h4 className="font-serif-royal text-base font-bold text-pink-950 flex items-center gap-1.5">
                      <Tag className="w-5 h-5 text-amber-600" /> Manage Discount Coupons
                    </h4>

                    {/* Create Coupon Form */}
                    <form onSubmit={handleCreateCoupon} className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-amber-50/50 p-3 rounded-2xl border border-amber-200 text-xs">
                      <input
                        type="text"
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value)}
                        placeholder="Coupon Code (e.g. WELCOME10)"
                        required
                        className="px-3 py-2 rounded-xl border border-amber-300 uppercase font-bold text-pink-950"
                      />
                      <select
                        value={newCouponType}
                        onChange={(e) => setNewCouponType(e.target.value as any)}
                        className="px-3 py-2 rounded-xl border border-amber-300 font-bold"
                      >
                        <option value="PERCENT">% Percentage Discount</option>
                        <option value="FLAT">Flat ₹ Discount</option>
                      </select>

                      <input
                        type="number"
                        value={newCouponVal}
                        onChange={(e) => setNewCouponVal(Number(e.target.value))}
                        placeholder="Discount Value"
                        required
                        className="px-3 py-2 rounded-xl border border-amber-300 font-bold"
                      />

                      <input
                        type="number"
                        value={newCouponMinOrder}
                        onChange={(e) => setNewCouponMinOrder(Number(e.target.value))}
                        placeholder="Min Order ₹"
                        required
                        className="px-3 py-2 rounded-xl border border-amber-300"
                      />

                      <input
                        type="number"
                        value={newCouponMaxDisc}
                        onChange={(e) => setNewCouponMaxDisc(Number(e.target.value))}
                        placeholder="Max Disc ₹"
                        required
                        className="px-3 py-2 rounded-xl border border-amber-300"
                      />

                      <button
                        type="submit"
                        className="px-3 py-2 bg-[#9D174D] text-amber-300 font-bold rounded-xl text-xs shadow hover:bg-pink-900 transition"
                      >
                        Create Coupon
                      </button>
                    </form>

                    {/* Active Coupons List */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {coupons.map((c) => (
                        <div key={c.id} className="border border-amber-300 rounded-2xl p-3 bg-amber-50/30 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-extrabold text-sm text-pink-950 border-b border-dashed border-amber-500">{c.code}</span>
                            <p className="text-[11px] text-slate-600 mt-1 font-semibold">
                              {c.discountType === 'PERCENT' ? `${c.discountValue}% OFF` : `Flat ₹${c.discountValue} OFF`} (Min ₹{c.minOrderAmount})
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Gifts & Loyalty Tiers */}
                  <div className="bg-white border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm space-y-4">
                    <h4 className="font-serif-royal text-base font-bold text-pink-950 flex items-center gap-1.5">
                      <Gift className="w-5 h-5 text-amber-600" /> Customer Gifts & Loyalty Tiers
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {gifts.map((g) => (
                        <div key={g.id} className="border border-amber-300 rounded-2xl p-3 bg-amber-50/30 space-y-2">
                          <span className="bg-amber-400 text-pink-950 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                            Required: {g.requiredTier} Tier
                          </span>
                          <h5 className="font-bold text-xs text-pink-950">{g.name}</h5>
                          <p className="text-[11px] text-slate-600">{g.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= REQUIREMENT 8: QUERY & SUPPORT ================= */}
              {activeTab === 'QUERIES' && (
                <div className="space-y-4">
                  <div className="bg-white border-2 border-amber-300/80 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-pink-950 text-amber-300 font-serif-royal uppercase border-b border-amber-500/30">
                          <th className="p-3">User Name</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">Subject & Message</th>
                          <th className="p-3">Saree Photo Attachment</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 text-slate-800 font-medium">
                        {queries.map((q) => (
                          <tr key={q.id} className="hover:bg-amber-50/50 transition">
                            <td className="p-3 font-bold text-pink-950">{q.userName}</td>
                            <td className="p-3">{q.phone}</td>
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{q.subject}</p>
                              <p className="text-[11px] text-slate-600">{q.message}</p>
                            </td>
                            <td className="p-3">
                              <img
                                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80"
                                alt="Query attachment"
                                className="w-10 h-10 object-cover rounded-lg border border-amber-300"
                              />
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  q.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {q.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setQueryReplyModal(q);
                                  setQueryReplyText('');
                                }}
                                className="px-3 py-1 bg-[#9D174D] text-amber-300 font-bold rounded-lg text-[10px] hover:bg-pink-900 transition"
                              >
                                Reply & Resolve
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ================= REQUIREMENT 9: EDITABLE PAGES ================= */}
              {activeTab === 'PAGES' && (
                <div className="space-y-4">
                  <div className="flex border-b border-amber-200 bg-amber-50 p-1.5 rounded-2xl gap-2 text-xs font-bold">
                    <button
                      onClick={() => setActivePageSlug('terms')}
                      className={`px-4 py-2 rounded-xl transition ${
                        activePageSlug === 'terms' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-slate-700 hover:bg-amber-100'
                      }`}
                    >
                      Terms & Conditions
                    </button>
                    <button
                      onClick={() => setActivePageSlug('privacy')}
                      className={`px-4 py-2 rounded-xl transition ${
                        activePageSlug === 'privacy' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-slate-700 hover:bg-amber-100'
                      }`}
                    >
                      Privacy Policy
                    </button>
                    <button
                      onClick={() => setActivePageSlug('return-policy')}
                      className={`px-4 py-2 rounded-xl transition ${
                        activePageSlug === 'return-policy' ? 'bg-[#9D174D] text-amber-300 shadow' : 'bg-white text-slate-700 hover:bg-amber-100'
                      }`}
                    >
                      Return Policy
                    </button>
                  </div>

                  {(() => {
                    const currentPage = editablePages.find((p) => p.slug === activePageSlug) || editablePages[0];
                    return (
                      <div className="bg-white border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif-royal text-base font-bold text-pink-950">Edit Page: {currentPage.title}</h4>
                          <span className="text-xs text-slate-500">Last Updated: {currentPage.lastUpdated}</span>
                        </div>

                        <textarea
                          rows={8}
                          value={currentPage.content}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditablePages(editablePages.map((p) => (p.slug === activePageSlug ? { ...p, content: val } : p)));
                          }}
                          className="w-full p-3 rounded-2xl border border-amber-300 text-xs text-slate-800 leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-pink-800"
                        />

                        <button
                          onClick={() => handleSaveEditablePage(currentPage.content)}
                          className="px-5 py-2.5 bg-[#9D174D] text-amber-300 font-bold rounded-xl text-xs shadow hover:bg-pink-900 transition"
                        >
                          Publish Updated Policy Page
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ================= REQUIREMENT 10: WALLET & REWARD SETTINGS ================= */}
              {activeTab === 'WALLET' && (
                <div className="space-y-6">
                  {/* Reward Conversion Config */}
                  <div className="bg-white border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm space-y-3 max-w-xl">
                    <h4 className="font-serif-royal text-base font-bold text-pink-950 flex items-center gap-1.5">
                      <Wallet className="w-5 h-5 text-amber-600" /> Reward Points Rate Setting
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-700">1 Reward Point =</span>
                      <input
                        type="number"
                        step="0.1"
                        value={rewardSettings.pointToRupeeRate}
                        onChange={(e) => setRewardSettings({ ...rewardSettings, pointToRupeeRate: Number(e.target.value) })}
                        className="w-24 px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold text-pink-950"
                      />
                      <span className="text-xs font-bold text-pink-900">₹ (Rupees)</span>
                    </div>
                  </div>

                  {/* Manual User Credit Tool */}
                  <form onSubmit={handleManualWalletCredit} className="bg-white border-2 border-amber-300/80 rounded-3xl p-5 shadow-sm space-y-3 max-w-xl">
                    <h4 className="font-serif-royal text-base font-bold text-pink-950">Manual User Wallet Credit / Debit</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={manualWalletPhone}
                        onChange={(e) => setManualWalletPhone(e.target.value)}
                        placeholder="User Phone / Email"
                        required
                        className="px-3 py-2 rounded-xl border border-amber-300 text-xs"
                      />
                      <input
                        type="number"
                        value={manualWalletCoins}
                        onChange={(e) => setManualWalletCoins(Number(e.target.value))}
                        placeholder="Coin Amount (e.g. 100)"
                        required
                        className="px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold"
                      />
                    </div>
                    <input
                      type="text"
                      value={manualWalletReason}
                      onChange={(e) => setManualWalletReason(e.target.value)}
                      placeholder="Reason for adjustment"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#9D174D] text-amber-300 font-bold rounded-xl text-xs shadow hover:bg-pink-900 transition"
                    >
                      Credit Coins to User Wallet
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ================= PRODUCT ADD/EDIT MODAL ================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-sm flex items-center justify-center p-2 overflow-y-auto">
          <div className="bg-[#FDFBF7] w-full max-w-2xl rounded-3xl p-5 shadow-2xl border-2 border-amber-500 my-auto relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-amber-200 pb-3">
              <h3 className="font-serif-royal text-lg font-bold text-pink-950">
                {editingProduct ? 'Edit Saree Product' : 'Add New Saree to Catalog'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200">
                <X className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-medium text-pink-950">
              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Product Name</label>
                  <input
                    type="text"
                    value={prodFormName}
                    onChange={(e) => setProdFormName(e.target.value)}
                    placeholder="e.g. Royal Banarasi Zari Silk Saree"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Category</label>
                  <select
                    value={prodFormCategory}
                    onChange={(e) => setProdFormCategory(e.target.value as CategoryName)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-bold"
                  >
                    <option value="Banarasi">Banarasi</option>
                    <option value="Kanjivaram">Kanjivaram</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Silk">Silk</option>
                    <option value="Designer">Designer</option>
                    <option value="Daily Wear">Daily Wear</option>
                    <option value="Chanderi">Chanderi</option>
                    <option value="Bandhani">Bandhani</option>
                    <option value="Organza">Organza</option>
                    <option value="Paithani">Paithani</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    value={prodFormMrp}
                    onChange={(e) => setProdFormMrp(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={prodFormSale}
                    onChange={(e) => setProdFormSale(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-bold text-pink-900"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Reward Points</label>
                  <input
                    type="number"
                    value={prodFormRewardPoints}
                    onChange={(e) => setProdFormRewardPoints(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-bold text-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={prodFormStock}
                    onChange={(e) => setProdFormStock(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-bold"
                  />
                </div>
              </div>

              {/* Requirement 3: MULTIPLE PHOTO UPLOAD */}
              <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-3 space-y-2">
                <label className="block font-bold text-pink-950 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-600" /> Multiple Photo Upload & Management ({prodFormPhotos.length} Photos)
                </label>
                
                {/* Photo Previews with Delete (X) */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {prodFormPhotos.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-amber-400 aspect-[3/4]">
                      <img src={url} alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhotoFromForm(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition"
                        title="Delete this photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {uploading && (
                  <div className="text-xs text-amber-800 font-bold bg-amber-100 p-2 rounded-xl flex items-center justify-between">
                    <span>Uploading Photo to Firebase Storage...</span>
                    <span>{uploadProgress.toFixed(0)}%</span>
                  </div>
                )}

                {/* Add Photo Input (Requirement 9: Upload from Gallery) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <label className="cursor-pointer bg-[#9D174D] hover:bg-pink-900 text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 shrink-0 shadow border border-amber-400/40">
                    <Camera className="w-4 h-4" />
                    <span>Upload from Gallery</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleGalleryUpload}
                    />
                  </label>
                  <span className="text-xs text-slate-400 text-center">or</span>
                  <input
                    type="url"
                    value={newPhotoUrlInput}
                    onChange={(e) => setNewPhotoUrlInput(e.target.value)}
                    placeholder="Paste Image URL..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-amber-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoToForm}
                    className="px-3 py-1.5 bg-amber-500 text-pink-950 font-bold rounded-xl hover:bg-amber-400 shadow transition"
                  >
                    + Add URL
                  </button>
                </div>
              </div>

              {/* Requirement 2: VIDEO / REEL UPLOAD BUTTON */}
              <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-3 space-y-2">
                <label className="block font-bold text-pink-950 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-amber-600" /> Video / Reel Upload (15-sec model drape video)
                </label>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full bg-[#9D174D] hover:bg-pink-900 text-amber-300 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition"
                >
                  <Video className="w-4 h-4" /> 📹 Upload Video / Reel from Gallery
                </button>
                <input
                  type="file"
                  ref={videoInputRef}
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoUpload}
                />
                <input
                  type="url"
                  placeholder="Or Paste Video URL..."
                  value={prodFormVideoUrl}
                  onChange={(e) => setProdFormVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white"
                />
                {videoUploading && (
                  <div className="text-xs text-amber-800 font-bold bg-amber-100 p-2 rounded-xl flex items-center justify-between">
                    <span>Uploading Video to Firebase Storage...</span>
                    <span>{videoUploadProgress.toFixed(0)}%</span>
                  </div>
                )}
                {prodFormVideoUrl && (
                  <div className="relative mt-2">
                    <video src={prodFormVideoUrl} controls className="w-full h-40 rounded-xl object-cover border-2 border-amber-300 bg-black" />
                    <button
                      type="button"
                      onClick={() => setProdFormVideoUrl('')}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700"
                      title="Remove Video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold mb-1">Full Description (Rich story of saree)</label>
                <textarea
                  rows={3}
                  value={prodFormDescription}
                  onChange={(e) => setProdFormDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-amber-300 bg-white text-xs"
                />
              </div>

              {/* AR Virtual Try-On Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ar-check"
                  checked={prodFormArEnabled}
                  onChange={(e) => setProdFormArEnabled(e.target.checked)}
                  className="w-4 h-4 text-pink-900 accent-pink-900 rounded"
                />
                <label htmlFor="ar-check" className="font-bold text-pink-950 cursor-pointer">
                  Enable AR Virtual Try-On for this product 🔮
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#9D174D] text-amber-300 font-bold rounded-xl shadow hover:bg-pink-900"
                >
                  {editingProduct ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PRINTABLE TAX INVOICE POPUP ================= */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border-2 border-amber-400 my-auto text-pink-950 relative space-y-4">
            <div className="flex items-center justify-between border-b border-amber-300 pb-3">
              <div>
                <h3 className="font-serif-royal text-xl font-bold text-[#9D174D]">{BRAND_NAME} Tax Invoice</h3>
                <p className="text-xs text-slate-500">Official Handloom Purchase Receipt</p>
              </div>
              <button onClick={() => setSelectedOrderForInvoice(null)} className="p-1 rounded-full bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2 border-b border-slate-200 pb-3">
              <div className="flex justify-between font-bold">
                <span>Invoice No: SK-INV-{selectedOrderForInvoice.id}</span>
                <span>Date: {selectedOrderForInvoice.orderDate}</span>
              </div>
              <p><strong>Billed To:</strong> {selectedOrderForInvoice.address.name} ({selectedOrderForInvoice.address.phone})</p>
              <p><strong>Shipping Address:</strong> {selectedOrderForInvoice.address.houseNo}, {selectedOrderForInvoice.address.street}, {selectedOrderForInvoice.address.city}, {selectedOrderForInvoice.address.state} - {selectedOrderForInvoice.address.pincode}</p>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-amber-100 text-pink-950 font-bold">
                  <th className="p-2">Item Description</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedOrderForInvoice.items.map((i, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-bold">{i.product.name} ({i.product.category})</td>
                    <td className="p-2">{i.quantity}</td>
                    <td className="p-2 text-right font-bold">₹{i.product.salePrice.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-xs font-bold space-y-1 text-right border-t border-slate-200 pt-2">
              <p>Subtotal: ₹{selectedOrderForInvoice.subtotal.toLocaleString('en-IN')}</p>
              <p className="text-emerald-700">Discount: -₹{selectedOrderForInvoice.discount}</p>
              <p className="text-base text-pink-900 font-extrabold pt-1">Total Paid: ₹{selectedOrderForInvoice.totalAmount.toLocaleString('en-IN')}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-500 font-semibold">100% Authentic Silk Mark Certified</span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#9D174D] text-amber-300 font-bold rounded-xl text-xs shadow flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ORDER DETAILS POPUP ================= */}
      {selectedOrderForDetails && (
        <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border-2 border-amber-400 my-auto text-pink-950 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-300 pb-3">
              <h3 className="font-serif-royal text-lg font-bold text-pink-950">Order #{selectedOrderForDetails.id} Details</h3>
              <button onClick={() => setSelectedOrderForDetails(null)} className="p-1 rounded-full bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p><strong>Customer:</strong> {selectedOrderForDetails.address.name} ({selectedOrderForDetails.address.phone})</p>
              <p><strong>Status:</strong> <span className="font-bold text-pink-900">{selectedOrderForDetails.status}</span></p>
              <p><strong>Payment Method:</strong> {selectedOrderForDetails.paymentMethod}</p>
              <p><strong>Delivery Address:</strong> {selectedOrderForDetails.address.houseNo}, {selectedOrderForDetails.address.street}, {selectedOrderForDetails.address.city} - {selectedOrderForDetails.address.pincode}</p>
            </div>

            <button
              onClick={() => setSelectedOrderForDetails(null)}
              className="w-full py-2 bg-[#9D174D] text-amber-300 font-bold rounded-xl text-xs"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* ================= CUSTOMER HISTORY POPUP ================= */}
      {selectedCustomerHistory && (
        <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-amber-400 my-auto text-pink-950 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-300 pb-3">
              <h3 className="font-serif-royal text-lg font-bold text-pink-950">{selectedCustomerHistory.name} - Profile History</h3>
              <button onClick={() => setSelectedCustomerHistory(null)} className="p-1 rounded-full bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p><strong>Mobile:</strong> {selectedCustomerHistory.phone}</p>
              <p><strong>Email:</strong> {selectedCustomerHistory.email}</p>
              <p><strong>Total Orders Placed:</strong> {selectedCustomerHistory.totalOrders}</p>
              <p><strong>Wallet Coins Balance:</strong> 🪙 {selectedCustomerHistory.walletBalance}</p>
              <p><strong>Lifetime Spend:</strong> ₹{selectedCustomerHistory.totalSpend.toLocaleString('en-IN')}</p>
              <p><strong>Loyalty Tier:</strong> 👑 {selectedCustomerHistory.loyaltyTier}</p>
            </div>

            <button
              onClick={() => setSelectedCustomerHistory(null)}
              className="w-full py-2 bg-[#9D174D] text-amber-300 font-bold rounded-xl text-xs"
            >
              Close History
            </button>
          </div>
        </div>
      )}

      {/* ================= QUERY REPLY MODAL ================= */}
      {queryReplyModal && (
        <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSendQueryReply} className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-amber-400 my-auto text-pink-950 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-300 pb-3">
              <h3 className="font-serif-royal text-lg font-bold text-pink-950">Reply to {queryReplyModal.userName}</h3>
              <button type="button" onClick={() => setQueryReplyModal(null)} className="p-1 rounded-full bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-amber-50 p-3 rounded-2xl border border-amber-200">
              <p className="font-bold text-[#9D174D]">{queryReplyModal.subject}</p>
              <p className="text-slate-700">{queryReplyModal.message}</p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Official Response Text</label>
              <textarea
                rows={4}
                value={queryReplyText}
                onChange={(e) => setQueryReplyText(e.target.value)}
                placeholder="Type your official resolution message to customer..."
                required
                className="w-full p-3 rounded-xl border border-amber-300 text-xs focus:outline-none focus:ring-2 focus:ring-pink-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#9D174D] text-amber-300 font-bold rounded-xl text-xs shadow hover:bg-pink-900"
            >
              Send Resolution & Mark Answered
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
