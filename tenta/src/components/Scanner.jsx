import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import Lista from "../tentadb.json"; // your data
import ProductUploader from "./ProductUploader.jsx";

export default function Scanner() {
  const readerRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Handle scan
  const handleScan = (result) => {
    setScanResult(result);
    setShowModal(true);
  };

  useEffect(() => {
    if (!readerRef.current) return;

    const scanner = new Html5QrcodeScanner(readerRef.current.id, {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 2,
      focusMode: "continuous",
    });

    scanner.render(handleScan, (err) => {
      // silently ignore minor errors
      console.warn(err);
    });

    return () => scanner.clear();
  }, [readerRef]);

  const matchedItem = scanResult
    ? Lista.find((item) => item.id === scanResult)
    : null;

  return (
    <div className="w-full flex flex-col items-center mt-4">
      {/* Scanner */}
      {!scanResult && (
        <div
          ref={readerRef}
          id="reader"
          className="w-full max-w-md h-80 bg-black rounded-lg overflow-hidden"
        ></div>
      )}

      {/* Modal / Popover */}
      {showModal && scanResult && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold mb-4">Código: {scanResult}</h2>

            {matchedItem ? (
              <div className="flex flex-col items-center gap-4">
                <p className="font-semibold">{matchedItem.descripcion}</p>
                <p className="text-blue-600 font-bold">${matchedItem.precio}</p>

                {/* Photo thumbnail or upload */}
                <ProductUploader sku={scanResult} />
              </div>
            ) : (
              <p>No hay datos para este SKU. Por favor consulta en caja.</p>
            )}

            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              onClick={() => {
                setShowModal(false);
                setScanResult(null); // reset scanner
              }}
            >
              Escanear otro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
