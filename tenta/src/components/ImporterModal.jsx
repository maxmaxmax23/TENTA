// File: src/components/ImporterModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../firebase.js";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export default function ImporterModal({ onClose }) {
  const [equivFile, setEquivFile] = useState(null);
  const [priceFile, setPriceFile] = useState(null);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(null);
  const [writesCount, setWritesCount] = useState(0);

  const handleImport = async () => {
    if (!equivFile || !priceFile) {
      setStatus("Por favor selecciona ambos archivos.");
      return;
    }

    try {
      setStatus("Leyendo archivos...");
      const [equivRows, priceRows] = await Promise.all([
        readExcel(equivFile),
        readExcel(priceFile)
      ]);

      setStatus("Procesando y combinando datos...");
      const mergedProducts = mergeData(equivRows, priceRows);

      // Preview
      const previewData = {
        total: mergedProducts.length,
        toWrite: mergedProducts.filter(p => !p.skip).length,
        skipped: mergedProducts.filter(p => p.skip).length,
        outOfVigencia: mergedProducts.filter(p => p.outOfVigencia).length
      };
      setPreview(previewData);

      const confirm = window.confirm(
        `Se van a escribir ${previewData.toWrite} productos. Continuar?`
      );
      if (!confirm) return;

      setStatus("Escribiendo en Firebase...");
      let counter = 0;

      for (const product of mergedProducts) {
        if (product.skip || product.outOfVigencia) continue;

        const ref = doc(db, "products", product.id);
        const existing = await getDoc(ref);
        let needUpdate = true;

        if (existing.exists()) {
          const data = existing.data();
          // Check if anything changed
          needUpdate =
            data.description !== product.description ||
            data.price !== product.price ||
            data.vigencia !== product.vigencia ||
            JSON.stringify(data.barcodes.sort()) !==
              JSON.stringify(product.barcodes.sort());
        }

        if (needUpdate) {
          if (existing.exists()) await updateDoc(ref, product);
          else await setDoc(ref, product);
          counter++;
          setWritesCount(counter);
        }
      }

      setStatus(`Importación completada. ${counter} productos escritos.`);
    } catch (err) {
      console.error(err);
      setStatus("Error al procesar los archivos: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 overflow-auto">
      <div className="w-11/12 max-w-lg bg-gray-900 p-6 rounded-xl shadow-lg text-gold">
        <h2 className="text-xl font-bold mb-4">Importar Productos</h2>

        <label className="block mb-2">
          Equivalencias (barcodes → product ID)
          <input
            type="file"
            accept=".xls,.xlsx"
            onChange={(e) => setEquivFile(e.target.files[0])}
            className="w-full text-sm mt-1"
          />
        </label>

        <label className="block mb-4">
          Precios (product data)
          <input
            type="file"
            accept=".xls,.xlsx"
            onChange={(e) => setPriceFile(e.target.files[0])}
            className="w-full text-sm mt-1"
          />
        </label>

        {status && <p className="mb-2">{status}</p>}
        {preview && (
          <div className="mb-2 text-sm">
            <p>Total productos: {preview.total}</p>
            <p>A escribir: {preview.toWrite}</p>
            <p>Ignorados: {preview.skipped}</p>
            <p>Fuera de vigencia: {preview.outOfVigencia}</p>
            <p>Escrituras realizadas hasta ahora: {writesCount}</p>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={handleImport}
            className="flex-1 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition"
          >
            Procesar y previsualizar
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Utilities

function readExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      resolve(rows.slice(1)); // Skip headers
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function mergeData(equivRows, priceRows) {
  const productsMap = new Map();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Precios first
  priceRows.forEach((row, index) => {
    const productId = row[0]?.toString().trim();
    const description = row[1]?.toString().trim();
    const vigencia = normalizeDate(row[4]);
    const price = normalizePrice(row[5]);

    if (!productId) return;
    const outOfVigencia = !vigencia || new Date(vigencia) < oneYearAgo;
    if (!price) return;

    productsMap.set(productId, {
      id: productId,
      description,
      price,
      vigencia,
      barcodes: [],
      skip: false,
      outOfVigencia
    });
  });

  // Equivalencias second
  equivRows.forEach((row) => {
    const barcode = row[0]?.toString().trim();
    const productId = row[1]?.toString().trim();
    if (!barcode || !productId) return;
    if (!productsMap.has(productId)) return;
    const product = productsMap.get(productId);
    if (!product.barcodes.includes(barcode)) product.barcodes.push(barcode);
  });

  return Array.from(productsMap.values());
}

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  // Supports DD/MM/YY or DD/MM/YYYY
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  let year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
  return `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
}

function normalizePrice(priceStr) {
  if (priceStr === undefined || priceStr === null || priceStr === "") return null;
  return Number(priceStr.toString().replace(",", "."));
}
