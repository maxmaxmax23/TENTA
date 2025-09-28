import { useState } from "react";
import { storage } from "../firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProductUploaderModal({ scanResult, productInfo, onUploadComplete, setLoading }) {
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setThumbnail(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const storageRef = ref(storage, `images/${scanResult}`);
    await uploadBytes(storageRef, file);
    await getDownloadURL(storageRef);
    onUploadComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center p-4 z-50 animate-fade-in">
      <div className="modal-card">
        <h2 className="text-gold font-bold text-xl text-center">SKU: {scanResult}</h2>
        {productInfo && <p className="text-gold text-center">{productInfo.descripcion}</p>}
        {thumbnail ? (
          <img src={thumbnail} className="w-32 h-32 object-cover rounded-lg border border-gold" alt="thumbnail" />
        ) : (
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
          />
        )}
        <button onClick={handleUpload}>Subir</button>
        <button onClick={onUploadComplete} className="mt-2 underline text-gold">Cancelar</button>
      </div>
    </div>
  );
}
