// File: src/App.jsx
import { useState } from "react";
import LoginForm from "./components/LoginForm.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ProductModal from "./components/ProductModal.jsx";
import ImporterModal from "./components/ImporterModal.jsx";
import ScannerModal from "./components/ScannerModal.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [firebaseWrites, setFirebaseWrites] = useState(0); // Tracks writes for quota

  const incrementWrites = (count) => setFirebaseWrites((prev) => prev + count);

  const handleScan = (productData) => {
    setScannedProduct(productData);
    setShowScanner(false);
  };

  return (
    <div className="min-h-screen bg-black text-gold flex items-center justify-center">
      {!user ? (
        <LoginForm onLogin={setUser} />
      ) : scannedProduct ? (
        <ProductModal
          code={scannedProduct.productId}
          onClose={() => setScannedProduct(null)}
        />
      ) : (
        <>
          <Dashboard
            onScan={() => setShowScanner(true)}
            onOpenImporter={() => setShowImporter(true)}
            firebaseWrites={firebaseWrites}
          />

          {showScanner && (
            <ScannerModal
              onClose={() => setShowScanner(false)}
              onMatchFound={handleScan}
            />
          )}

          {showImporter && (
            <ImporterModal
              onClose={() => setShowImporter(false)}
              incrementWrites={incrementWrites}
            />
          )}
        </>
      )}
    </div>
  );
}
