import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";

export default function ProductUploader({ scannedCode }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const storageRef = ref(storage, `product-images/${scannedCode}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(percent);
      },
      (error) => {
        console.error("Upload failed:", error);
        setUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setImageUrl(url);
          setUploading(false);
        });
      }
    );
  };

  if (imageUrl) {
    return (
      <div className="mt-2">
        <img src={imageUrl} alt="SKU" className="w-32 h-32 object-cover rounded shadow" />
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-center">
      <label className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        {uploading ? `Uploading... ${progress}%` : "Upload Image"}
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </label>
      {uploading && (
        <div className="w-full max-w-xs mt-2 h-2 bg-gray-200 rounded">
          <div
            className="h-full bg-green-500 rounded"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
