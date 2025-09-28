import React, { useState, useRef } from "react";
import { Dialog } from "@headlessui/react";
import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProductUploaderModal({ product, onClose }) {
  const [imageUrl, setImageUrl] = useState(product.imageUrl || "");
  const [uploading, setUploading] = useState(false);

  const modalRef = useRef(null);
  const startY = useRef(0);
  const translateY = useRef(0);

  const handleTouchStart = (e) => { startY.current = e.touches[0].clientY; };
  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    translateY.current = currentY - startY.current;
    if (translateY.current > 0) modalRef.current.style.transform = `translateY(${translateY.current}px)`;
  };
  const handleTouchEnd = () => { if (translateY.current > 100) onClose(); else modalRef.current.style.transform = "translateY(0)"; };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const storageRef = ref(storage, `products/${product.id}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setImageUrl(url);
    setUploading(false);
  };

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <Dialog.Overlay className="fixed inset-0 bg-black/70" />
      <div
        ref={modalRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="bg-black text-yellow-400 p-6 rounded-2xl w-full max-w-sm flex flex-col items-center transform transition-all duration-300"
      >
        <Dialog.Title className="text-xl font-bold mb-4">{product.descripcion}</Dialog.Title>
        {imageUrl ? (
          <img src={imageUrl} className="w-48 h-48 object-cover rounded-md mb-4" />
        ) : (
          <div className="text-center mb-4">No image yet. Upload one.</div>
        )}
        <input type="file" accept="image/*" capture="environment" onChange={handleUpload} />
        {uploading && <div className="mt-2 text-sm">Uploading...</div>}
        <button className="mt-4 p-3 bg-yellow-400 text-black rounded-lg font-bold" onClick={onClose}>
          Scan Another
        </button>
      </div>
    </Dialog>
  );
}
