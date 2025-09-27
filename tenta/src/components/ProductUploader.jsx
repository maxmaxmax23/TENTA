import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { storage, db } from "../firebase";

function ProductUploader({ scannedCode }) {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files[0]) setImage(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!image || !scannedCode) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `products/${scannedCode}.jpg`);
      await uploadBytes(storageRef, image);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, "products", scannedCode), {
        sku: scannedCode,
        imageUrl: url,
        uploadedAt: new Date()
      });
      alert("Image uploaded successfully!");
      setImage(null);
    } catch (err) {
      console.error(err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Scanned Code: {scannedCode}</h3>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
      />
      <button onClick={handleUpload} disabled={!image || uploading}>
        {uploading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
}

export default ProductUploader;
