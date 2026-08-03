import React, { useState, useRef } from 'react';
import { Product, Banner, AdBanner, CustomerQuery, Order, OrderStatus, CategoryName, Coupon, CustomerRecord, CategoryGalleryItem, CustomerGift, EditablePage, RewardSettings } from '../types';
import { X, ShieldCheck, Edit, Plus, Trash2, Package, Image as ImageIcon, AlertCircle, Truck, Search, Users, ShoppingCart, BarChart3, Tag, Gift, FileText, Wallet, Lock, LogOut, Camera, Video, Award, Printer, Clock, HelpCircle, UploadCloud } from 'lucide-react';
import { INITIAL_COUPONS, INITIAL_CUSTOMERS, INITIAL_CATEGORY_GALLERY, INITIAL_GIFTS, INITIAL_EDITABLE_PAGES, INITIAL_REWARD_SETTINGS } from '../data/initialData';
import { db, storage } from '../lib/firebase';
import { doc, deleteDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { BRAND_NAME } from '../constants';

interface AdminPanelModalProps {
  isOpen: boolean; onClose: () => void; products: Product[]; banners: Banner[]; adBanner: AdBanner; queries: CustomerQuery[]; orders?: Order[];
  onUpdateBanners: (b: Banner[]) => void; onUpdateAdBanner: (ad: AdBanner) => void; onUpdateProducts: (p: Product[]) => void;
  onResolveQuery: (id: string, reply?: string) => void; onUpdateOrderStatus?: (id: string, s: OrderStatus) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose, products, banners, adBanner, queries, orders = [], onUpdateBanners, onUpdateAdBanner, onUpdateProducts, onResolveQuery }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState(''); const [adminPassword, setAdminPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PRODUCTS' | 'BANNERS' | 'ORDERS' | 'CUSTOMERS' | 'MARKETING' | 'QUERIES' | 'PAGES' | 'WALLET'>('DASHBOARD');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false); const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodFormName, setProdFormName] = useState(''); const [prodFormCategory, setProdFormCategory] = useState<CategoryName>('Banarasi');
  const [prodFormMrp, setProdFormMrp] = useState(9999); const [prodFormSale, setProdFormSale] = useState(4999);
  const [prodFormPhotos, setProdFormPhotos] = useState<string[]>(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']);
  const [prodFormStock, setProdFormStock] = useState(10); const [localBanners, setLocalBanners] = useState<Banner[]>(banners);
  const [localAdBanner, setLocalAdBanner] = useState<AdBanner>(adBanner);
  const [newBannerTitle, setNewBannerTitle] = useState(''); const [newBannerImage, setNewBannerImage] = useState('');

  if (!isOpen) return null;
  if (!isAdminLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center border-2 border-amber-400">
          <h3 className="font-bold text-lg text-pink-950 mb-4">Admin Login</h3>
          <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@sareekart.com" className="w-full border px-3 py-2 rounded-xl mb-2 text-sm" />
          <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="admin123" className="w-full border px-3 py-2 rounded-xl mb-3 text-sm" />
          <button onClick={() => { if (adminEmail === 'admin@sareekart.com' && adminPassword === 'admin123') setIsAdminLoggedIn(true); }} className="w-full py-2 bg-[#9D174D] text-amber-300 rounded-xl font-bold">Login</button>
          <button onClick={onClose} className="mt-2 text-xs text-slate-500">Close</button>
        </div>
      </div>
    );
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProd: Product = {
      id: editingProduct? editingProduct.id : `p_${Date.now()}`,
      name: prodFormName, category: prodFormCategory, mrp: Number(prodFormMrp), salePrice: Number(prodFormSale),
      rewardPoints: 250, rating: 4.9, reviewCount: 1, images: prodFormPhotos, fabric: 'Pure Silk', work: 'Zari', blouseIncluded: true,
      length: '6.3m', washCare: 'Dry Clean', description: 'Royal Handloom Saree', inStock: prodFormStock > 0, stockCount: prodFormStock, tags: ['New']
    };
    try { await setDoc(doc(db, 'products', newProd.id), newProd, { merge: true }); } catch {}
    if (editingProduct) onUpdateProducts(products.map(p => p.id === newProd.id? newProd : p));
    else onUpdateProducts([newProd,...products]);
    setIsProductModalOpen(false); setEditingProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-pink-950/80 backdrop-blur flex items-center justify-center p-2 overflow-y-auto">
      <div className="bg-[#FDFBF7] w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500 my-auto flex flex-col max-h-[94vh]">
        <div className="p-3 bg-gradient-to-r from-[#9D174D] to-amber-800 text-white flex justify-between items-center"><span className="font-bold">{BRAND_NAME} Admin</span><button onClick={onClose} className="bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button></div>
        <div className="flex gap-1.5 p-2 bg-amber-100/60 overflow-x-auto text-xs font-bold">
          {(['DASHBOARD','PRODUCTS','BANNERS','ORDERS','CUSTOMERS','MARKETING','QUERIES','PAGES','WALLET'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-3 py-2 rounded-xl whitespace-nowrap ${activeTab === t? 'bg-[#9D174D] text-amber-300' : 'bg-white text-pink-950'}`}>{t}</button>
          ))}
        </div>
        <div className="p-4 overflow-y-auto">
          {activeTab === 'DASHBOARD' && <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><div className="bg-white border rounded-2xl p-3"><p className="text-xs text-slate-500">Total Sales</p><p className="font-bold text-pink-950">₹{orders.reduce((s,o)=>s+o.totalAmount,0).toLocaleString('en-IN')}</p></div><div className="bg-white border rounded-2xl p-3"><p className="text-xs text-slate-500">Products</p><p className="font-bold">{products.length}</p></div><div className="bg-white border rounded-2xl p-3"><p className="text-xs text-slate-500">Orders</p><p className="font-bold">{orders.length}</p></div><div className="bg-white border rounded-2xl p-3"><p className="text-xs text-slate-500">Queries</p><p className="font-bold">{queries.filter(q=>q.status==='OPEN').length}</p></div></div>}
          {activeTab === 'PRODUCTS' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center"><h3 className="font-bold">Catalog ({products.length})</h3><button onClick={()=>{setEditingProduct(null); setProdFormName(''); setProdFormMrp(9999); setProdFormSale(4999); setIsProductModalOpen(true);}} className="px-4 py-2 bg-[#9D174D] text-amber-300 rounded-xl text-xs font-bold">+ Add Saree</button></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{products.map(p=>{const mrp=Number(p.mrp??0); const sale=Number(p.salePrice??mrp); return (<div key={p.id} className="bg-white border rounded-2xl overflow-hidden"><img src={p.images?.[0]} className="h-40 w-full object-cover" /><div className="p-2"><p className="font-bold text-xs truncate">{p.name}</p><p className="text-xs">₹{sale.toLocaleString('en-IN')} <span className="line-through text-[10px]">₹{mrp.toLocaleString('en-IN')}</span></p><div className="flex gap-1 mt-1"><button onClick={()=>{setEditingProduct(p); setProdFormName(p.name); setProdFormCategory(p.category); setProdFormMrp(p.mrp); setProdFormSale(p.salePrice); setProdFormPhotos(p.images); setIsProductModalOpen(true);}} className="flex-1 bg-amber-100 text-xs py-1 rounded-lg">Edit</button><button onClick={async()=>{try{await deleteDoc(doc(db,'products',p.id))}catch{} onUpdateProducts(products.filter(x=>x.id!==p.id))}} className="bg-red-100 text-xs px-2 py-1 rounded-lg">Del</button></div></div></div>)})}</div>
            </div>
          )}
          {activeTab === 'BANNERS' && (
            <div className="bg-white border rounded-3xl p-4 space-y-3 max-w-xl"><h4 className="font-bold">Add Banner</h4><input value={newBannerTitle} onChange={e=>setNewBannerTitle(e.target.value)} placeholder="Title" className="w-full border px-3 py-2 rounded-xl text-xs" /><input value={newBannerImage} onChange={e=>setNewBannerImage(e.target.value)} placeholder="Image URL" className="w-full border px-3 py-2 rounded-xl text-xs" /><button onClick={()=>{const b: Banner={id:`b_${Date.now()}`, title:newBannerTitle, subtitle:'Offer', imageUrl:newBannerImage, tag:'NEW', targetCategory:'Banarasi', discountBadge:'DEAL', active:true}; const u=[b,...localBanners]; setLocalBanners(u); onUpdateBanners(u); setNewBannerTitle(''); setNewBannerImage('');}} className="w-full bg-[#9D174D] text-amber-300 py-2 rounded-xl text-xs font-bold">Save Banner</button></div>
          )}
          {activeTab!== 'DASHBOARD' && activeTab!== 'PRODUCTS' && activeTab!== 'BANNERS' && <div className="bg-white border rounded-2xl p-10 text-center text-sm text-slate-500"> {activeTab} Module - Safe Mode (No Bulk Upload)</div>}
        </div>
      </div>
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[60] bg-pink-950/80 flex items-center justify-center p-4"><form onSubmit={handleSaveProduct} className="bg-white w-full max-w-md rounded-3xl p-5 space-y-3 text-xs"><h4 className="font-bold">{editingProduct?'Edit':'Add'} Saree</h4><input value={prodFormName} onChange={e=>setProdFormName(e.target.value)} placeholder="Name" required className="w-full border px-3 py-2 rounded-xl" /><div className="grid grid-cols-2 gap-2"><input type="number" value={prodFormMrp} onChange={e=>setProdFormMrp(Number(e.target.value))} placeholder="MRP" className="border px-3 py-2 rounded-xl" /><input type="number" value={prodFormSale} onChange={e=>setProdFormSale(Number(e.target.value))} placeholder="Sale" className="border px-3 py-2 rounded-xl" /></div><input type="number" value={prodFormStock} onChange={e=>setProdFormStock(Number(e.target.value))} placeholder="Stock" className="w-full border px-3 py-2 rounded-xl" /><div className="flex gap-2"><button type="button" onClick={()=>setIsProductModalOpen(false)} className="flex-1 bg-slate-100 py-2 rounded-xl">Cancel</button><button type="submit" className="flex-1 bg-[#9D174D] text-amber-300 py-2 rounded-xl font-bold">Save</button></div></form></div>
      )}
    </div>
  );
};
