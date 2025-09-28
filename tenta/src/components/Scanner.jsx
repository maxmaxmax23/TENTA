import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import ProductModal from "./ProductModal";

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } });
    scanner.render((result) => {
      scanner.clear();
      setScanResult(result);
    }, (err) => console.warn(err));
  }, []);

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center p-4">
      {!scanResult && <div id="reader" className="w-full"></div>}
      {scanResult && <ProductModal product={{ id: scanResult }} onClose={() => setScanResult(null)} />}
    </div>
  );
}
