import { useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import ProductUploaderModal from "./ProductUploaderModal.jsx";
import TentaDB from "./tentadb.json";

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [product, setProduct] = useState(null);

  const initScanner = () => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    });

    scanner.render(
      (result) => {
        scanner.clear();
        const productData = TentaDB.find(p => p.id === result);
        setProduct(productData || { id: result, descripcion: "Unknown" });
        setScanResult(result);
        setShowModal(true);
      },
      (err) => console.warn(err)
    );
  };

  return (
    <div className="flex flex-col items-center w-full">
      {!scanResult && <div id="reader" className="w-full max-w-md" ref={initScanner}></div>}
      {showModal && product && (
        <ProductUploaderModal
          product={product}
          onClose={() => { setShowModal(false); setScanResult(null); initScanner(); }}
        />
      )}
    </div>
  );
}
