// File: src/components/Dashboard.jsx
import { useState } from "react";
import ImporterModal from "./ImporterModal";
import ScannerModal from "./ScannerModal";
import ProductCard from "./ProductCard";

export default function Dashboard() {
  const [showImporter, setShowImporter] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [firebaseWrites, setFirebaseWrites] = useState(0);

  return (
    <div className="p-4 bg-black min-h-screen text-gold">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="flex flex-wrap gap-4 mb-4">
        <button
          onClick={() => setShowScanner(true)}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition"
        >
          Abrir Scanner
        </button>
        <button
          onClick={() => setShowImporter(true)}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition"
        >
          Importar Productos
        </button>
      </div>

      <div className="mb-4">
        <span className="font-semibold">Firestore writes acumuladas: </span>
        {firebaseWrites}
      </div>

      {showImporter && (
        <ImporterModal
          onClose={() => setShowImporter(false)}
          firebaseWritesCounter={firebaseWrites}
          setFirebaseWritesCounter={setFirebaseWrites}
        />
      )}

      {showScanner && <ScannerModal onClose={() => setShowScanner(false)} />}

      {/* Future: ProductCard grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {/* Placeholder for ProductCards */}
        {/* <ProductCard ... /> */}
      </div>
    </div>
  );
}
