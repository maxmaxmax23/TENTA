import { useState, useEffect } from 'react';
import { storage } from '../firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Lista from '../tentadb.json';

export default function ProductUploaderModal({ code, onReset }) {
  const [item, setItem] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const found = Lista.find((i) => i.id === code);
    setItem(found || { id: code, descripcion: 'No hay datos', precio: '-' });

    const imageRef = ref(storage, `products/${code}.jpg`);
    getDownloadURL(imageRef)
      .then((url) => setImageUrl(url))
      .catch(() => setImageUrl(null));
  }, [code]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const storageRef = ref(storage, `products/${code}.jpg`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setImageUrl(url);
    setUploading(false);
  };

  return (
    
<div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 p-4 overflow-y-auto animate-fade-in">
  <div className="bg-black text-gold rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fade-slide-up">
    <h2 className="text-2xl font-bold">{item?.descripcion}</h2>
    <p>CODIGO: {item?.id}</p>
    <p>PRECIO: ${item?.precio}</p>

    {imageUrl ? (
      <img
        src={imageUrl}
        alt={code}
        className="w-32 h-32 object-cover rounded-md mx-auto border-2 border-gold animate-fade-in"
      />
    ) : (
      <div className="text-center text-sm animate-fade-in">
        No hay imagen. Por favor sube una foto:
      </div>
    )}

    <input
      type="file"
      accept="image/*"
      onChange={handleUpload}
      className="w-full text-sm file:bg-gold file:text-black file:px-3 file:py-2 file:rounded-md cursor-pointer transition-all hover:scale-105"
    />

    {uploading && (
      <p className="text-sm text-center animate-fade-slide-up">
        Subiendo imagen...
      </p>
    )}

    <button
      onClick={onReset}
      className="bg-gold text-black w-full py-3 rounded-md font-semibold hover:bg-yellow-500 hover:animate-pulse-gold transition-all"
    >
      Escanear otro
    </button>
  </div>
</div>

  );
}
