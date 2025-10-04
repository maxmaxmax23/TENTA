// File: src/App.jsx
import React, { useState } from "react";
import LoginForm from "./components/LoginForm.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ScannerModal from "./components/ScannerModal.jsx";
import ProductModal from "./components/ProductModal.jsx";
import ImporterModal from "./components/ImporterModal.jsx";
import MergerModal from "./components/MergerModal.jsx";
import { firestore } from "./firebase.js"; // make sure correct import

export default function App() {
  const [user, setUser] = useState(null);
  const [scannedCode, setScannedCode] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showMerger, setShowMerger] = useState(false);
  const [firebaseWrites, setFirebaseWrites] = useState(0);
  const [queue, setQueue] = useState([]);

  const incrementWrites = (count) => setFirebaseWrites((prev) => prev + count);

  // Incremental: add data from MergerModal to queue
  const addToQueue = (mergedData) => {
    setQueue((prev) => [...prev, ...mergedData]);
  };

  return (
    <div className="min-h-screen bg-black text-gold flex items-center justify-center">
      {!user ? (
        <LoginForm onLogin={setUser} />
      ) : scannedCode ? (
        <ProductModal code={scannedCode} onClose={() => setScannedCode(null)} />
      ) : (
        <>
          <Dashboard
            onScan={(code) => setScannedCode(code)}
            onOpenImporter={() => setShowImporter(true)}
            onOpenMerger={() => setShowMerger(true)}
            firebaseWrites={firebaseWrites}
          />

          {showMerger && (
            <MergerModal
              onClose={() => setShowMerger(false)}
              addToQueue={addToQueue} // Incremental: queue integration
            />
          )}

          {showImporter && (
            <ImporterModal
              onClose={() => setShowImporter(false)}
              queuedData={queue} // Incremental: use queue
              firestore={firestore}
            />
          )}
        </>
      )}
    </div>
  );
}
