import { useState } from "react";
import { db } from "../firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx";

export default function ExcelImporter({ onClose, user, initialWrites = 0, onWritesUpdate }) {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [writeCounter, setWriteCounter] = useState(initialWrites);
  const [log, setLog] = useState([]);

  const normalize = (val) => (val !== undefined && val !== null ? val.toString().trim() : "");

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
  };

  const parseDate = (dateStr) => {
    const s = normalize(dateStr).replace(/\s/g, "");
    if (!s) return null;
    const parts = s.includes("/") ? s.split("/") : s.includes("-") ? s.split("-") : null;
    if (!parts || parts.length < 3) return null;
    let [day, month, year] = parts;
    if (year.length === 2) year = "20" + year;
    const d = new Date(`${year}-${month}-${day}`);
    return isNaN(d.getTime()) ? null : d;
  };

  const handlePreview = async () => {
    if (!file1 || !file2) {
      alert("Ambos archivos son requeridos");
      return;
    }

    setLoading(true);
    const newLog = [];

    try {
      const rows1 = await parseExcel(file1);
      const rows2 = await parseExcel(file2);

      // Skip completely empty rows
      const cleanRows = (rows) => rows.filter((r) => r.some((c) => c !== undefined && c !== null && c.toString().trim() !== ""));

      const [equivRows, preciosRows] = (() => {
        // Identify Equivalencias: 3 columns, first column mostly numeric (barcode)
        if (rows1[0].length <= 3) return [cleanRows(rows1), cleanRows(rows2)];
        return [cleanRows(rows2), cleanRows(rows1)];
      })();

      const equivData = equivRows.map((r, idx) => ({
        Codigo: normalize(r[0]),
        Articulo: normalize(r[1]),
        Descripcion: normalize(r[2]),
        rowIndex: idx + 1,
      })).filter(r => r.Codigo && r.Articulo);

      const preciosData = preciosRows.map((r, idx) => ({
        Codigo: normalize(r[0]),
        Descripcion: normalize(r[1]),
        Lista: normalize(r[2]),
        NombreListaAnterior: normalize(r[3]),
        VigenciaRaw: normalize(r[4]),
        Precio: normalize(r[5]),
        rowIndex: idx + 1,
      })).filter(r => r.Codigo);

      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      const merged = preciosData.map((p) => {
        const vigDate = parseDate(p.VigenciaRaw);
        if (!vigDate) {
          newLog.push(`Fila ignorada: Vigencia inválida para Codigo "${p.Codigo}" (fila ${p.rowIndex})`);
          return null;
        }
        if (vigDate < oneYearAgo) {
          newLog.push(`Fila ignorada: Vigencia menor a un año para Codigo "${p.Codigo}" (fila ${p.rowIndex})`);
          return null;
        }
        const match = equivData.find((e) => e.Codigo === p.Codigo);
        if (!match) {
          newLog.push(`Fila ignorada: No se encontró correspondencia en Equivalencias para Codigo "${p.Codigo}" (fila ${p.rowIndex})`);
          return null;
        }
        return {
          id: match.Codigo,
          Articulo: match.Articulo,
          Descripcion: p.Descripcion,
          Lista: p.Lista,
          NombreListaAnterior: p.NombreListaAnterior,
          Vigencia: vigDate.toISOString(),
          Precio: p.Precio,
        };
      }).filter(Boolean);

      let newCount = 0;
      let updateCount = 0;

      for (const item of merged) {
        const snap = await getDoc(doc(db, "products", item.id));
        if (!snap.exists()) newCount++;
        else updateCount++;
      }

      setPreview({ merged, newCount, updateCount, total: merged.length });
      setLog(newLog);
    } catch (err) {
      console.error(err);
      alert("Error al procesar los archivos. Revisa el formato y columnas.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    if (!window.confirm(`Se importarán ${preview.total} productos:\n${preview.newCount} nuevos, ${preview.updateCount} actualizaciones. Continuar?`)) return;

    setLoading(true);
    try {
      for (const item of preview.merged) {
        await setDoc(doc(db, "products", item.id), {
          ...item,
          importedBy: user?.email || "unknown",
          importedAt: new Date().toISOString(),
        });
      }

      const writesDone = preview.merged.length;
      setWriteCounter((prev) => prev + writesDone);
      if (onWritesUpdate) onWritesUpdate(writesDone);

      alert(`✅ Importación completa: ${preview.total} productos\nWrites totales: ${writeCounter + writesDone}`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Error durante la importación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 overflow-auto">
      <div className="w-11/12 max-w-md bg-gray-900 p-6 rounded-xl shadow-lg text-gold">
        <h2 className="text-xl font-bold mb-4">Importar Excel (Columnas)</h2>
        <p className="mb-2">Firestore writes acumulados: {writeCounter}</p>

        <input type="file" accept=".xls,.xlsx" onChange={(e) => setFile1(e.target.files[0])} className="w-full mb-2" />
        <input type="file" accept=".xls,.xlsx" onChange={(e) => setFile2(e.target.files[0])} className="w-full mb-4" />

        <div className="flex space-x-2 mb-4">
          <button onClick={handlePreview} className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition" disabled={loading}>
            Vista previa
          </button>
          <button onClick={handleImport} className="flex-1 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50" disabled={loading || !preview}>
            {loading ? "Importando..." : "Importar"}
          </button>
        </div>

        {preview && (
          <div className="bg-gray-800 p-3 rounded-lg mb-4 max-h-40 overflow-auto">
            <p>Total productos: {preview.total}</p>
            <p>Nuevos: {preview.newCount}</p>
            <p>Actualizaciones: {preview.updateCount}</p>
            <p>Writes estimados: {preview.total}</p>
          </div>
        )}

        {log.length > 0 && (
          <div className="bg-gray-700 p-3 rounded-lg mb-4 max-h-40 overflow-auto text-sm text-yellow-300">
            <h3 className="font-bold mb-1">Log de validación:</h3>
            <ul className="list-disc list-inside">
              {log.map((line, idx) => <li key={idx}>{line}</li>)}
            </ul>
          </div>
        )}

        <button onClick={onClose} className="w-full py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition" disabled={loading}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
