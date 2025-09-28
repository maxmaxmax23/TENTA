import React, { useState } from 'react';
import Login from './components/Login.jsx';
import Scanner from './components/Scanner.jsx';
import ProductUploaderModal from './components/ProductUploaderModal.jsx';
import Lista from './tentadb.json';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [items, setItems] = useState(Lista);
  const [showUploader, setShowUploader] = useState(false);

  const handleLogin = () => setLoggedIn(true);

  const handleScan = (result) => {
    setScanResult(result);
    setShowUploader(true);
  };

  const handleUpload = (sku, url) => {
    setItems(prev => prev.map(item => item.id === sku ? { ...item, imageUrl: url } : item));
  };

  return (
    <div className="min-h-screen bg-black text-gold p-4">
      {!loggedIn && <Login onLogin={handleLogin} />}
      {loggedIn && !scanResult && <Scanner onScan={handleScan} />}
      {scanResult && showUploader && (
        <ProductUploaderModal
          sku={scanResult}
          itemData={items.find(i => i.id === scanResult)}
          onUpload={handleUpload}
          onClose={() => setShowUploader(false)}
        />
      )}
    </div>
  );
}
