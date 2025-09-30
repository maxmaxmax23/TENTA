// File: src/components/ExcelImporter.jsx
import { useState } from "react";
import { db } from "../firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx";

export default function ExcelImporter({ onClose, user }) {
  const [equivFile, setEquivFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  };

  const handlePreview = async () => {
    if (!equivFile || !preciosFile) {
      alert("Ambos archivos son requeridos");
      return;
    }

    const equivData = await parseExcel(equivFile);
    const preciosData = await parseExcel(preciosFile);

    // Filter Precios by vigencia (last year)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const merged = preciosData
      .filter((p) => {
        const vigenciaParts = p.Vigencia.split("-");
        const vigenciaDate = new Date(`${vigenciaParts[2]}-${vigenciaParts[1]}-${vigenciaParts[0]}`);
        return vigenciaDate >= oneYearAgo;
      })
      .map((p) => {
        const match = equivData.find((e) => e.Articulo === p.Articulos);
        return match
          ? { id: match.Codigo, ...p, Articulo: match.Articulo }
          : null;
      })
      .filter(Boolean);

    // Count new vs update
    let newCount = 0;
    let updateCount = 0;

    for (const item of merged) {
      const docRef = doc(db, "products", item.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) newCount++;
      else updateCount++;
    }

    setPreview({ merged, newCount, updateCount, total: merged.length });
  };

  const handleImport = async () => {
    if (!preview) return;

    if (!window.confirm(`Se importarán ${preview.total} productos:\n${preview.newCount} nuevos, ${preview.updateCount} actualizaciones. Continuar?`)) return;

    setLoading(true);
    try {
      for (const item of preview.merged) {
        await setDoc(doc(db, "products", item.id), item);
      }
      alert(`✅ Importación completa: ${preview.total} productos`);
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
          <div className="bg-gray-800 p-3 rounded-lg mb-4">
            <p>Total productos: {preview.total}</p>
            <p>Nuevos: {preview.newCount}</p>
            <p>Actualizaciones: {preview.updateCount}</p>
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
