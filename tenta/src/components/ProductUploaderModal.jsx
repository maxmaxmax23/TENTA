import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { storage, db } from "../firebase.js";

export default function ProductUploaderModal({ code, onClose }) {
  const [image, setImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!image) return;
    setUploading(true);
    const storageRef = ref(storage, `products/${code}.jpg`);
    const uploadTask = uploadBytesResumable(storageRef, image);

    uploadTask.on(
      "state_changed",
      (snapshot) => setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => alert("Error al subir imagen: " + error.message),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await updateDoc(doc(db, "products", code), { image: downloadURL });
        setUploading(false);
        onClose();
      }
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-800 p-6 rounded-xl text-white w-96 animate-fadeIn">
        <h2 className="text-xl mb-4 text-gold">Subir imagen</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="mb-3"
        />
        {uploading ? (
          <p>Subiendo... {Math.round(progress)}%</p>
        ) : (
          <div className="flex justify-between">
            <button onClick={handleUpload} className="bg-gold px-4 py-2 rounded text-black">
              Subir
            </button>
            <button onClick={onClose} className="bg-red-500 px-4 py-2 rounded text-white">
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
