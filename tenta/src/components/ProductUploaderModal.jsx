import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase.js';

export default function ProductUploaderModal({ product, onClose }) {
  const [file, setFile] = useState(null);
  const [imageURL, setImageURL] = useState(product?.image || '');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const storageRef = ref(storage, `products/${product.id}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setImageURL(url);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
      <div className="bg-black/90 p-6 rounded-xl w-11/12 max-w-md flex flex-col items-center gap-4">
        <h2 className="text-gold text-xl font-bold">{product?.descripcion}</h2>
        {imageURL ? (
          <img src={imageURL} alt="Thumbnail" className="w-40 h-40 object-cover rounded-md" />
        ) : (
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        )}
        {loading && <p className="text-white">Cargando...</p>}
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleUpload}
            className="bg-gold text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-500 transition"
          >
            Upload
          </button>
          <button
            onClick={onClose}
            className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
          >
            Escanear Otro
          </button>
        </div>
      </div>
    </div>
  );
}
