// src/components/ProductUploader.jsx
import React, { useState, useEffect, useRef } from "react";
import { storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function ProductUploader({ sku }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFile(null);
    setProgress(0);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [sku]);

  if (!sku) return <p>Please scan a product first.</p>;

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = () => {
    if (!file) return alert("Select a file first");

    setUploading(true);
    const storageRef = ref(storage, `products/${sku}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const prog = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(prog);
      },
      (error) => {
        console.error("Upload failed:", error);
        alert("Upload failed: " + error.message);
        setUploading(false);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadedImages((prev) => [url, ...prev]); // newest first
        } catch (err) {
          console.error(err);
        } finally {
          setFile(null);
          setProgress(0);
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }
    );
  };

  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
        marginTop: "1rem",
      }}
    >
      <h2>Upload Images for SKU: {sku}</h2>
      <input
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        ref={fileInputRef}
      />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          display: "block",
          width: "100%",
          marginTop: "0.5rem",
          padding: "0.5rem",
          fontSize: "1rem",
        }}
      >
        Upload
      </button>

      {/* Progress */}
      {(uploading || progress > 0) && (
        <div style={{ marginTop: "0.5rem" }}>
          <progress value={progress} max="100" style={{ width: "100%" }} />
          {uploading && <p>Uploading…</p>}
        </div>
      )}

      {/* Uploaded thumbnails */}
      {uploadedImages.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Uploaded Images:</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            {uploadedImages.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  width: "80px",
                  height: "80px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={url}
                  alt={`Uploaded ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
