// File: src/App.jsx
import { useState } from "react";
import LoginForm from "./components/LoginForm.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ScannerModal from "./components/ScannerModal.jsx";
import ProductModal from "./components/ProductModal.jsx";
import ImporterModal from "./components/ImporterModal.jsx";
import MergerModal from "./components/MergerModal.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [scannedCode, setScannedCode] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showMerger, setShowMerger] = useState(false);
  const [firebaseWrites, setFirebaseWrites] = useState(0); // Tracks writes for quota
  const [queueData, setQueueData] = useState([]); // Queue for ImporterModal

  const incrementWrites = (count) => setFirebaseWrites((prev) => prev + count);

  // Incremental: Add merged data to queue
  const handleAddToQueue = (mergedData) => {
    setQueueData((prev) => [...prev, ...mergedData]);
    setShowMerger(false);
    setShowImporter(true); // Automatically open importer after adding to queue
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
              addToQueue={handleAddToQueue} // Incremental: pass function to MergerModal
            />
          )}

          {showImporter && (
            <ImporterModal
              onClose={() => setShowImporter(false)}
              queuedData={queueData} // Pass queue to ImporterModal
              incrementWrites={incrementWrites}
            />
          )}
        </>
      )}
    </div>
  );
}
