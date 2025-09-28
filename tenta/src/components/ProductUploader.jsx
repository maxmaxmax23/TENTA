import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";

export default function ProductUploader({ scannedCode }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));

    const storageRef = ref(storage, `products/${scannedCode}/${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(percent);
      },
      (error) => {
        console.error("Upload error:", error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setUploadedUrl(url);
          setProgress(100);
        });
      }
    );
  };

  return (
    <div className="flex flex-col items-center p-4 border border-gray-300 rounded-md mt-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-2"
      />

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="w-32 h-32 object-cover rounded-md mb-2"
        />
      )}

      {file && (
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-4 overflow-hidden mb-2">
          <div
            className="bg-blue-500 h-4 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {uploadedUrl && (
        <a
          href={uploadedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline mt-1"
        >
          View uploaded image
        </a>
      )}
    </div>
  );
}
