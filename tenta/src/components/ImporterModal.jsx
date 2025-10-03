// src/components/ImporterModal.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ImporterModal({ onClose }) {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [skippedData, setSkippedData] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);

  // Parse XLSX file into rows
  const parseFile = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  };

  // Handle file selection
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === "equivalencias") {
      setEquivalenciasFile(file);
    } else {
      setPreciosFile(file);
    }
  };

  // Merge files and prepare preview
  const handlePreview = async () => {
    if (!equivalenciasFile || !preciosFile) {
      alert("Debes cargar ambos archivos: Equivalencias y Precios.");
      return;
    }

    setProcessing(true);
    setPreviewData([]);
    setSkippedData([]);

    try {
      const equivalencias = await parseFile(equivalenciasFile);
      const precios = await parseFile(preciosFile);

      // Map equivalencias: barcode → productId
      const eqMap = {};
      equivalencias.slice(1).forEach((row) => {
        const barcode = row[0];
        const productId = row[1];
        if (barcode && productId) {
          eqMap[productId] = barcode;
        }
      });

      const valid = [];
      const skipped = [];

      precios.slice(1).forEach((row) => {
        const productId = row[0];
        const description = row[1];
        const lista = row[2];
        const nombreLista = row[3];
        const vigencia = row[4];
        const precio = row[5];

        if (!productId || !vigencia || !precio) {
          skipped.push({ productId, reason: "Faltan campos obligatorios" });
          return;
        }

        // Parse vigencia (DD/MM/YY)
        const parts = vigencia.split("/");
        if (parts.length !== 3) {
          skipped.push({ productId, reason: "Vigencia inválida" });
          return;
        }
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = 2000 + parseInt(parts[2], 10); // YY → 20YY
        const date = new Date(year, month, day);

        if (isNaN(date.getTime())) {
          skipped.push({ productId, reason: "Fecha no válida" });
          return;
        }

        const now = new Date();
        const oneYearLater = new Date();
        oneYearLater.setFullYear(now.getFullYear() + 1);

        if (date < now || date > oneYearLater) {
          skipped.push({ productId, reason: "Vigencia fuera de rango" });
          return;
        }

        valid.push({
          productId,
          barcode: eqMap[productId] || null,
          description,
          lista,
          nombreLista,
          vigencia: date.toISOString().split("T")[0],
          precio,
        });
      });

      setPreviewData(valid);
      setSkippedData(skipped);
    } catch (err) {
      console.error("Error al procesar archivos:", err);
      alert("Error al procesar los archivos. Ver consola.");
    } finally {
      setProcessing(false);
    }
  };

  // Confirm and write to Firestore
  const handleImport = async () => {
    if (previewData.length === 0) {
      alert("No hay productos válidos para importar.");
      return;
    }

    setImporting(true);
    try {
      const colRef = collection(db, "products");
      for (const item of previewData) {
        const docRef = doc(colRef, item.productId.toString());
        await setDoc(docRef, item, { merge: true });
      }
      alert("Importación completada con éxito.");
      onClose();
    } catch (err) {
      console.error("Error al importar a Firestore:", err);
      alert("Error al importar a Firestore. Ver consola.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-3xl">
        <h2 className="text-xl font-bold mb-4">Importador de Productos</h2>

        <div className="mb-3">
          <label className="block mb-1 font-semibold">Archivo Equivalencias:</label>
          <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, "equivalencias")} />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-semibold">Archivo Precios:</label>
          <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, "precios")} />
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={handlePreview}
            disabled={processing}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {processing ? "Procesando..." : "Procesar y Previsualizar"}
          </button>
          <button
            onClick={handleImport}
            disabled={importing || previewData.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {importing ? "Importando..." : "Confirmar e Importar"}
          </button>
          <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded">
            Cancelar
          </button>
        </div>

        {previewData.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Productos a Importar ({previewData.length})</h3>
            <ul className="max-h-40 overflow-y-auto text-sm border p-2">
              {previewData.slice(0, 20).map((item, i) => (
                <li key={i}>
                  {item.productId} - {item.description} - ${item.precio} - Vigencia: {item.vigencia}
                </li>
              ))}
            </ul>
            {previewData.length > 20 && (
              <p className="text-xs text-gray-500">... y {previewData.length - 20} más</p>
            )}
          </div>
        )}

        {skippedData.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Productos Ignorados ({skippedData.length})</h3>
            <ul className="max-h-40 overflow-y-auto text-sm border p-2 text-red-600">
              {skippedData.slice(0, 20).map((item, i) => (
                <li key={i}>
                  {item.productId || "N/A"} - {item.reason}
                </li>
              ))}
            </ul>
            {skippedData.length > 20 && (
              <p className="text-xs text-gray-500">... y {skippedData.length - 20} más</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
