// VEERANSH SAREES - BULK SALE UPLOADER - FINAL FIXED VERSION
// File: src/components/BulkSaleUploader.tsx
import React, { useState, useRef } from 'react';
import { db, storage } from '../lib/firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const BulkSaleUploader = () => {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());
  const [fileList, setFileList] = useState<File[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0, text: '' });
  const [bulkMRP, setBulkMRP] = useState('');
  const [bulkSale, setBulkSale] = useState('');
  const [bulkCategory, setBulkCategory] = useState('Banarasi');

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    if(lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: any[] = [];
    for(let i=1; i<lines.length; i++){
      const values: string[] = [];
      let current = '';
      let inQuote = false;
      for(let char of lines[i]){
        if(char === '"'){ inQuote = !inQuote; }
        else if(char === ',' && !inQuote){ values.push(current.trim()); current = ''; }
        else { current += char; }
      }
      values.push(current.trim());
      if(values.length === headers.length){
        const obj: any = {};
        headers.forEach((h, idx) => obj[h] = values[idx]?.replace(/^"|"$/g, '') || '');
        data.push(obj);
      }
    }
    return data;
  };

  const handleCSV = async (e: any) => {
    const file = e.target.files[0];
    if(!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    setCsvData(parsed);
    setPreview(parsed.slice(0, 20));
    alert(`CSV Loaded: ${parsed.length} Sarees Found`);
  };

  const handleFiles = (e: any) => {
    const files = Array.from(e.target.files) as File[];
    setFileList(files);
    const map = new Map<string, File>();
    files.forEach(f => map.set(f.name, f));
    setFileMap(map);
    alert(`Files Selected: ${files.length} Images/Videos`);
  };

  const applyBulkMRP = () => {
    if(!bulkMRP) return;
    const updated = csvData.map(r => ({...r, mrp: bulkMRP}));
    setCsvData(updated);
    setPreview(updated.slice(0,20));
  };
  const applyBulkSale = () => {
    if(!bulkSale) return;
    const updated = csvData.map(r => ({...r, salePrice: bulkSale}));
    setCsvData(updated);
    setPreview(updated.slice(0,20));
  };
  const applyBulkCategory = () => {
    const updated = csvData.map(r => ({...r, category: bulkCategory}));
    setCsvData(updated);
    setPreview(updated.slice(0,20));
  };

  const uploadFileAndGetURL = (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
      task.on('state_changed', null, reject, async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      });
    });
  };

  const uploadSingleProduct = async (row: any) => {
    try {
      const imageNames = (row.imageFileNames || '').split('|').map((s:string)=>s.trim()).filter(Boolean);
      const imageUrls: string[] = [];
      for(let imgName of imageNames){
        const file = fileMap.get(imgName);
        if(file){
          const url = await uploadFileAndGetURL(file, `bulk-sale-2026/${Date.now()}_${imgName}`);
          imageUrls.push(url);
        }
      }
      let videoUrl = '';
      if(row.videoFileName){
        const vFile = fileMap.get(row.videoFileName.trim());
        if(vFile){
          videoUrl = await uploadFileAndGetURL(vFile, `bulk-sale-videos/${Date.now()}_${row.videoFileName}`);
        }
      }
      if(imageUrls.length === 0) throw new Error('No images for ' + row.productName);
      await addDoc(collection(db, 'products'), {
        name: row.productName,
        category: row.category || 'Banarasi',
        mrp: Number(row.mrp) || 9999,
        salePrice: Number(row.salePrice) || 4999,
        rewardPoints: Number(row.rewardPoints) || Math.floor(Number(row.salePrice)*0.05) || 100,
        stock: Number(row.stock) || 20,
        fabric: row.fabric || 'Katan Silk',
        blouseFabric: row.blouseFabric || 'Running Blouse',
        length: row.length || '6.3m with Blouse',
        colors: row.colors || '',
        work: row.work || '',
        washCare: row.washCare || 'Dry Wash Only',
        description: row.description || row.productName,
        images: imageUrls,
        videoUrl: videoUrl || '',
        enableAR: (row.enableAR || 'TRUE').toUpperCase() === 'TRUE',
        isBulkSale: true,
        saleTag: row.saleTag || 'MEGA SALE',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch(err){
      console.error('Failed:', row.productName, err);
      return false;
    }
  };

  const startBulkUpload = async () => {
    if(csvData.length === 0){ alert('Pehle CSV Upload karo!'); return; }
    if(fileMap.size === 0){ alert('Pehle Images Folder Upload karo!'); return; }
    if(!confirm(`${csvData.length} Sarees Upload karna hai? Laptop Charge pe rakho.`)) return;
    setUploading(true);
    setProgress({ current: 0, total: csvData.length, success: 0, failed: 0, text: 'Starting...' });
    let success = 0, failed = 0;
    const CHUNK_SIZE = 3;
    for(let i=0; i<csvData.length; i+=CHUNK_SIZE){
      const chunk = csvData.slice(i, i+CHUNK_SIZE);
      const results = await Promise.all(chunk.map(row => uploadSingleProduct(row)));
      results.forEach(r => { if(r) success++; else failed++; });
      const current = Math.min(i+CHUNK_SIZE, csvData.length);
      setProgress({ current, total: csvData.length, success, failed, text: `Uploading ${current}/${csvData.length} | Success: ${success} Failed: ${failed}` });
      await new Promise(res => setTimeout(res, 800));
    }
    setUploading(false);
    alert(`MEGA UPLOAD COMPLETE!\nSuccess: ${success}\nFailed: ${failed}`);
  };

  return (
    <div className="p-6 bg-[#FFF8E7] min-h-screen">
      <h1 className="text-2xl font-bold text-[#9D174D] mb-2">VEERANSH SAREES - Bulk Sale Uploader (1000s)</h1>
      <p className="text-gray-600 mb-6">CSV + Images Folder se Hazaaro Sarees ek saath Sale mein daalo</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-5 rounded-2xl border-2 border-yellow-200">
          <h3 className="font-bold text-lg mb-3">Step 1: Upload CSV File</h3>
          <input type="file" accept=".csv" onChange={handleCSV} className="w-full p-2 border rounded" />
          {csvData.length > 0 && <p className="mt-2 text-green-600 font-bold">✅ {csvData.length} Products Found</p>}
        </div>
        <div className="bg-white p-5 rounded-2xl border-2 border-yellow-200">
          <h3 className="font-bold text-lg mb-3">Step 2: Upload All Images & Videos</h3>
          <input type="file" multiple accept="image/*,video/*" onChange={handleFiles} className="w-full p-2 border rounded" />
          {fileList.length > 0 && <p className="mt-2 text-green-600 font-bold">✅ {fileList.length} Files Selected</p>}
        </div>
      </div>
      {csvData.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border-2 border-[#9D174D] mb-6 flex flex-wrap gap-4 items-end">
          <div><label className="text-sm">Set MRP for All</label><div className="flex gap-2"><input value={bulkMRP} onChange={e=>setBulkMRP(e.target.value)} placeholder="14999" className="border p-2 rounded w-24" /><button onClick={applyBulkMRP} className="bg-yellow-100 px-3 rounded">Apply</button></div></div>
          <div><label className="text-sm">Set Sale Price</label><div className="flex gap-2"><input value={bulkSale} onChange={e=>setBulkSale(e.target.value)} placeholder="5999" className="border p-2 rounded w-24" /><button onClick={applyBulkSale} className="bg-yellow-100 px-3 rounded">Apply</button></div></div>
          <div><label className="text-sm">Set Category</label><div className="flex gap-2"><select value={bulkCategory} onChange={e=>setBulkCategory(e.target.value)} className="border p-2 rounded"><option>Banarasi</option><option>Kanjivaram</option><option>Cotton</option><option>Silk</option></select><button onClick={applyBulkCategory} className="bg-yellow-100 px-3 rounded">Apply</button></div></div>
        </div>
      )}
      {preview.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border mb-6">
          <h3 className="font-bold mb-3">Preview - First 20 (Horizontal Sliding)</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {preview.map((row, idx) => {
              const imgName = (row.imageFileNames||'').split('|')[0]?.trim();
              const found = fileMap.has(imgName);
              return (
                <div key={idx} className="min-w-[220px] border rounded-xl p-2 snap-start">
                  <div className={`h-32 bg-gray-100 rounded flex items-center justify-center ${found?'border-2 border-green-400':'border-2 border-red-400'}`}>
                    {found ? <span className="text-xs">✅ {imgName}</span> : <span className="text-xs text-red-500">❌ Missing: {imgName}</span>}
                  </div>
                  <p className="font-bold text-sm mt-2 line-clamp-2">{row.productName}</p>
                  <p className="text-xs">₹{row.salePrice} <s>₹{row.mrp}</s> | {row.category}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div className="bg-white p-6 rounded-2xl border-2 border-[#9D174D] text-center">
        {uploading ? (
          <div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
              <div className="bg-[#9D174D] h-4 rounded-full transition-all" style={{width: `${(progress.current/progress.total)*100}%`}}></div>
            </div>
            <p className="font-bold text-lg">{progress.text}</p>
            <p className="text-sm text-gray-500">{progress.current} / {progress.total} | Success: {progress.success} Failed: {progress.failed}</p>
          </div>
        ) : (
          <div>
            <button onClick={startBulkUpload} disabled={csvData.length===0 || fileMap.size===0} className="bg-[#9D174D] text-[#F59E0B] px-10 py-4 rounded-xl font-bold text-xl disabled:bg-gray-300">
              🚀 START MEGA UPLOAD - {csvData.length} SAREES
            </button>
            <p className="text-xs mt-3 text-gray-500">CSV: {csvData.length} | Files: {fileMap.size}</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default BulkSaleUploader;
