import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import ProductUploaderModal from "./ProductUploaderModal.jsx";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";

export default function ScannerModal({ onClose }) {
  const readerRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);
  const [scannerKey, setScannerKey] = useState(0);
  const [manual, setManual] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // initialize scanner
  useEffect(() => {
    if (!readerRef.current || scanResult) return;

    const scanner = new Html5QrcodeScanner(readerRef.current.id, {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 1,
      focusMode: "continuous",
    });

    const handleDecoded = (decodedText) => {
      if (!decodedText) return;
      // Delay state updates slightly to avoid React race condition
      setManual(decodedText);
      setTimeout(() => resolveCode(decodedText), 100);
    };

    scanner.render(handleDecoded, (err) => console.warn("Scanner error:", err));

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [readerRef, scanResult, scannerKey]);

  const resetScanner = () => {
    setScanResult(null);
    setScannerKey((k) => k + 1);
    setSelectedProduct(null);
    setMatches([]);
  };

  const resolveCode = async (code) => {
    if (!code) return;
    setLoading(true);

    try {
      const productsCol = collection(db, "products");
      const snapshot = await getDocs(productsCol);
      const allProducts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Find exact or partial matches
      const results = allProducts.filter(
        (p) =>
          p.id.toLowerCase() === code.toLowerCase() ||
          (p.barcodes &&
            Array.isArray(p.barcodes) &&
            p.barcodes.some((b) => b.toLowerCase().includes(code.toLowerCase()))) ||
          (p.description &&
            p.description.toLowerCase().includes(code.toLowerCase()))
      );

      if (results.length === 1) {
        setSelectedProduct(results[0]);
      } else if (results.length > 1) {
        setMatches(
          results.map((r) => ({
            ...r,
            matchedField: r.barcodes?.includes(code)
              ? "Código de barras"
              : "Coincidencia parcial",
          }))
        );
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    if (manual.trim()) {
      resolveCode(manual.trim());
    }
  };

  const handleSelectMatch = (id) => {
    const match = matches.find((m) => m.id === id);
    if (match) setSelectedProduct(match);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4">
      {!selectedProduct ? (
        <div className="w-full max-w-md bg-gray-900 text-gold rounded-2xl p-4 flex flex-col gap-3">
          <h2 className="text-xl font-bold">Escanear o Buscar Producto</h2>

          {/* Scanner */}
          <div
            key={scannerKey}
            ref={readerRef}
            id="reader"
            className="w-full h-72 bg-black border border-gold rounded-lg overflow-hidden"
          ></div>

          {/* Manual input */}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Ingresar SKU o descripción"
              className="flex-1 bg-gray-800 text-white px-2 py-1 rounded"
            />
            <button
              onClick={handleManualSearch}
              disabled={loading}
              className="bg-gold text-black px-3 py-1 rounded font-semibold"
            >
              Buscar
            </button>
          </div>

          {/* Loading indicator */}
          {loading && (
            <p className="text-sm text-gray-400 text-center mt-2">
              Buscando productos...
            </p>
          )}

          {/* Scrollable matches list */}
          {matches && matches.length > 0 && (
            <div
              className="overflow-y-auto max-h-60 mt-2 border border-gold rounded p-2 scroll-smooth overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMatch(m.id)}
                  className="w-full text-left p-2 mb-1 bg-gray-800 rounded hover:bg-gray-700 active:bg-gray-600 transition-colors"
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="text-sm font-semibold">
                        {m.description || "Sin descripción"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {m.matchedField} • {m.id}
                      </div>
                      {Array.isArray(m.barcodes) && m.barcodes.length > 0 && (
                        <div className="text-xs text-gray-400 truncate">
                          {m.barcodes.join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gold self-start">Seleccionar</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-4 bg-gray-700 text-gold py-2 rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      ) : (
        <ProductUploaderModal
          sku={selectedProduct.id}
          matchedItem={selectedProduct}
          onClose={resetScanner}
        />
      )}
    </div>
  );
}
