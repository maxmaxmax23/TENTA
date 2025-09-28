import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import ProductUploaderModal from "./ProductUploaderModal.jsx";
import Lista from "../tentadb.json";

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 1.2,
      focusMode: "continuous",
    });

    // Add a small delay to simulate initialization
    setTimeout(() => setLoading(false), 500);

    scanner.render(
      (result) => {
        scanner.clear();
        setScanResult(result);
        setInfo(Lista.find((item) => item.id === result));
      },
      (err) => console.warn(err)
    );
  }, []);

  return (
    <div className="flex flex-col items-center w-full p-4">
      {loading && (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-4"></div>
          <span className="text-gray-700">Initializing scanner...</span>
        </div>
      )}

      {!loading && !scanResult && (
        <div
          id="reader"
          className="w-full max-w-md rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg"
        ></div>
      )}

      {scanResult && (
        <ProductUploaderModal
          codigo={scanResult}
          info={info}
          onClose={() => setScanResult(null)}
        />
      )}
    </div>
  );
}
