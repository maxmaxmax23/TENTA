import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import ProductUploaderModal from "./ProductUploaderModal.jsx";
import Lista from "../tentadb.json";

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(true);

  useEffect(() => {
    if (!scannerVisible) return;

    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 2,
    });

    scanner.render(
      (result) => {
        scanner.clear();
        setScannerVisible(false);
        setScanResult(result);
        setShowModal(true);
      },
      (err) => console.warn(err)
    );
  }, [scannerVisible]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <p className="text-gold font-semibold mb-2 transition-opacity duration-500">
        Escanea el SKU o QR
      </p>
      <div
        id="reader"
        className={`w-full h-80 border border-gold rounded-lg transition-all duration-500 ${
          scannerVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      />

      {showModal && scanResult && (
        <ProductUploaderModal
          code={scanResult}
          data={Lista.find((item) => item.id === scanResult)}
          onClose={() => {
            setScanResult(null);
            setShowModal(false);
            setScannerVisible(true);
          }}
        />
      )}
    </div>
  );
}
