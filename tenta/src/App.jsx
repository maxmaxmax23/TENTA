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
  const [mergedDataQueue, setMergedDataQueue] = useState([]);
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
            onOpenMerger={() => setShowMerger(true)}
            firebaseWrites={firebaseWrites}
          />

          {showMerger && (
            <MergerModal
              onClose={() => setShowMerger(false)}
              setMergedDataQueue={setMergedDataQueue}
            />
          )}

          {showImporter && (
            <ImporterModal
              onClose={() => setShowImporter(false)}
              mergedData={mergedDataQueue}
              incrementWrites={incrementWrites}
            />
          )}
        </>
      )}
    </div>
  );
}
