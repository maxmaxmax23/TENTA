// File: src/components/ExcelImporter.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { db, auth } from "../firebase.js";
import { collection, setDoc, doc, getDoc } from "firebase/firestore";

export default function ExcelImporter({ onClose }) {
  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const parseExcelFile = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
  };

  const isWithinLastYear = (vigencia) => {
    if (!vigencia) return false;
    const [day, month, year] = vigencia.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const now = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(now.getFullYear() - 1);
    return date >= lastYear && date <= now;
  };

  const rotateBackups = async () => {
    const currentRef = doc(db, "backups", "currentImport");
    const previousRef = doc(db, "backups", "previousImport");

    const currentSnap = await getDoc(currentRef);
    if (currentSnap.exists()) {
      await setDoc(previousRef, currentSnap.data());
    }
  };

  const importExcelToFirestore = async () => {
    if (!equivalenciasFile || !preciosFile) {
      alert("Selecciona ambos archivos: Equivalencias y Precios.");
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const equivalencias = await parseExcelFile(equivalenciasFile);
      const precios = await parseExcelFile(preciosFile);

      // Map precios by productId
      const preciosMap = new Map();
      for (const p of precios) {
        if (p.Articulos) preciosMap.set(p.Articulos.toString(), p);
      }

      const merged = [];
      for (let i = 0; i < equivalencias.length; i++) {
        const eq = equivalencias[i];
        const productId = eq.Articulo?.toString();
        const barcode = eq.Codigo?.toString();
        if (!productId || !barcode) continue;

        const details = preciosMap.get(productId) || {};
        if (!isWithinLastYear(details.Vigencia)) continue;

        merged.push({
          id: productId,
          barcode,
          descripcion: details.Descripcion || "",
          precio: details.Precio || 0,
          vigencia: details.Vigencia || "",
          metadata: {
            importedBy: auth.currentUser?.email || "unknown",
            importedAt: new Date().toISOString(),
          },
        });

        setProgress(Math.floor(((i + 1) / equivalencias.length) * 100));
      }

      if (merged.length === 0) {
        alert("No se encontraron productos válidos dentro del rango de vigencia.");
        setLoading(false);
        return;
      }

      // Rotate backups
      await rotateBackups();

      // Save new import as currentImport
      const currentRef = doc(db, "backups", "currentImport");
      await setDoc(currentRef, { timestamp: new Date().toISOString(), user: auth.currentUser?.email, data: merged });

      // Save to Firestore products
      const productsRef = collection(db, "products");
      for (let i = 0; i < merged.length; i++) {
        await setDoc(doc(productsRef, merged[i].id), merged[i]);
        setProgress(Math.floor(((i + 1) / merged.length) * 100));
      }

      alert(`✅ Importación completada: ${merged.length} productos cargados.`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Error al importar Excel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl w-96 shadow-xl">
        <h2 className="text-lg font-bold mb-4">Importar Excel</h2>

        {loading && (
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className="bg-gold h-4 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {!loading && (
          <>
            <div className="mb-4">
              <label className="block font-medium mb-1">
                Archivo Equivalencias (Codigo ↔ Articulo):
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setEquivalenciasFile(e.target.files?.[0])}
              />
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-1">
                Archivo Precios (Articulo ↔ Detalles):
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setPreciosFile(e.target.files?.[0])}
              />
            </div>

            <button
              onClick={importExcelToFirestore}
              disabled={!equivalenciasFile || !preciosFile}
              className="w-full px-4 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 disabled:opacity-50"
            >
              Importar
            </button>

            <button
              onClick={onClose}
              className="mt-4 w-full px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
