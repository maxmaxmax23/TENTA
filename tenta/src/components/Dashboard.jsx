// File: src/components/Dashboard.jsx
import React from "react";

export default function Dashboard({ onScan, onOpenImporter, onOpenMerger, firebaseWrites }) {
  return (
    <div className="p-4 w-full max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gold mb-4">Dashboard</h1>

      <div className="flex flex-col gap-3">
        <button
          className="bg-gold text-black py-2 px-4 rounded hover:opacity-80 transition"
          onClick={onScan}
        >
          Scan Product
        </button>

        <button
          className="bg-gold text-black py-2 px-4 rounded hover:opacity-80 transition"
          onClick={onOpenImporter}
        >
          Import JSON
        </button>

        <button
          className="bg-gold text-black py-2 px-4 rounded hover:opacity-80 transition"
          onClick={onOpenMerger}
        >
          Merge Excel Files
        </button>

        {/* Placeholder for future inventory/export buttons */}
        {/* <button>Export JSON / Excel</button> */}
        {/* <button>Inventory</button> */}
      </div>

      <div className="mt-6 text-gold">
        <p>Firebase writes so far: {firebaseWrites}</p>
      </div>
    </div>
  );
}
