import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase.js';

export default function ProductUploaderModal({ sku }) {
  const [file, setFile] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setUploading(true);

    const storageRef = ref(storage, `products/${sku}/${f.name}`);
    await uploadBytes(storageRef, f);
    const url = await getDownloadURL(storageRef);
    setPhotoURL(url);
    setUploading(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {photoURL ? (
        <img src={photoURL} alt="Producto" className="w-32 h-32 object-cover rounded-lg" />
      ) : (
        <input type="file" onChange={handleFileChange} className="text-gold" />
      )}
      {uploading && <p>Subiendo...</p>}
    </div>
  );
}
