import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import ProductModal from "./ProductModal.jsx";
import { getProduct } from "../firebase.js";

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [productData, setProductData] = useState(null);

  useEffect(() => {
    if (!scanResult) {
      const scanner = new Html5QrcodeScanner("reader", {
        qrbox: { width: 250, height: 250 },
        fps: 10,
        aspectRatio: 1.5,
        disableFlip: false,
      });

      scanner.render(
        async (result) => {
          scanner.clear();
          setScanResult(result);
          const product = await getProduct(result);
          setProductData(product);
        },
        (err) => console.warn(err)
      );
    }
  }, [scanResult]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      {!scanResult ? (
        <div id="reader" className="w-full max-w-sm mx-auto"></div>
      ) : (
        <ProductModal
          product={productData}
          onClose={() => {
            setScanResult(null);
            setProductData(null);
          }}
        />
      )}
    </div>
  );
}
