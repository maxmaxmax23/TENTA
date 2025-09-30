// File: src/App.jsx
import { useState } from "react";
import LoginForm from "./components/LoginForm.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ScannerModal from "./components/ScannerModal.jsx";
import ProductModal from "./components/ProductModal.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [scannedCode, setScannedCode] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-gold flex items-center justify-center">
        <LoginForm onLogin={setUser} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gold flex items-center justify-center">
      <Dashboard
        onScan={(code) => {
          setScannedCode(code);
          setShowScanner(false); // close scanner after scan
        }}
        onOpenScanner={() => setShowScanner(true)}
      />

      {/* Overlays */}
      {showScanner && (
        <ScannerModal
          onScan={(code) => {
            setScannedCode(code);
            setShowScanner(false);
          }}
        />
      )}

      {scannedCode && (
        <ProductModal
          code={scannedCode}
          onClose={() => setScannedCode(null)}
        />
      )}
    </div>
  );
}
