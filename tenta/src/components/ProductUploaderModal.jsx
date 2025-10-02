// File: src/components/ProductUploaderModal.jsx
import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { storage, db } from "../firebase.js";

export default function ProductUploaderModal({ code, onClose }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");

  const handleUpload = () => {
    if (!file) {
      setLog("⚠ Por favor selecciona un archivo");
      return;
    }

    setLoading(true);
    const storageRef = ref(storage, `products/${code}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const prog = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(prog);
        setLog(`Subiendo: ${prog}%`);
      },
      (error) => {
        console.error(error);
        setLog("❌ Error al subir la imagen");
        setLoading(false);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, "products", code), { imageUrl: url });
          setLog("✅ Imagen subida correctamente");
          setFile(null);
          setProgress(0);
          onClose();
        } catch (err) {
          console.error(err);
          setLog("⚠ Error al actualizar Firestore");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="w-11/12 max-w-sm bg-gray-900 p-6 rounded-xl shadow-lg text-gold space-y-4">
        <h2 className="text-xl font-bold">Subir / Reemplazar Imagen</h2>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full text-sm mb-2"
        />

        {log && <p className="text-sm">{log}</p>}
        {progress > 0 && (
          <div className="w-full bg-gray-700 h-2 rounded-full">
            <div
              className="bg-gold h-2 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        <div className="flex space-x-2 mt-2">
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
