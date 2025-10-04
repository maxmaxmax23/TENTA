// File: src/App.jsx
import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import ImporterModal from "./components/ImporterModal";
import MergerModal from "./components/MergerModal";
import ScannerModal from "./components/ScannerModal";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export default function App() {
  const [firebaseWrites, setFirebaseWrites] = useState(0);
  const [showImporter, setShowImporter] = useState(false);
  const [showMerger, setShowMerger] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [queueData, setQueueData] = useState([]);

  const handleScan = async (code) => {
    console.log("Scanned or entered:", code);
    setShowScanner(false);
    if (!code) return;

    try {
      // Try to match directly by productId
      let docRef = doc(db, "products", code);
      let docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // If not found, look for document where barcode array contains this code
        const allDocs = await import("firebase/firestore").then(async (m) => {
          const { getDocs, collection } = m;
          const querySnapshot = await getDocs(collection(db, "products"));
          let found = null;
          querySnapshot.forEach((d) => {
            const data = d.data();
            if (data.barcode && Array.isArray(data.barcode)) {
              if (data.barcode.includes(code)) found = { id: d.id, ...data };
            }
          });
          return found;
        });

        if (allDocs) {
          setScannedProduct(allDocs);
        } else {
          alert("Producto no encontrado en Firestore.");
        }
      } else {
        setScannedProduct({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (err) {
      console.error("Error al buscar producto:", err);
      alert("Error buscando producto en Firestore.");
    }
  };

  const handleAddToQueue = (mergedData) => {
    setQueueData((prev) => [...prev, ...mergedData]);
    alert(`Se añadieron ${mergedData.length} productos a la cola.`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Dashboard
        onScan={() => setShowScanner(true)}
        onOpenImporter={() => setShowImporter(true)}
        onOpenMerger={() => setShowMerger(true)}
        firebaseWrites={firebaseWrites}
      />

      {/* Scanner Modal */}
      {showScanner && (
        <ScannerModal
          onClose={() => setShowScanner(false)}
          onScan={handleScan}
        />
      )}

      {/* Importer Modal */}
      {showImporter && (
        <ImporterModal
          onClose={() => setShowImporter(false)}
          firebaseWrites={firebaseWrites}
          setFirebaseWrites={setFirebaseWrites}
          queuedData={queueData}
          clearQueue={() => setQueueData([])}
        />
      )}

      {/* Merger Modal */}
      {showMerger && (
        <MergerModal
          onClose={() => setShowMerger(false)}
          addToQueue={handleAddToQueue}
        />
      )}

      {/* Product details overlay (for scanned product) */}
      {scannedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-4 rounded-2xl text-gold w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Producto encontrado</h2>
            <p><strong>ID:</strong> {scannedProduct.id}</p>
            <p><strong>Nombre:</strong> {scannedProduct.name || "N/A"}</p>
            <p><strong>Precio:</strong> {scannedProduct.price || "N/A"}</p>
            <p><strong>Barras:</strong> {scannedProduct.barcode?.join(", ") || "N/A"}</p>
            <button
              className="mt-4 w-full bg-gold text-black py-2 rounded-lg font-semibold"
              onClick={() => setScannedProduct(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
