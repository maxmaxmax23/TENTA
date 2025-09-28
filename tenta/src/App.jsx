import { useState } from "react";
import LoginForm from "./components/LoginForm.jsx";
import ScannerModal from "./components/ScannerModal.jsx";
import ProductModal from "./components/ProductModal.jsx";
import JsonSyncModal from "./components/JsonSyncModal.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);

  return (
    <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center text-gold">
      {!user ? (
        <LoginForm setUser={setUser} />
      ) : (
        <>
          {!scanResult ? (
            <ScannerModal setScanResult={setScanResult} />
          ) : (
            <ProductModal
              scanResult={scanResult}
              setScanResult={setScanResult}
            />
          )}
          <button
            className="mt-4 px-6 py-3 rounded-full bg-gold text-black font-semibold animate-pulse"
            onClick={() => setShowJsonModal(true)}
          >
            JSON Sync
          </button>
          {showJsonModal && (
            <JsonSyncModal closeModal={() => setShowJsonModal(false)} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
