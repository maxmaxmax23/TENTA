// src/App.jsx
import React, { useState } from "react";
import Login from "./components/Login.jsx";
import Scanner from "./components/Scanner.jsx";
import ProductUploader from "./components/ProductUploader.jsx";

function App() {
  const [scannedSKU, setScannedSKU] = useState("");

  return (
    <div
      style={{
        padding: "1rem",
        fontFamily: "Arial, sans-serif",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      <Login />

      <div
        style={{
          marginBottom: "1rem",
          border: "1px solid #ccc",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Scanner onScan={setScannedSKU} />
      </div>

      {scannedSKU && (
        <p
          style={{
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: "1rem",
            fontSize: "1.1rem",
          }}
        >
          Current SKU: <span style={{ color: "#007BFF" }}>{scannedSKU}</span>
        </p>
      )}

      <ProductUploader sku={scannedSKU} />
    </div>
  );
}

export default App;
