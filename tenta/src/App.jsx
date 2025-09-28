import { useState } from "react";
import Login from "./components/Login.jsx";
import Scanner from "./components/Scanner.jsx";
import ProductUploaderModal from "./components/ProductUploaderModal.jsx";
import Lista from "./tentadb.json";

export default function App() {
  const [user, setUser] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScan = (result) => {
    setScanResult(result);
    setShowUploader(true);
  };

  const handleUploadComplete = () => {
    setShowUploader(false);
    setScanResult(null);
    setLoading(false);
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative">
      {!scanResult && <Scanner onScan={handleScan} />}
      {showUploader && (
        <ProductUploaderModal
          scanResult={scanResult}
          productInfo={Lista.find((p) => p.id === scanResult)}
          onUploadComplete={handleUploadComplete}
          setLoading={setLoading}
        />
      )}
      {loading && <p className="loading">Cargando...</p>}
    </div>
  );
}
