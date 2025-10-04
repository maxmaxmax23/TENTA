// File: src/components/MergerModal.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function MergerModal({ onClose, addToQueue }) {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [mergedData, setMergedData] = useState([]);
  const [stats, setStats] = useState({ written: 0, skipped: 0, outOfTime: 0 });
  const [loading, setLoading] = useState(false);

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  };

  const handleMerge = async () => {
    if (!equivalenciasFile || !preciosFile) {
      alert("Selecciona ambos archivos antes de continuar.");
      return;
    }

    try {
      setLoading(true);

      const [eqRows, prRows] = await Promise.all([
        parseExcel(equivalenciasFile),
        parseExcel(preciosFile),
      ]);

      const eqData = eqRows.slice(1);
      const prData = prRows.slice(1);

      const eqMap = new Map();
      eqData.forEach((row) => {
        const barcode = row[0]?.toString().trim();
        const productId = row[1]?.toString().trim();
        const description = row[2]?.toString().trim();
        if (barcode && productId) {
          if (!eqMap.has(productId)) {
            eqMap.set(productId, { barcodes: new Set(), description });
          }
          eqMap.get(productId).barcodes.add(barcode);
        }
      });

      let written = 0;
      let skipped = 0;
      let outOfTime = 0;
      const merged = [];

      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      prData.forEach((row) => {
        const productId = row[0]?.toString().trim();
        const description = row[1]?.toString().trim();
        const vigenciaRaw = row[4];
        const priceRaw = row[5];

        if (!productId || !vigenciaRaw || !priceRaw) {
          skipped++;
          return;
        }

        // Normalize date
        let vigencia;
        try {
          if (typeof vigenciaRaw === "number") {
            const date = XLSX.SSF.parse_date_code(vigenciaRaw);
            vigencia = new Date(date.y, date.m - 1, date.d);
          } else {
            const parts = vigenciaRaw.split(/[\/\-]/);
            if (parts.length === 3) {
              const [d, m, y] = parts.map((p) => parseInt(p, 10));
              vigencia = new Date(2000 + (y % 100), m - 1, d);
            }
          }
        } catch {
          skipped++;
          return;
        }

        // Filter by past 12 months
        if (vigencia < oneYearAgo || vigencia > now) {
          outOfTime++;
          return;
        }

        // Normalize price to integer
        let price = parseFloat(
          priceRaw.toString().replace(/\./g, "").replace(",", ".")
        );
        if (isNaN(price)) {
          skipped++;
          return;
        }

        price = Math.round(price);

        const eqMatch = eqMap.get(productId);
        const barcodes = eqMatch
          ? Array.from(eqMatch.barcodes)
          : ["Sin código"];

        merged.push({
          status: "merged",
          productId,
          description: description || eqMatch?.description || "Sin descripción",
          barcodes,
          price,
          vigencia: vigencia.toLocaleDateString("es-AR"),
        });
        written++;
      });

      setStats({ written, skipped, outOfTime });
      setMergedData(merged);
    } catch (error) {
      console.error("Error al procesar archivos:", error);
      alert("Error procesando los archivos. Ver consola.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = () => {
    addToQueue(mergedData);
    alert(`${mergedData.length} productos añadidos a la cola`);
  };

  const handleDownload = (format = "xlsx") => {
    if (!mergedData.length) return alert("No hay datos para descargar");

    if (format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(
        mergedData.map((item) => ({
          Status: item.status,
          ID: item.productId,
          Descripción: item.description,
          Códigos: item.barcodes.join(", "),
          Precio: item.price,
          Vigencia: item.vigencia,
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Merged");
      XLSX.writeFile(wb, "merged_products.xlsx");
    } else if (format === "json") {
      const blob = new Blob([JSON.stringify(mergedData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "merged_products.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-gold rounded-2xl p-4 w-full max-w-md max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold mb-3">Fusionar Archivos Excel</h2>

        <div className="flex flex-col gap-2 mb-4">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setEquivalenciasFile(e.target.files[0])}
            className="text-sm text-white"
          />
          <label className="text-xs text-gray-400">Archivo de Equivalencias</label>

          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setPreciosFile(e.target.files[0])}
            className="text-sm text-white"
          />
          <label className="text-xs text-gray-400">Archivo de Precios</label>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={handleMerge}
            disabled={loading}
            className="bg-gold text-black py-2 rounded font-semibold"
          >
            {loading ? "Procesando..." : "Fusionar y Previsualizar"}
          </button>

          <button
            onClick={handleAddToQueue}
            disabled={!mergedData.length}
            className="bg-green-600 text-black py-2 rounded font-semibold"
          >
            Añadir a la cola
          </button>

          <button
            onClick={() => handleDownload("xlsx")}
            disabled={!mergedData.length}
            className="bg-blue-600 text-black py-2 rounded font-semibold"
          >
            Descargar Excel
          </button>

          <button
            onClick={() => handleDownload("json")}
            disabled={!mergedData.length}
            className="bg-blue-400 text-black py-2 rounded font-semibold"
          >
            Descargar JSON
          </button>
        </div>

        <div className="text-sm mb-2">
          <p>✅ A escribir: {stats.written}</p>
          <p>⚠️ Ignorados: {stats.skipped}</p>
          <p>⏰ Fuera de vigencia: {stats.outOfTime}</p>
        </div>

        <div className="overflow-y-auto max-h-64 border border-gold rounded">
          <table className="w-full text-xs text-left">
            <thead className="bg-gold text-black sticky top-0">
              <tr>
                <th className="p-1">Status</th>
                <th className="p-1">ID</th>
                <th className="p-1">Descripción</th>
                <th className="p-1">Códigos</th>
                <th className="p-1">Precio</th>
                <th className="p-1">Vigencia</th>
              </tr>
            </thead>
            <tbody>
              {mergedData.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-800">
                  <td className="p-1">{item.status}</td>
                  <td className="p-1">{item.productId}</td>
                  <td className="p-1">{item.description}</td>
                  <td className="p-1">{item.barcodes.join(", ")}</td>
                  <td className="p-1">{item.price}</td>
                  <td className="p-1">{item.vigencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={onClose}
          className="mt-4 bg-gray-700 text-gold py-2 rounded hover:bg-gray-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
