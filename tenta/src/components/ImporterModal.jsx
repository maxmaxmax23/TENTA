// File: src/components/ImporterModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";

/**
 * Alpha preview-only importer:
 * - auto-detects Equivalencias vs Precios
 * - merges by column indexes
 * - robust per-row logging
 * - supports DD/MM/YY, DD/MM/YYYY, ISO dates
 * - produces merged JSON which can be downloaded
 *
 * Put this file in src/components/ImporterModal.jsx and open it from dashboard.
 */

export default function ImporterModal({ onClose }) {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [toWrite, setToWrite] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [log, setLog] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [detectedMapping, setDetectedMapping] = useState(null);

  const appendLog = (line) => setLog((prev) => [...prev, line]);

  const parseExcelToRows = async (file) => {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    // header:1 returns array-of-arrays rows
    return XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
  };

  // parse price numbers robustly: "1.234,56" or "1234.56" or "$ 1.234"
  const parsePrice = (str) => {
    if (str == null) return NaN;
    const s = String(str).trim();
    if (s === "") return NaN;
    // Remove currency symbols and spaces
    const cleaned = s.replace(/[^\d.,-]/g, "");
    // If both '.' and ',' present, assume '.' thousand and ',' decimal -> remove dots, replace comma
    if (cleaned.indexOf(".") !== -1 && cleaned.indexOf(",") !== -1) {
      return parseFloat(cleaned.replace(/\./g, "").replace(/,/g, "."));
    }
    // If only comma present, treat comma as decimal
    if (cleaned.indexOf(",") !== -1 && cleaned.indexOf(".") === -1) {
      return parseFloat(cleaned.replace(/,/g, "."));
    }
    // else parse normally (dots as decimals)
    return parseFloat(cleaned);
  };

  const parseDateFlexible = (s) => {
    if (!s && s !== 0) return null;
    const str = String(s).trim();
    if (!str) return null;

    // try DD/MM/YYYY or DD/MM/YY (slash or -)
    const m1 = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m1) {
      let day = parseInt(m1[1], 10);
      let month = parseInt(m1[2], 10) - 1;
      let year = parseInt(m1[3], 10);
      if (year < 100) year = 2000 + year;
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    // try ISO-like YYYY-MM-DD
    const m2 = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (m2) {
      const d = new Date(parseInt(m2[1], 10), parseInt(m2[2], 10) - 1, parseInt(m2[3], 10));
      if (!isNaN(d.getTime())) return d;
    }

    // fallback: Date constructor
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;

    return null;
  };

  // Heuristics to detect which file is Equivalencias and which is Precios.
  // - Equivalencias: col0 barcode, col1 productId (barcode often numeric long).
  // - Precios: col0 productId, col5 price (numeric)
  const detectFiles = (rowsA, rowsB) => {
    const score = (rows) => {
      let priceCount = 0;
      let barcodeCount = 0;
      for (let i = 1; i < Math.min(rows.length, 30); i++) {
        const r = rows[i] || [];
        if (r && r[5] !== undefined && !isNaN(parsePrice(r[5]))) priceCount++;
        if (r && r[0] !== undefined) {
          const c0 = String(r[0]).replace(/\s/g, "");
          if (/^\d{6,}$/.test(c0)) barcodeCount++;
        }
      }
      return { priceCount, barcodeCount };
    };

    const a = score(rowsA);
    const b = score(rowsB);

    // If A has more price-like rows, A is Precios
    if (a.priceCount > b.priceCount) return { precios: rowsA, equivalencias: rowsB, swapped: false };
    if (b.priceCount > a.priceCount) return { precios: rowsB, equivalencias: rowsA, swapped: true };

    // fallback: if one has more barcode-like col0, that is Equivalencias
    if (a.barcodeCount > b.barcodeCount) return { equivalencias: rowsA, precios: rowsB, swapped: false };
    if (b.barcodeCount > a.barcodeCount) return { equivalencias: rowsB, precios: rowsA, swapped: true };

    // Last fallback: assume user selected proper A=Equivalencias, B=Precios
    return { equivalencias: rowsA, precios: rowsB, swapped: null };
  };

  const handleProcess = async () => {
    setProcessing(true);
    setToWrite([]);
    setSkipped([]);
    setLog([]);
    setDetectedMapping(null);

    try {
      if (!fileA || !fileB) {
        appendLog("ERROR: ambos archivos son requeridos.");
        setProcessing(false);
        return;
      }

      const [rowsA, rowsB] = await Promise.all([parseExcelToRows(fileA), parseExcelToRows(fileB)]);
      appendLog(`Archivo A filas: ${rowsA.length}, Archivo B filas: ${rowsB.length}`);

      const { equivalencias, precios, swapped } = detectFiles(rowsA, rowsB);
      setDetectedMapping(swapped === null ? "unknown (assume A=Equivalencias, B=Precios)" : swapped ? "A=Precios,B=Equivalencias (swapped)" : "A=Equivalencias,B=Precios (ok)");
      appendLog(`Detección: ${detectedMapping || (swapped === null ? 'fallback' : (swapped ? 'swapped' : 'normal'))}`);

      // Build map productId -> [barcodes]
      const productToBarcodes = {};
      for (let i = 1; i < equivalencias.length; i++) {
        const row = equivalencias[i] || [];
        // column 0 = barcode, 1 = productId, 2 = desc
        const barcode = row[0] !== undefined ? String(row[0]).trim() : "";
        const productId = row[1] !== undefined ? String(row[1]).trim() : "";
        if (!productId && !barcode) {
          appendLog(`Equivalencias - fila ${i + 1}: vacío, ignorado`);
          continue;
        }
        if (!productId) {
          appendLog(`Equivalencias - fila ${i + 1}: productId vacío (barcode=${barcode}), ignorado`);
          continue;
        }
        if (!productToBarcodes[productId]) productToBarcodes[productId] = [];
        if (barcode && !productToBarcodes[productId].includes(barcode)) productToBarcodes[productId].push(barcode);
      }

      // Merge precios -> for each precios row find productId and barcodes
      const merged = [];
      const skippedRows = [];
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      for (let i = 1; i < precios.length; i++) {
        const row = precios[i] || [];
        const rowIndex = i + 1;
        const productId = row[0] !== undefined ? String(row[0]).trim() : "";
        const description = row[1] !== undefined ? String(row[1]).trim() : "";
        const vigRaw = row[4] !== undefined ? String(row[4]).trim() : "";
        const priceRaw = row[5] !== undefined ? String(row[5]).trim() : "";

        if (!productId) {
          skippedRows.push({ row: rowIndex, productId: null, reason: "productId vacío" });
          appendLog(`Precios - fila ${rowIndex}: productId vacío -> ignorado`);
          continue;
        }

        // parse vigencia
        const vigDate = parseDateFlexible(vigRaw);
        if (!vigDate) {
          skippedRows.push({ row: rowIndex, productId, reason: `Vigencia inválida (${vigRaw})` });
          appendLog(`Precios - fila ${rowIndex} (ID ${productId}): vigencia inválida "${vigRaw}"`);
          continue;
        }
        if (vigDate < oneYearAgo) {
          skippedRows.push({ row: rowIndex, productId, reason: `Vigencia fuera de rango (${vigRaw})` });
          appendLog(`Precios - fila ${rowIndex} (ID ${productId}): vigencia fuera de rango "${vigRaw}"`);
          continue;
        }

        const price = parsePrice(priceRaw);
        if (isNaN(price)) {
          skippedRows.push({ row: rowIndex, productId, reason: `Precio inválido (${priceRaw})` });
          appendLog(`Precios - fila ${rowIndex} (ID ${productId}): precio inválido "${priceRaw}"`);
          continue;
        }

        const barcodes = productToBarcodes[productId] || [];
        if (barcodes.length === 0) {
          skippedRows.push({ row: rowIndex, productId, reason: "Sin equivalencia (barcode no encontrado)" });
          appendLog(`Precios - fila ${rowIndex} (ID ${productId}): sin barcode asociado`);
          continue;
        }

        // choose first barcode (but keep full list)
        merged.push({
          productId,
          barcodes,
          barcode: barcodes[0],
          description: description || null,
          vigencia: vigRaw,
          price,
          sourceRow: rowIndex,
        });

        appendLog(`Precios - fila ${rowIndex} (ID ${productId}): OK -> ${barcodes.length} barcode(s)`);
      }

      setToWrite(merged);
      setSkipped(skippedRows);
      appendLog(`Merge completado: a escribir ${merged.length}, ignorados ${skippedRows.length}`);
    } catch (err) {
      console.error("Error processing files:", err);
      appendLog(`ERROR al procesar archivos: ${err.message || err}`);
    } finally {
      setProcessing(false);
    }
  };

  const downloadMergedJson = () => {
    if (!toWrite.length) {
      alert("No hay datos a descargar");
      return;
    }
    const blob = new Blob([JSON.stringify(toWrite, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merged_products_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center p-4 overflow-auto z-50">
      <div className="w-full max-w-4xl bg-gray-900 text-gold rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-bold">Importador (preview alfa)</h2>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm mb-1">Archivo A (cualquiera)</label>
            <input type="file" accept=".xls,.xlsx" onChange={(e) => setFileA(e.target.files[0])} />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Archivo B (cualquiera)</label>
            <input type="file" accept=".xls,.xlsx" onChange={(e) => setFileB(e.target.files[0])} />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleProcess}
            className="px-4 py-2 bg-gold text-black rounded disabled:opacity-50"
            disabled={processing || !fileA || !fileB}
          >
            {processing ? "Procesando..." : "Procesar y Previsualizar"}
          </button>

          <button
            onClick={downloadMergedJson}
            className="px-4 py-2 bg-green-600 text-black rounded disabled:opacity-50"
            disabled={!toWrite.length}
          >
            Descargar JSON (merged)
          </button>

          <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-gold rounded">
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 p-2 rounded max-h-64 overflow-auto">
            <h3 className="font-semibold mb-2">A escribir ({toWrite.length})</h3>
            <ul className="text-sm space-y-1">
              {toWrite.slice(0, 50).map((p) => (
                <li key={p.productId} className="border-b border-gray-700 pb-1">
                  <strong>{p.productId}</strong> — {p.description || "-"} — ${p.price} — barcode: {p.barcode} ({p.barcodes.length})
                </li>
              ))}
              {toWrite.length > 50 && <li className="text-xs text-gray-400">... {toWrite.length - 50} más</li>}
            </ul>
          </div>

          <div className="bg-gray-800 p-2 rounded max-h-64 overflow-auto">
            <h3 className="font-semibold mb-2">Ignorados / Errores ({skipped.length})</h3>
            <ul className="text-sm text-red-400 space-y-1">
              {skipped.slice(0, 200).map((s, idx) => (
                <li key={idx}>
                  {s.productId || "N/A"} — {s.reason} {s.row ? `(fila ${s.row})` : ""}
                </li>
              ))}
              {skipped.length > 200 && <li className="text-xs text-gray-400">... {skipped.length - 200} más</li>}
            </ul>
          </div>
        </div>

        <div className="bg-gray-800 p-2 rounded max-h-48 overflow-auto">
          <h3 className="font-semibold mb-2">Log</h3>
          <ul className="text-xs space-y-1">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
