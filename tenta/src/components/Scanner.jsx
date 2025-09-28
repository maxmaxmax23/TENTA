import { useState } from "react";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProductUploaderModal({ code, item, onClose }) {
  const [imageFile, setImageFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(item?.photoUrl || null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!imageFile) return;
    setUploading(true);
    const storageRef = ref(storage, `products/${code}.jpg`);
    await uploadBytes(storageRef, imageFile);
    const url = await getDownloadURL(storageRef);
    setUploadedUrl(url);
    setUploading(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3 className="text-xl font-bold mb-3">{item?.descripcion || "Producto desconocido"}</h3>
        <p className="mb-3">SKU: {code}</p>

        {uploadedUrl ? (
          <img src={uploadedUrl} alt="Producto" className="w-full rounded-md mb-3" />
        ) : (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full mb-3 text-black"
            />
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-gold text-black px-4 py-2 rounded-md font-semibold w-full"
            >
              {uploading ? "Subiendo..." : "Subir imagen"}
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-4 bg-black text-gold border border-gold px-4 py-2 rounded-md w-full hover:bg-gold hover:text-black transition"
        >
          Escanear otro
        </button>
      </div>
    </div>
  );
}
