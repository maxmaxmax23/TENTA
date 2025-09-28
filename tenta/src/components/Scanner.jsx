import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import ProductCard from "./ProductCard.jsx";

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(
      (result) => setScanResult(result),
      (err) => console.warn(err)
    );

    return () => scanner.clear().catch(() => {});
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div id="reader" className="w-full max-w-md rounded-lg overflow-hidden"></div>
      {scanResult && <ProductCard scannedCode={scanResult} />}
    </div>
  );
}
