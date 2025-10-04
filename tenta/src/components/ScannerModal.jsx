// File: src/components/ScannerModal.jsx
import React, { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js"; // Correct import
import PropTypes from "prop-types";

export default function ScannerModal({ onClose, onMatchFound }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // First, try to get by productId
      const productRef = doc(db, "products", code.trim());
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        onMatchFound(productSnap.data());
      } else {
        // Scan through barcodes arrays
        const querySnapshot = await db.collection("products").get();
        let found = false;
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (Array.isArray(data.barcodes) && data.barcodes.includes(code.trim())) {
            found = true;
            onMatchFound(data);
          }
        });
        if (!found) setError("Código no encontrado en productos ni barcodes.");
      }
    } catch (err) {
      console.error("Error buscando el producto:", err);
      setError("Error al buscar el producto. Ver consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-gold rounded-2xl p-4 w-full max-w-md flex flex-col gap-4">
        <h2 className="text-xl font-bold">Escanear Producto</h2>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ingrese SKU o Código de barras"
          className="p-2 rounded bg-gray-800 text-white"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleScan}
            disabled={loading}
            className="bg-gold text-black py-2 px-4 rounded hover:opacity-80 transition flex-1"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-700 text-gold py-2 px-4 rounded hover:bg-gray-600 flex-1"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

ScannerModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onMatchFound: PropTypes.func.isRequired,
};
