import { useState } from "react";
import { storage } from "../firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProductUploaderModal({ sku }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    await uploadFile(selected);
  };

  const handleTakePhoto = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = handleFileChange;
    input.click();
  };

  const uploadFile = async (file) => {
    setUploading(true);
    const storageRef = ref(storage, `products/${sku}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setThumbnail(url);
    setUploading(false);
  };

  return (
    <div className="flex flex-col items-center">
      {thumbnail ? (
        <img src={thumbnail} alt="Uploaded" className="w-32 h-32 object-cover rounded-lg mb-2" />
      ) : (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleTakePhoto}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold"
          >
            Tomar foto
          </button>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold"
          />
        </div>
      )}
      {uploading && <p className="mt-2 text-sm">Subiendo...</p>}
    </div>
  );
}
