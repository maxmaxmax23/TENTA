import { useState } from "react";
import { storage, db } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";

export default function ProductUploaderModal({ code, onClose }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const storageRef = ref(storage, `products/${code}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Save imageUrl in Firestore
      await updateDoc(doc(db, "products", code), { imageUrl: url });

      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al subir la imagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="w-11/12 max-w-sm bg-gray-900 p-6 rounded-xl shadow-lg text-gold">
        <h2 className="text-xl font-bold mb-4">Subir/Reemplazar Imagen</h2>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full text-sm mb-4"
        />
        <div className="flex space-x-2">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="flex-1 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Subir"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
