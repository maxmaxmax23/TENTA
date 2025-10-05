import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import ProductUploaderModal from "./ProductUploaderModal.jsx";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase.js";

export default function ScannerModal() {
  const readerRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);
  const [scannerKey, setScannerKey] = useState(0);
  const [manualSearch, setManualSearch] = useState("");
  const [matches, setMatches] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // --- Handle Scanner Read ---
  const handleScan = (result) => {
    if (result) {
      setScanResult(result);
      setIsScanning(false);
      handleSearch(result); // Immediately search scanned code
    }
  };

  // --- Initialize Scanner ---
  useEffect(() => {
    if (!isScanning || scanResult) return;

    const scanner = new Html5QrcodeScanner(readerRef.current.id, {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      aspectRatio: 1,
      focusMode: "continuous",
    });

    scanner.render(handleScan, (err) => console.warn(err));
    return () => scanner.clear();
  }, [isScanning, scannerKey, scanResult]);

  // --- Handle Search Logic ---
  const handleSearch = async (term) => {
    if (!term.trim()) {
      setMatches([]);
      return;
    }

    try {
      const productsRef = collection(db, "products");
      const qById = query(productsRef, where("productId", "==", term));
      const qByBarcode = query(productsRef, where("barcodes", "array-contains", term));

      const [idSnapshot, barcodeSnapshot] = await Promise.all([
        getDocs(qById),
        getDocs(qByBarcode),
      ]);

      const results = [
        ...idSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        ...barcodeSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      ];

      // Remove duplicates by id
      const uniqueResults = results.filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i
      );

      setMatches(uniqueResults);

      // Auto-open modal if a single match
      if (uniqueResults.length === 1) {
        setSelectedProduct(uniqueResults[0]);
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  // --- 🔁 Restore Live Search ---
  useEffect(() => {
    if (manualSearch && !isScanning) {
      const delay = setTimeout(() => handleSearch(manualSearch), 200); // debounce
      return () => clearTimeout(delay);
    } else {
      setMatches([]);
    }
  }, [manualSearch, isScanning]);

  // --- Reset Logic ---
  const resetScanner = () => {
    setScanResult(null);
    setScannerKey((k) => k + 1);
    setMatches([]);
    setSelectedProduct(null);
    setManualSearch("");
  };

  return (
    <div className="w-full flex flex-col items-center mt-4 px-4">
      {/* Search Field + Controls */}
      <div className="flex flex-col w-full max-w-md gap-2">
        <input
          type="text"
          placeholder="Search by Product ID or Barcode..."
          value={manualSearch}
          onChange={(e) => setManualSearch(e.target.value)}
          className="p-2 border border-gray-400 rounded-md w-full"
        />
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setIsScanning((prev) => !prev)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            {isScanning ? "Stop Scanning" : "Start Scanning"}
          </button>
          <button
            onClick={resetScanner}
            className="px-4 py-2 bg-gray-400 text-white rounded-md"
          >
            Reset
          </button>
        </div>
      </div>

      {/* QR Scanner */}
      {isScanning && !scanResult && (
        <div
          key={scannerKey}
          ref={readerRef}
          id="reader"
          className="w-full max-w-md h-80 bg-black border border-gold rounded-lg overflow-hidden mt-4"
        ></div>
      )}

      {/* Search Results */}
      {matches.length > 1 && (
        <div className="w-full max-w-md mt-4 border border-gray-300 rounded-lg max-h-80 overflow-y-auto">
          {matches.map((item) => (
            <div
              key={item.id}
              className="p-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
              onClick={() => setSelectedProduct(item)}
            >
              <div className="font-semibold text-sm">{item.productId}</div>
              <div className="text-xs text-gray-600">{item.description || "No description"}</div>
              <div className="text-xs text-gray-400">
                {item.barcodes?.length ? `Barcodes: ${item.barcodes.join(", ")}` : "No barcodes"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <ProductUploaderModal
          sku={selectedProduct.productId}
          matchedItem={selectedProduct}
          onClose={resetScanner}
        />
      )}
    </div>
  );
}
