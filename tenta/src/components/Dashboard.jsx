// src/components/Dashboard.jsx
import { useState } from "react";
import ImporterModal from "./ImporterModal";
import ScannerModal from "./ScannerModal";

export default function Dashboard() {
  const [showImporter, setShowImporter] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className="p-4 min-h-screen bg-gray-50 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => setShowScanner(true)}
          className="px-6 py-3 bg-black text-gold font-semibold rounded-lg hover:bg-gray-800 transition"
        >
          Open Scanner
        </button>

        <button
          onClick={() => setShowImporter(true)}
          className="px-6 py-3 bg-black text-gold font-semibold rounded-lg hover:bg-gray-800 transition"
        >
          Import / Merge Files
        </button>

        <button
          onClick={() => alert("Export feature not implemented yet")}
          className="px-6 py-3 bg-black text-gold font-semibold rounded-lg hover:bg-gray-800 transition"
        >
          Export JSON / Excel
        </button>

        <button
          onClick={() => alert("Inventory feature coming soon")}
          className="px-6 py-3 bg-black text-gold font-semibold rounded-lg hover:bg-gray-800 transition"
        >
          Inventory
        </button>
      </div>

      {/* Modals */}
      {showImporter && <ImporterModal onClose={() => setShowImporter(false)} />}
      {showScanner && <ScannerModal onClose={() => setShowScanner(false)} />}
    </div>
  );
}
