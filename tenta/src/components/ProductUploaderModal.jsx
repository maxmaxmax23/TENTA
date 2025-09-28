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

    // Try to get image from Firebase Storage
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
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-black text-gold rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        <h2 className="text-xl font-bold mb-4">{item?.descripcion}</h2>
        <p className="mb-4">CODIGO: {item?.id}</p>
        <p className="mb-4">PRECIO: ${item?.precio}</p>

        {imageUrl ? (
          <img src={imageUrl} alt={code} className="w-32 h-32 object-cover rounded-md mb-4" />
        ) : (
          <div className="mb-4 text-sm">No hay imagen. Por favor sube una foto:</div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="mb-4 w-full text-sm file:bg-gold file:text-black file:px-3 file:py-2 file:rounded-md cursor-pointer"
        />

        {uploading && <p className="text-sm mb-2">Subiendo imagen...</p>}

        <button
          onClick={onReset}
          className="bg-gold text-black w-full py-2 rounded-md font-semibold hover:bg-yellow-500 transition-colors"
        >
          Escanear otro
        </button>
      </div>
    </div>
  );
}
