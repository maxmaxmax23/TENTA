// File: src/components/ExcelImporter.jsx
import { useState } from "react";
import { db } from "../firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx";

export default function ExcelImporter({ onClose, user, initialWrites = 0, onWritesUpdate }) {
  const [equivFile, setEquivFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [writeCounter, setWriteCounter] = useState(initialWrites);
  const [log, setLog] = useState([]);

  // Parse Excel to array of arrays
  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
    return rawRows;
  };

  const handlePreview = async () => {
    if (!equivFile || !preciosFile) {
      alert("Ambos archivos son requeridos");
      return;
    }

    setLoading(true);
    const newLog = [];

    try {
      const equivRows = await parseExcel(equivFile);
      const preciosRows = await parseExcel(preciosFile);

      // Map rows to objects
      const equivData = equivRows.map((row, idx) => {
        if (row.length < 2) {
          newLog.push(`Equivalencias fila ${idx + 1} ignorada: menos de 2 columnas`);
        }
        return {
          Articulo: row[0]?.toString().trim() || "",
          Codigo: row[1]?.toString().trim() || "",
          Descripcion: row[2]?.toString().trim() || "",
        };
      }).filter((r) => r.Articulo && r.Codigo);

      const preciosData = preciosRows.map((row, idx) => ({
        Codigo: row[0]?.toString().trim() || "",
        Descripcion: row[1]?.toString().trim() || "",
        Lista: row[2]?.toString().trim() || "",
        NombreListaAnterior: row[3]?.toString().trim() || "",
        Vigencia: row[4]?.toString().trim() || "",
        Precio: row[5]?.toString().trim() || "",
      })).filter((r) => r.Codigo);

      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      const merged = preciosData
        .filter((p) => {
          if (!p.Vigencia) {
            newLog.push(`Fila ignorada: Vigencia vacía para Codigo "${p.Codigo}"`);
            return false;
          }
          const parts = p.Vigencia.split("/");
          if (parts.length !== 3) {
            newLog.push(`Fila ignorada: Fecha inválida "${p.Vigencia}"`);
            return false;
          }
          const [day, month, year] = parts;
          const fullYear = year.length === 2 ? "20" + year : year;
          const vigDate = new Date(`${fullYear}-${month}-${day}`);
          if (isNaN(vigDate.getTime())) {
            newLog.push(`Fila ignorada: Fecha no válida "${p.Vigencia}"`);
            return false;
          }
          if (vigDate < oneYearAgo) {
            newLog.push(`Fila filtrada: Vigencia menor a un año "${p.Vigencia}"`);
            return false;
          }
          return true;
        })
        .map((p) => {
          const match = equivData.find((e) => e.Codigo === p.Codigo);
          if (!match) {
            newLog.push(`No se encontró correspondencia para Codigo "${p.Codigo}"`);
            return null;
          }
          return { id: match.Codigo, Articulo: match.Articulo, ...p };
        })
        .filter(Boolean);

      let newCount = 0;
      let updateCount = 0;

      for (const item of merged) {
        const docRef = doc(db, "products", item.id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) newCount++;
        else updateCount++;
      }

      setPreview({ merged, newCount, updateCount, total: merged.length });
      setLog(newLog);
    } catch (err) {
      console.error("Error parsing Excel files:", err);
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

        <input type="file" accept=".xls,.xlsx" onChange={(e) => setEquivFile(e.target.files[0])} className="w-full mb-2" />
        <input type="file" accept=".xls,.xlsx" onChange={(e) => setPreciosFile(e.target.files[0])} className="w-full mb-4" />

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
              {log.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
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
