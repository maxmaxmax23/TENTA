import React, { useState } from 'react';
import { storage } from '../firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProductUploaderModal({ sku, itemData, onUpload, onClose }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [thumbnail, setThumbnail] = useState(itemData?.imageUrl || null);

  const handleFileChange = e => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const storageRef = ref(storage, `products/${sku}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setThumbnail(url);
    onUpload(sku, url);
    setUploading(false);
    setFile(null);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-black text-gold rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">{itemData?.descripcion || sku}</h2>

        {thumbnail ? (
          <img src={thumbnail} alt="thumbnail" className="w-40 h-40 object-cover rounded-md mb-2 border border-gold mx-auto" />
        ) : (
          <p className="mb-4 text-center">No hay imagen. Selecciona o toma una foto.</p>
        )}

        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="mb-4 w-full text-sm file:py-2 file:px-4 file:rounded-full file:bg-gold file:text-black hover:file:bg-yellow-400 cursor-pointer"
        />

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full py-2 rounded-full font-bold ${uploading ? 'bg-gray-500 cursor-not-allowed' : 'bg-gold hover:bg-yellow-400'}`}
        >
          {uploading ? 'Subiendo...' : 'Subir imagen'}
        </button>

        <button onClick={onClose} className="w-full mt-2 py-2 rounded-full border border-gold hover:bg-yellow-400 font-bold">
          Cerrar
        </button>
      </div>
    </div>
  );
}
