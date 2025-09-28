import { useState, useEffect } from 'react';
import tentadb from '../tentadb.json';
import { storage } from '../firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProductUploaderModal({ scannedCode, resetScanner }) {
  const [product, setProduct] = useState(null);
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const found = tentadb.find((item) => item.id === scannedCode);
    setProduct(found || { id: scannedCode, descripcion: 'No data found', precio: 0 });
  }, [scannedCode]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const storageRef = ref(storage, `products/${product.id}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setImageUrl(url);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start p-4 bg-black/90 overflow-auto animate-fade-in-down">
      <h2 className="text-2xl font-bold text-gold mt-6">{product?.descripcion}</h2>
      <p className="text-white mt-2">Precio: ${product?.precio}</p>
      {imageUrl && <img src={imageUrl} alt="Product" className="w-40 h-40 object-cover mt-4 rounded-md shadow-lg" />}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="mt-4"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button
        onClick={handleUpload}
        className="mt-4 py-2 px-6 bg-gold text-black font-semibold rounded hover:brightness-110 transition"
      >
        {loading ? 'Cargando...' : 'Subir Foto'}
      </button>
      <button
        onClick={resetScanner}
        className="mt-4 py-2 px-6 bg-gray-700 text-white font-semibold rounded hover:brightness-110 transition"
      >
        Escanear otro
      </button>
    </div>
  );
}
