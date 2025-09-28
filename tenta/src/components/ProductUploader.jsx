import { useEffect, useState } from "react";
import { storage } from "../firebase.js";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function ProductUploader({ sku }) {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const storageRef = ref(storage, `products/${sku}.jpg`);
        const downloadUrl = await getDownloadURL(storageRef);
        setUrl(downloadUrl);
      } catch {
        setUrl(null);
      }
    };
    fetchImage();
  }, [sku]);

  const handleUpload = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setUploading(true);

    const storageRef = ref(storage, `products/${sku}.jpg`);
    const uploadTask = uploadBytesResumable(storageRef, selected);

    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error(error);
        setUploading(false);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        setUrl(downloadUrl);
        setUploading(false);
      }
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {url ? (
        <img src={url} alt={sku} className="w-32 h-32 object-cover rounded border border-gold" />
      ) : (
        <label className="px-4 py-2 bg-gold text-black rounded cursor-pointer hover:bg-yellow-400 transition">
          {uploading ? "Subiendo..." : "Subir foto"}
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      )}
    </div>
  );
}
