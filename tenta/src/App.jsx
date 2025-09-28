import { useState } from "react";
import LoginForm from "./components/LoginForm.jsx";
import ScannerModal from "./components/ScannerModal.jsx";
import ProductModal from "./components/ProductModal.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [scannedCode, setScannedCode] = useState(null);

  return (
    <div className="min-h-screen bg-black text-gold flex items-center justify-center">
      {!user ? (
        <LoginForm onLogin={setUser} />
      ) : !scannedCode ? (
        <ScannerModal onScan={(code) => setScannedCode(code)} />
      ) : (
        <ProductModal code={scannedCode} onClose={() => setScannedCode(null)} />
      )}
    </div>
  );
}

export default App;
