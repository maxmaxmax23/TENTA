import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import LoginForm from "./components/LoginForm.jsx";
import ProductModal from "./components/ProductModal.jsx";
import Lista from "./tentadb.json";

function App() {
  const [user, setUser] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    if (!user) return;

    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    });

    scanner.render(
      (result) => {
        scanner.clear();
        setScanResult(result);
      },
      (err) => console.warn(err)
    );

    return () => scanner.clear();
  }, [user]);

  if (!user) return <LoginForm onLogin={setUser} />;

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-black text-gold p-4">
      {!scanResult && <div id="reader" className="w-full max-w-md"></div>}

      {scanResult && (
        <ProductModal
          key={scanResult}
          scanResult={scanResult}
          product={Lista.find((p) => p.id === scanResult)}
          onClose={() => setScanResult(null)}
        />
      )}
    </div>
  );
}

export default App;
