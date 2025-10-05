import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import ProductUploaderModal from "./ProductUploaderModal.jsx";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../firebase.js";

export default function ScannerModal({ onClose }) {
  const readerRef = useRef(null);
  const [manualSearch, setManualSearch] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  // --- Firestore search by barcode or productId ---
  const searchProducts = async (term) => {
    if (!term) {
      setMatches([]);
      return;
    }

    const lowerTerm = term.toString().trim().toLowerCase();

    try {
      const q = query(collection(db, "products"));
      const snapshot = await getDocs(q);

      const results = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((item) => {
          const barcodeMatch = item.barcodeArray?.some((b) =>
            b.toString().toLowerCase().includes(lowerTerm)
          );
          const idMatch = item.id?.toLowerCase().includes(lowerTerm);
          return barcodeMatch || idMatch;
        })
        .map((item) => {
          const barcodeMatch = item.barcodeArray?.some((b) =>
            b.toString().toLowerCase().includes(lowerTerm)
          );
          const idMatch = item.id?.toLowerCase().includes(lowerTerm);
          return {
            ...item,
            matchedBy: barcodeMatch ? "barcode" : idMatch ? "productId" : "description",
          };
        });

      // Prioritize barcode matches
      results.sort((a, b) => (a.matchedBy === "barcode" ? -1 : 1));

      setMatches(results);

      // Auto-open if only one match
      if (results.length === 1) openProduct(results[0]);
    } catch (error) {
      console.error("Error searching products:", error);
      setMatches([]);
    }
  };

  // --- Handle scanning ---
  useEffect(() => {
    if (!readerRef.current || !isScanning) return;

    const scanner = new Html5QrcodeScanner(readerRef.current.id, {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 1,
    });

    scanner.render(
      (decodedText) => {
        setManualSearch(decodedText);
        searchProducts(decodedText);
        setIsScanning(false);
        scanner.clear();
      },
      (err) => console.warn("QR error", err)
    );

    return () => scanner.clear();
  }, [readerRef, isScanning, scannerKey]);

  const openProduct = (item) => {
    setSelectedItem(item);
    setShowUploader(true);
    setMatches([]);
  };

  const resetScanner = () => {
    setManualSearch("");
    setMatches([]);
    setSelectedItem(null);
    setShowUploader(false);
    setScannerKey((k) => k + 1);
    setIsScanning(false);
  };

  // --- Render (keep approved visual) ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4 z-50">
      {!showUploader ? (
        <div className="w-full max-w-md flex flex-col gap-3 bg-gray-900 text-gold rounded-2xl p-4">
          <h2 className="text-xl font-bold mb-2 text-center">Buscar / Escanear Producto</h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualSearch}
              onChange={(e) => {
                setManualSearch(e.target.value);
                searchProducts(e.target.value);
              }}
              placeholder="Buscar por ID o código..."
              className="flex-1 p-2 rounded bg-black text-white border border-gold text-sm"
            />
            <button
              onClick={() => setIsScanning((prev) => !prev)}
              className="bg-gold text-black px-3 rounded text-sm font-semibold"
            >
              {isScanning ? "Detener" : "Escanear"}
            </button>
          </div>

          {isScanning && (
            <div
              key={scannerKey}
              ref={readerRef}
              id="reader"
              className="w-full h-64 bg-black border border-gold rounded-lg overflow-hidden mt-2"
            ></div>
          )}

          {matches.length > 0 && (
            <div className="overflow-y-auto max-h-64 mt-3 border border-gold rounded">
              {matches.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openProduct(item)}
                  className="p-2 border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
                >
                  <p className="text-sm font-bold text-gold">{item.id}</p>
                  <p className="text-xs text-gray-300">Códigos: {item.barcodeArray?.join(", ")}</p>
                  <p className="text-xs text-gray-400 italic truncate">{item.description}</p>
                  <p className="text-[10px] text-blue-400">Coincidencia: {item.matchedBy}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-3 bg-gray-700 text-gold py-2 rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      ) : (
        <ProductUploaderModal
          product={selectedItem}
          onClose={resetScanner}
        />
      )}
    </div>
  );
}
