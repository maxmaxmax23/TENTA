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

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const rawJson = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    return rawJson.map((row) => {
      const cleanRow = {};
      Object.keys(row).forEach((k) => {
        const key = k.trim();
        cleanRow[key] = typeof row[k] === "string" ? row[k].trim() : row[k];
      });
      return cleanRow;
    });
  };

  const handlePreview = async () => {
    if (!equivFile || !preciosFile) {
      alert("Ambos archivos son requeridos");
      return;
    }

    setLoading(true);
    const newLog = [];

    try {
      const equivData = await parseExcel(equivFile);
      const preciosData = await parseExcel(preciosFile);

      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      const merged = preciosData
        .filter((p) => {
          if (!p.Vigencia) {
            newLog.push(`Fila ignorada: Vigencia vacía para Articulo "${p.Articulos}"`);
            return false;
          }
          const parts = p.Vigencia.split("-");
          if (parts.length !== 3) {
            newLog.push(`Fila ignorada: Formato de fecha inválido "${p.Vigencia}"`);
            return false;
          }
          const [day, month, year] = parts;
          const vigenciaDate = new Date(`${year}-${month}-${day}`);
          if (isNaN(vigenciaDate.getTime())) {
            newLog.push(`Fila ignorada: Fecha no válida "${p.Vigencia}"`);
            return false;
          }
          if (vigenciaDate < oneYearAgo) {
            newLog.push(`Fila filtrada: Vigencia menor a un año "${p.Vigencia}"`);
            return false;
          }
          return true;
        })
        .map((p) => {
          const match = equivData.find((e) => e.Articulo === p.Articulos);
          if (!match) {
            newLog.push(`No se encontró correspondencia para Articulo "${p.Articulos}"`);
            return null;
          }
          return { id: match.Codigo, ...p, Articulo: match.Articulo };
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
      alert("Error al procesar los archivos. Revisa el formato y encabezados.");
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
        <h2 className="text-xl font-bold mb-4">Importar Excel</h2>

        <p className="mb-2">Firestore writes acumulados: {writeCounter}</p>

        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => setEquivFile(e.target.files[0])}
          className="w-full mb-2"
        />
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => setPreciosFile(e.target.files[0])}
          className="w-full mb-4"
        />

        <div className="flex space-x-2 mb-4">
          <button
            onClick={handlePreview}
            className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
            disabled={loading}
          >
            Vista previa
          </button>
          <button
            onClick={handleImport}
            className="flex-1 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
            disabled={loading || !preview}
          >
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

        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
