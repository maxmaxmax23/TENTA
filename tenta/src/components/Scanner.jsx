import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import ProductUploaderModal from "./ProductUploaderModal.jsx";
import Lista from "../tentadb.json";

export default function Scanner() {
  const readerRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);
  const [scannerKey, setScannerKey] = useState(0);

  const handleScan = (result) => setScanResult(result);

  useEffect(() => {
    if (!readerRef.current || scanResult) return;

    const scanner = new Html5QrcodeScanner(readerRef.current.id, {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 1,
      focusMode: "continuous",
    });

    scanner.render(handleScan, (err) => console.warn(err));

    return () => scanner.clear();
  }, [readerRef, scanResult, scannerKey]);

  const resetScanner = () => {
    setScanResult(null);
    setScannerKey((k) => k + 1);
  };

  const matchedItem = scanResult ? Lista.find((item) => item.id === scanResult) : null;

  return (
    <div className="w-full flex flex-col items-center mt-4">
      {!scanResult && (
        <div
          key={scannerKey}
          ref={readerRef}
          id="reader"
          className="w-full max-w-md h-80 bg-black border border-gold rounded-lg overflow-hidden"
        ></div>
      )}

      {scanResult && (
        <ProductUploaderModal
          sku={scanResult}
          matchedItem={matchedItem}
          onClose={resetScanner}
        />
      )}
    </div>
  );
}
