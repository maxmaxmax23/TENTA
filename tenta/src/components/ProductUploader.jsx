import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { storage, db } from '../firebase.js';

export default function ProductUploader({ productId, onUpload }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const storageRef = ref(storage, `products/${productId}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);

      const dataToSave = { image: url, id: productId };
      if (productSnap.exists()) {
        await setDoc(productRef, dataToSave, { merge: true });
      } else {
        await setDoc(productRef, dataToSave);
      }

      // Optionally: sync Firestore to JSON
      // import { pullFirestoreToJson } from '../firebaseSync';
      // await pullFirestoreToJson();

      setLoading(false);
      onUpload();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-2 text-gold"
      />
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="bg-gold text-black py-2 px-4 rounded-xl shadow-gold-lg hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? 'Cargando...' : 'Subir Imagen'}
      </button>
    </div>
  );
}
