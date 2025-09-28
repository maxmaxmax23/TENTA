import { useState, useEffect } from "react";
import ProductUploader from "./ProductUploader.jsx";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";

export default function ProductCard({ scannedCode }) {
  const [product, setProduct] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    fetch("/tentadb.json")
      .then((res) => res.json())
      .then((data) => {
        const p = data.find((item) => item.id === scannedCode);
        setProduct(p || null);
      });

    const imageRef = ref(storage, `product-images/${scannedCode}`);
    getDownloadURL(imageRef)
      .then((url) => setImageUrl(url))
      .catch(() => setImageUrl(null));
  }, [scannedCode]);

  if (!product) {
    return (
      <div className="mt-4 p-4 bg-white rounded shadow w-full max-w-md text-center">
        No data found for <strong>{scannedCode}</strong>.
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-white rounded shadow w-full max-w-md">
      <h2 className="text-xl font-bold">{product.descripcion}</h2>
      <p className="text-lg font-semibold">${product.precio}</p>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt="SKU"
          className="mt-2 w-32 h-32 object-cover rounded shadow"
        />
      ) : (
        <ProductUploader scannedCode={scannedCode} />
      )}
    </div>
  );
}
