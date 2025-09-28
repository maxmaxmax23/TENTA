import { useState } from "react";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase.js";

export default function ProductUploaderModal({ item, onClose, onUpdate }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      // If there is an existing image, delete it first
      if (item.imageUrl) {
        const oldRef = ref(storage, item.imageUrl);
        await deleteObject(oldRef).catch(() => {}); // ignore errors if it doesn't exist
      }

      const storageRef = ref(storage, `products/${item.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Update the item locally and trigger parent update
      item.imageUrl = url;
      onUpdate(item);

      onClose();
    } catch (err) {
      console.error("Error uploading file:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-black/90 p-6 rounded-xl w-full max-w-sm flex flex-col gap-4 animate-fadeIn">
        <h2 className="text-xl font-bold">
          {item.imageUrl ? "Actualizar Imagen" : "Subir Imagen"} para {item.id}
        </h2>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files[0])}
          className="text-gold"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-gold text-black py-2 rounded-full font-bold hover:bg-yellow-500 transition-colors"
        >
          {loading ? "Cargando..." : item.imageUrl ? "Actualizar" : "Subir"}
        </button>
        <button
          onClick={onClose}
          className="mt-2 border border-gold text-gold py-2 rounded-full hover:bg-gold hover:text-black transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
