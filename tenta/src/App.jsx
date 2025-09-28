// src/App.jsx
import React, { useState } from "react";
import Login from "./components/Login.jsx";
import Scanner from "./components/Scanner.jsx";
import ProductUploader from "./components/ProductUploader.jsx";

function App() {
  const [scannedSKU, setScannedSKU] = useState("");

  return (
    <div style={{ padding: "1rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Tenta Catalog</h1>

      <Login />

      <Scanner onScan={setScannedSKU} />

      {scannedSKU && (
        <p>
          Current SKU: <strong>{scannedSKU}</strong>
        </p>
      )}

      <ProductUploader sku={scannedSKU} />
    </div>
  );
}

export default App;
