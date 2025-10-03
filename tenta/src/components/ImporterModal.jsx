import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function ImporterModal({ onClose }) {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [writesCounter, setWritesCounter] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const normalizeDate = (str) => {
    // Expecting DD/MM/YY or DD/MM/YYYY
    const parts = str.split("/");
    if (parts.length < 3) return null;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    return new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        resolve(json);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const processFiles = async () => {
    if (!equivalenciasFile || !preciosFile) {
      setError("Seleccione ambos archivos: Equivalencias y Precios.");
      return;
    }

    setError(null);
    setProcessing(true);
    setPreview([]);
    setWritesCounter(0);

    try {
      const [equivalenciasData, preciosData] = await Promise.all([
        readExcelFile(equivalenciasFile),
        readExcelFile(preciosFile),
      ]);

      const eqRows = equivalenciasData.slice(1).filter((r) => r.length >= 2);
      const prRows = preciosData.slice(1).filter((r) => r.length >= 5);

      const barcodeToId = {};
      eqRows.forEach((r) => {
        const barcode = r[0]?.toString().trim();
        const productId = r[1]?.toString().trim();
        if (barcode && productId) barcodeToId[barcode] = productId;
      });

      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      const previewData = [];
      for (let i = 0; i < prRows.length; i++) {
        const row = prRows[i];
        try {
          const productId = row[0]?.toString().trim();
          const desc = row[1]?.toString().trim();
          const vigenciaStr = row[4]?.toString().trim();
          const priceStr = row[5]?.toString().replace(/\./g, "").replace(",", ".").trim();

          let status = "To Write";
          if (!productId || !vigenciaStr) status = "Skipped";
          else {
            const vigenciaDate = normalizeDate(vigenciaStr);
            if (!vigenciaDate || vigenciaDate < oneYearAgo) status = "Out of Vigencia";
          }

          const price = parseFloat(priceStr);
          if (isNaN(price)) status = "Skipped";

          const barcodes = Object.entries(barcodeToId)
            .filter(([, id]) => id === productId)
            .map(([barcode]) => barcode);

          previewData.push({ productId, desc, price, barcodes, status });
        } catch (err) {
          console.warn(`Fila ${i + 2} ignorada:`, err);
          previewData.push({ productId: row[0], desc: row[1], price: row[5], barcodes: [], status: "Skipped" });
        }
      }

      setPreview(previewData);
      setWritesCounter(previewData.filter((p) => p.status === "To Write").length);
    } catch (err) {
      console.error(err);
      setError("Error al procesar los archivos.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal">
      <h2>Importar Productos</h2>

      {error && <div className="error">{error}</div>}

      <div>
        <label>Equivalencias:</label>
        <input type="file" accept=".xls,.xlsx" onChange={(e) => setEquivalenciasFile(e.target.files[0])} />
      </div>

      <div>
        <label>Precios:</label>
        <input type="file" accept=".xls,.xlsx" onChange={(e) => setPreciosFile(e.target.files[0])} />
      </div>

      <button onClick={processFiles} disabled={processing}>
        {processing ? "Procesando..." : "Procesar y Previsualizar"}
      </button>

      <div>
        <h3>Resumen:</h3>
        <p>Total filas: {preview.length}</p>
        <p>Productos a escribir: {writesCounter}</p>
        <p>Productos omitidos: {preview.filter((p) => p.status === "Skipped").length}</p>
        <p>Fuera de vigencia: {preview.filter((p) => p.status === "Out of Vigencia").length}</p>
      </div>

      <div className="preview-table">
        <table>
          <thead>
            <tr>
              <th>Producto ID</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Barcodes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((p, idx) => (
              <tr key={idx}>
                <td>{p.productId}</td>
                <td>{p.desc}</td>
                <td>{p.price}</td>
                <td>{p.barcodes.join(", ")}</td>
                <td>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={onClose}>Cerrar</button>
    </div>
  );
}
