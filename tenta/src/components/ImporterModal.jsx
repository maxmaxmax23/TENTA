// File: src/components/ImporterModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";

export default function ImporterModal({ onClose, onPreview }) {
  const [equivFile, setEquivFile] = useState(null);
  const [precioFile, setPrecioFile] = useState(null);
  const [log, setLog] = useState([]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === "equiv") setEquivFile(file);
    else setPrecioFile(file);
  };

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  };

  const mergeFiles = async () => {
    if (!equivFile || !precioFile) {
      alert("Selecciona ambos archivos: Equivalencias y Precios");
      return;
    }

    try {
      const [equivRows, precioRows] = await Promise.all([
        parseExcel(equivFile),
        parseExcel(precioFile),
      ]);

      const merged = [];
      const skipped = [];
      const today = new Date();

      // Skip headers
      const equivData = equivRows.slice(1);
      const precioData = precioRows.slice(1);

      // Build a map of productId -> precios row
      const precioMap = new Map();
      precioData.forEach((row) => {
        const productId = String(row[0] || "").trim();
        precioMap.set(productId, row);
      });

      // Process Equivalencias
      equivData.forEach((row) => {
        const barcode = String(row[0] || "").trim();
        const productId = String(row[1] || "").trim();
        const description = String(row[2] || "").trim();

        if (!productId || !barcode) {
          skipped.push({ row, reason: "Faltan Codigo o Articulo" });
          return;
        }

        const precioRow = precioMap.get(productId);
        if (!precioRow) {
          skipped.push({ row, reason: "No se encontró en Precios" });
          return;
        }

        // Vigencia parsing
        const vigenciaRaw = String(precioRow[4] || "").trim();
        const [day, month, year] = vigenciaRaw.split("/").map(Number);
        if (!day || !month || !year) {
          skipped.push({ row, reason: "Vigencia invalida" });
          return;
        }

        const vigenciaDate = new Date(year + 2000, month - 1, day); // assuming YY -> 20YY
        const lastYear = new Date();
        lastYear.setFullYear(today.getFullYear() - 1);

        if (vigenciaDate < lastYear) {
          skipped.push({ row, reason: "Vigencia fuera de rango" });
          return;
        }

        // Price normalization
        const priceRaw = String(precioRow[5] || "").replace(",", "").trim();
        const price = parseFloat(priceRaw);
        if (isNaN(price)) {
          skipped.push({ row, reason: "Precio invalido" });
          return;
        }

        // Barcodes can be comma-separated
        const barcodes = barcode.split(",").map((b) => b.trim()).filter(Boolean);

        merged.push({
          productId,
          description: precioRow[1] || description,
          price,
          vigencia: vigenciaDate,
          barcodes,
        });
      });

      setLog([
        `Total filas procesadas: ${equivData.length}`,
        `Filas importables: ${merged.length}`,
        `Filas ignoradas: ${skipped.length}`,
      ]);

      onPreview(merged, skipped);
    } catch (err) {
      console.error(err);
      alert("Error al procesar los archivos");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="w-11/12 max-w-lg bg-gray-900 p-6 rounded-xl shadow-lg text-gold space-y-4">
        <h2 className="text-xl font-bold mb-4">Importar y Previsualizar</h2>
        <div className="space-y-2">
          <label className="block">
            Equivalencias (SKU -> Product ID)
            <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, "equiv")} className="mt-1 w-full" />
          </label>
          <label className="block">
            Precios
            <input type="file" accept=".xls,.xlsx" onChange={(e) => handleFileChange(e, "precio")} className="mt-1 w-full" />
          </label>
        </div>
        <div className="flex space-x-2">
          <button onClick={mergeFiles} className="flex-1 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition">
            Procesar y Previsualizar
          </button>
          <button onClick={onClose} className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition">
            Cancelar
          </button>
        </div>
        {log.length > 0 && (
          <div className="mt-4 bg-gray-800 p-2 rounded text-sm">
            {log.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
