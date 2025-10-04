// File: src/components/Dashboard.jsx
import React, { useState } from "react";
import MergerModal from "./MergerModal.jsx";

export default function Dashboard({ onScan, firebaseWrites }) {
  const [showMerger, setShowMerger] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => setShowMerger(true)}
          className="bg-gold text-black px-4 py-2 rounded hover:opacity-80"
        >
          Merge Excel Files
        </button>

        {/* Other buttons like scan, upload, etc. */}
      </div>

      {showMerger && <MergerModal onClose={() => setShowMerger(false)} />}
      
      <div className="mt-4 text-gold">
        Firebase Writes: {firebaseWrites}
      </div>
    </div>
  );
}
