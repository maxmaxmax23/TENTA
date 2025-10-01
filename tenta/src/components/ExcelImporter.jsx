import { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../firebase.js";
import { doc, setDoc } from "firebase/firestore";

export default function ExcelImporter({ user, initialWrites, onWritesUpdate, onClose }) {
  const [equivFile, setEquivFile] = useState(null);
  const [precioFile, setPrecioFile] = useState(null);
  const [log, setLog] = useState([]);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);

  const parseDate = (str) => {
    if (!str) return null;
    const parts = str.split("/"); // DD/MM/YYYY or DD/MM/YY
    if (parts.length < 3) return null;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000; // handle YY
    const d = new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    return isNaN(d) ? null : d;
  };

  const handleMerge = async () => {
    if (!equivFile || !precioFile) {
      alert("Selecciona ambos archivos");
      return;
    }

    setProcessing(true);
    setLog([]);
    setPreview(null);

    try {
      const readFile = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const data = XLSX.read(arrayBuffer, { type: "array" });
        const sheet = data.Sheets[data.SheetNames[0]];
        return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }); // raw arrays
      };

      const equivDataRaw = (await readFile(equivFile)).slice(1); // skip header
      const precioDataRaw = (await readFile(precioFile)).slice(1); // skip header

      const newLog = [];

      // Validate Equivalencias
      const equivData = equivDataRaw.map((row, idx) => {
        if (row.length < 3) {
          newLog.push(`Fila ignorada Equivalencias: columnas insuficientes (fila ${idx + 2})`);
          return null;
        }
        return {
          Codigo: row[0],
          Articulo: row[1],
          Descripcion: row[2],
        };
      }).filter(Boolean);

      // Validate Precios
      const precioData = precioDataRaw.map((row, idx) => {
        if (row.length < 6) {
          newLog.push(`Fila ignorada Precios: columnas insuficientes (fila ${idx + 2})`);
          return null;
        }
        return {
          ArticuloID: row[0],
          Descripcion: row[1],
          Lista: row[2],
          NombreListaAnterior: row[3],
          VigenciaRaw: row[4],
          Precio: row[5],
          rowIndex: idx + 2,
        };
      }).filter(Boolean);

      const merged = [];
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      for (let i = 0; i < precioData.length; i++) {
        const p = precioData[i];
        const vigDate = parseDate(p.VigenciaRaw);

        if (!vigDate) {
          newLog.push(`Fila ignorada: Vigencia inválida para ArticuloID "${p.ArticuloID}" (fila ${p.rowIndex})`);
          continue;
        }

        if (vigDate < oneYearAgo) {
          newLog.push(`Fila ignorada: Vigencia menor a un año para ArticuloID "${p.ArticuloID}" (fila ${p.rowIndex})`);
          continue;
        }

        const match = equivData.find((e) => e.Codigo === p.ArticuloID);
        if (!match) {
          newLog.push(`Fila ignorada: No se encontró correspondencia para ArticuloID "${p.ArticuloID}" (fila ${p.rowIndex})`);
          continue;
        }

        merged.push({
          id: match.Codigo,
          Articulo: match.Articulo,
          Descripcion: p.Descripcion,
          Lista: p.Lista,
          NombreListaAnterior: p.NombreListaAnterior,
          Vigencia: vigDate.toISOString(),
          Precio: p.Precio,
        });
      }

      setPreview({
        merged,
        totalPrecios: precioData.length,
        totalMerged: merged.length,
        skipped: newLog.length,
      });
      setLog(newLog);
    } catch (err) {
      console.error(err);
      alert("Error al procesar los archivos");
    } finally {
      setProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!preview || !preview.merged.length) return;

    setProcessing(true);
    let writesCount = 0;

    try {
      for (let i = 0; i < preview.merged.length; i++) {
        const item = preview.merged[i];
        await setDoc(doc(db, "products", item.id), {
          ...item,
          importedBy: user?.email || "unknown",
          importedAt: new Date().toISOString(),
        });
        writesCount++;
        if (i % 50 === 0) setLog((prev) => [...prev, `Importado: ${item.id} (${i + 1}/${preview.totalMerged})`]);
      }

      onWritesUpdate && onWritesUpdate(writesCount);
      alert(`Importación completa: ${writesCount} items escritos`);
      setPreview(null);
      setLog([]);
      setEquivFile(null);
      setPrecioFile(null);
    } catch (err) {
      console.error(err);
      alert("Error durante la importación a Firebase");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4 overflow-auto">
      <div className="w-11/12 max-w-lg bg-gray-900 p-6 rounded-xl shadow-lg text-gold">
        <h2 className="text-xl font-bold mb-4">Importar Excel</h2>

        <input type="file" accept=".xls,.xlsx" onChange={(e) => setEquivFile(e.target.files[0])} className="w-full mb-2" />
        <p className="mb-4 text-sm text-gray-300">Archivo Equivalencias: Código ↔ ProductoID</p>

        <input type="file" accept=".xls,.xlsx" onChange={(e) => setPrecioFile(e.target.files[0])} className="w-full mb-2" />
        <p className="mb-4 text-sm text-gray-300">Archivo Precios: ProductID + Datos</p>

        <div className="flex space-x-2 mb-4">
          <button onClick={handleMerge} disabled={processing} className="flex-1 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50">
            {processing ? "Procesando..." : "Previsualizar/Combinar"}
          </button>
          <button onClick={onClose} className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition">
            Cancelar
          </button>
        </div>

        {preview && (
          <>
            <p className="mb-2">
              Total Precios: {preview.totalPrecios} | Items listos para importar: {preview.totalMerged} | Ignorados: {preview.skipped}
            </p>
            <button onClick={handleImport} disabled={processing} className="w-full py-2 bg-green-600 text-black rounded-lg hover:bg-green-500 transition mb-4">
              {processing ? "Importando..." : "Importar a Firebase"}
            </button>
          </>
        )}

        {log.length > 0 && (
          <div className="bg-gray-700 p-3 rounded-lg max-h-40 overflow-auto text-sm text-yellow-300">
            <ul className="list-disc list-inside">
              {log.map((line, idx) => <li key={idx}>{line}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
