import { useState, useEffect } from "react";
import { storage, db } from "./firebase.js";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function ProductModal({ scanResult, setScanResult }) {
  const [product, setProduct] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, "products", scanResult);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct(docSnap.data());
        setImageUrl(docSnap.data().imageUrl || "");
      }
    };
    fetchProduct();
  }, [scanResult]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileRef = storageRef(storage, `products/${scanResult}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    setImageUrl(url);

    // update Firestore
    const docRef = doc(db, "products", scanResult);
    await setDoc(docRef, { ...product, imageUrl: url }, { merge: true });
    setUploading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full animate-slideUp">
      <div className="p-4 bg-black border-gold border rounded-xl w-11/12 max-w-md flex flex-col items-center">
        <h2 className="text-xl font-bold mb-2">{product?.descripcion}</h2>
        <p className="mb-2">SKU: {scanResult}</p>
        <p className="mb-2">Precio: ${product?.precio}</p>
        {imageUrl ? (
          <img src={imageUrl} alt="product" className="w-40 h-40 object-cover rounded-lg mb-2" />
        ) : (
          <p className="mb-2 text-gray-400">No image available</p>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="mb-2"
        />
        {uploading && <p className="text-yellow-400">Uploading...</p>}
        <button
          className="mt-2 px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:scale-105 transition-transform"
          onClick={() => setScanResult(null)}
        >
          Escanear Otro
        </button>
      </div>
    </div>
  );
}
