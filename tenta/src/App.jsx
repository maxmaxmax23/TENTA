import { useState } from "react";
import Login from "./components/Login.jsx";
import Scanner from "./components/Scanner.jsx";
import ProductUploaderModal from "./components/ProductUploaderModal.jsx";
import Lista from "./tentadb.json";

function App() {
  const [user, setUser] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (user) => setUser(user);
  const handleScan = (code) => {
    setScanResult(code);
    setShowUploader(true);
  };
  const handleUploadComplete = () => {
    setShowUploader(false);
    setLoading(false);
    setScanResult(null); // Reset for next scan
  };

  const productInfo = scanResult
    ? Lista.find((item) => item.id === scanResult)
    : null;

  return (
    <div className="w-full flex flex-col items-center p-4 space-y-6">
      {!user && (
        <div className="animate-fade-in">
          <Login onLogin={handleLogin} />
        </div>
      )}
      {user && !scanResult && (
        <div className="animate-fade-in">
          <Scanner onScan={handleScan} />
        </div>
      )}
      {loading && (
        <div className="text-lg text-center mt-4 animate-pulse">Cargando...</div>
      )}
      {showUploader && scanResult && (
        <div className="animate-slide-up">
          <ProductUploaderModal
            scanResult={scanResult}
            productInfo={productInfo}
            onUploadComplete={handleUploadComplete}
            setLoading={setLoading}
          />
        </div>
      )}
    </div>
  );
}

export default App;
