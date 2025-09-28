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
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1,
      rememberLastUsedCamera: true,
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
    <div className="w-full flex flex-col items-center gap-4">
      <p className="text-gold text-lg font-semibold">Escanea el SKU o QR</p>
      <div
        id="reader"
        className={`w-full max-w-md h-80 rounded-xl border border-gold transition-all ${
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
