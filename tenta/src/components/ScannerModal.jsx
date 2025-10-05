import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import ProductUploaderModal from "./ProductUploaderModal.jsx";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase.js";

export default function ScannerModal({ onClose }) {
  const readerRef = useRef(null);
  const [scanResult, setScanResult] = useState("");
  const [scannerKey, setScannerKey] = useState(0);
  const [manualSearch, setManualSearch] = useState("");
  const [matchedItems, setMatchedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Firestore search by barcode or productId
  const searchProducts = async (term) => {
    if (!term) return;
    const q = query(collection(db, "products"));
    const snapshot = await getDocs(q);
    const results = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((item) => {
        const barcodeMatch = item.barcodeArray?.some((b) =>
          b.toString().includes(term)
        );
        const idMatch = item.id?.toString().includes(term);
        return barcodeMatch || idMatch;
      });
    setMatchedItems(results);
  };

  useEffect(() => {
    if (!readerRef.current || !isScanning) return;

    const scanner = new Html5QrcodeScanner(readerRef.current.id, {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 1,
    });

    scanner.render(
      (result) => {
        setScanResult(result);
        setIsScanning(false);
        scanner.clear();
        setManualSearch(result);
        searchProducts(result);
      },
      (err) => console.warn("QR error", err)
    );

    return () => scanner.clear();
  }, [readerRef, isScanning, scannerKey]);

  const handleSelect = (item) => {
    setSelectedItem(item);
    setShowUploader(true);
  };

  const resetScanner = () => {
    setScanResult("");
    setScannerKey((k) => k + 1);
    setMatchedItems([]);
    setManualSearch("");
    setSelectedItem(null);
    setShowUploader(false);
    setIsScanning(false);
  };

  return (
    <div className="w-full flex flex-col items-center p-4">
      {!showUploader && (
        <>
          <div className="flex w-full mb-2">
            <input
              className="flex-1 border border-gold bg-black text-gold rounded-l p-2"
              placeholder="Search or scan product..."
              value={manualSearch}
              onChange={(e) => {
                setManualSearch(e.target.value);
                searchProducts(e.target.value);
              }}
            />
            <button
              className="bg-gold text-black px-3 py-2 rounded-r"
              onClick={() => setIsScanning(!isScanning)}
            >
              {isScanning ? "Stop" : "Scan"}
            </button>
          </div>

          {isScanning && (
            <div
              key={scannerKey}
              ref={readerRef}
              id="reader"
              className="w-full max-w-md h-80 bg-black border border-gold rounded-lg overflow-hidden"
            ></div>
          )}

          {matchedItems.length > 0 && (
            <div className="mt-3 w-full max-h-96 overflow-y-auto border border-gold rounded-lg">
              {matchedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="p-2 border-b border-gold hover:bg-gold hover:text-black cursor-pointer"
                >
                  <p className="font-bold">{item.id}</p>
                  <p className="text-sm">{item.description}</p>
                  {item.barcodeArray && (
                    <p className="text-xs text-gray-400">
                      {item.barcodeArray.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-4 bg-gold text-black py-2 px-4 rounded hover:opacity-80"
          >
            Close
          </button>
        </>
      )}

      {showUploader && selectedItem && (
        <ProductUploaderModal
          product={selectedItem}
          onClose={resetScanner}
        />
      )}
    </div>
  );
}
