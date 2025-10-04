import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function MergerModal({ onClose }) {
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
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      prData.forEach((row) => {
        const productId = row[0]?.toString().trim();
        const description = row[1]?.toString().trim();
        const vigenciaRaw = row[4];
        const priceRaw = row[5];

        let status = "Merged";

        // First filter: Vigencia
        let vigencia;
        try {
          if (!vigenciaRaw) throw new Error("Vigencia vacía");

          if (typeof vigenciaRaw === "number") {
            const date = XLSX.SSF.parse_date_code(vigenciaRaw);
            vigencia = new Date(date.y, date.m - 1, date.d);
          } else {
            const parts = vigenciaRaw.split(/[\/\-]/);
            if (parts.length === 3) {
              const [d, m, y] = parts.map((p) => parseInt(p, 10));
              vigencia = new Date(2000 + (y % 100), m - 1, d);
            } else throw new Error("Formato de fecha inválido");
          }

          if (vigencia < oneYearAgo || vigencia > now) {
            status = "Out of timeframe";
            outOfTime++;
            merged.push({ productId, description, barcodes: [], price: 0, vigencia: vigenciaRaw, status });
            return;
          }
        } catch {
          status = "Skipped";
          skipped++;
          merged.push({ productId, description, barcodes: [], price: 0, vigencia: vigenciaRaw, status });
          return;
        }

        // Normalize price
        let price = parseFloat(priceRaw.toString().replace(/\./g, "").replace(",", "."));
        if (isNaN(price)) {
          status = "Skipped";
          skipped++;
          merged.push({ productId, description, barcodes: [], price: 0, vigencia: vigenciaRaw, status });
          return;
        }

        const eqMatch = eqMap.get(productId);
        const barcodes = eqMatch ? Array.from(eqMatch.barcodes) : ["Sin código"];
        const finalDescription = description || eqMatch?.description || "Sin descripción";

        merged.push({
          productId,
          description: finalDescription,
          barcodes,
          price,
          vigencia: vigencia.toLocaleDateString("es-AR"),
          status,
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

  const handleQueue = () => {
    if (mergedData.length === 0) {
      alert("No hay datos para agregar a la cola.");
      return;
    }
    setMergedDataQueue((prevQueue) => [...prevQueue, ...mergedData]);
    alert(`${mergedData.length} productos agregados a la cola.`);
    // Optional: clear merged data after queuing
    setMergedData([]);
    setStats({ written: 0, skipped: 0, outOfTime: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-gold rounded-2xl p-4 w-full max-w-md max-h-[90vh] flex flex-col">
        {/* ...existing UI: file inputs, merge button, stats, table... */}

        <button
          onClick={handleQueue}
          disabled={mergedData.length === 0}
          className="bg-green-600 text-black py-2 rounded mb-4 font-semibold hover:opacity-80 transition"
        >
          Agregar a la cola
        </button>

        <button
          onClick={onClose}
          className="mt-2 bg-gray-700 text-gold py-2 rounded hover:bg-gray-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}