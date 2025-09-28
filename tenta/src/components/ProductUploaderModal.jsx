import { useState } from "react";
import { motion } from "framer-motion";
import { db, storage } from "../firebase";
import {
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default function ProductUploaderModal({ product, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const productRef = doc(db, "products", product.id);
      const productSnap = await getDoc(productRef);

      // 1. If product already has an image, delete it from storage
      if (productSnap.exists() && productSnap.data().imageUrl) {
        try {
          const oldImageRef = ref(storage, productSnap.data().imageUrl);
          await deleteObject(oldImageRef);
        } catch (err) {
          console.warn("Old image not found, skipping delete.");
        }
      }

      // 2. Upload new image
      const storageRef = ref(storage, `productImages/${product.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // 3. Update Firestore with new URL
      await updateDoc(productRef, {
        imageUrl: url,
      });

      alert("✅ Imagen actualizada correctamente");
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error subiendo la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl w-[90%] max-w-sm p-6 text-center space-y-4"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <h2 className="text-xl font-bold text-gray-900">
          {product.descripcion}
        </h2>
        {product.imageUrl ? (
          <div className="space-y-2">
            <img
              src={product.imageUrl}
              alt={product.descripcion}
              className="w-full h-40 object-cover rounded-lg"
            />
            <p className="text-sm text-gray-500">Se reemplazará la foto</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No hay foto guardada aún</p>
        )}

        <label className="block">
          <span className="sr-only">Subir imagen</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                     file:rounded-full file:border-0 file:text-sm file:font-semibold
                     file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>

        {uploading && (
          <p className="text-yellow-600 font-medium animate-pulse">
            Cargando...
          </p>
        )}
        {error && <p className="text-red-600">{error}</p>}

        <button
          onClick={onClose}
          className="w-full bg-black text-white rounded-full py-2 font-semibold hover:bg-gray-800"
        >
          Cancelar
        </button>
      </motion.div>
    </motion.div>
  );
}
