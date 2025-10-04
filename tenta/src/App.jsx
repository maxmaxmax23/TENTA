// File: src/App.jsx
import { useState } from "react";
import LoginForm from "./components/LoginForm.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ScannerModal from "./components/ScannerModal.jsx";
import ProductModal from "./components/ProductModal.jsx";
import ImporterModal from "./components/ImporterModal.jsx";
import MergerModal from "./components/MergerModal.jsx"; // Incremental patch

export default function App() {
  const [user, setUser] = useState(null);
  const [scannedCode, setScannedCode] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showMerger, setShowMerger] = useState(false); // Incremental patch
  const [mergedData, setMergedData] = useState([]); // Incremental patch
  const [firebaseWrites, setFirebaseWrites] = useState(0);

  const incrementWrites = (count) => setFirebaseWrites((prev) => prev + count);

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
            onOpenMerger={() => setShowMerger(true)} // Incremental patch
            firebaseWrites={firebaseWrites}
          />

          {showImporter && (
            <ImporterModal
              onClose={() => setShowImporter(false)}
              incrementWrites={incrementWrites}
              mergedData={mergedData} // Provide mergedData for import
            />
          )}

          {showMerger && (
            <MergerModal
              onClose={() => setShowMerger(false)}
              setMergedData={setMergedData} // Incremental patch
            />
          )}

          {scannedCode && (
            <ScannerModal code={scannedCode} onClose={() => setScannedCode(null)} />
          )}
        </>
      )}
    </div>
  );
}
