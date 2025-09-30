// File: src/components/Dashboard.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export default function Dashboard({ onOpenScanner }) {
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [equivalenciasFile, setEquivalenciasFile] = useState(null);
  const [preciosFile, setPreciosFile] = useState(null);

  // Parse an Excel file into JSON rows
  const parseExcelFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsBinaryString(file);
    });

  // Save backup JSON file locally
  const saveBackup = (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `backup-products-${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import merged Excel data into Firestore
  const importExcelToFirestore = async () => {
    if (!equivalenciasFile || !preciosFile) {
      alert("Por favor selecciona ambos archivos: Equivalencias y Precios.");
      return;
    }

    setLoading(true);
    try {
      // Parse both Excel files
      const equivalencias = await parseExcelFile(equivalenciasFile);
      const precios = await parseExcelFile(preciosFile);

      // Build map of productId -> details from precios
      const preciosMap = new Map();
      for (const p of precios) {
        if (p.productId) {
          preciosMap.set(p.productId.toString(), p);
        }
      }

      // Merge equivalencias with precios
      const merged = [];
      for (const eq of equivalencias) {
        const productId = eq.productId?.toString();
        const barcode = eq.barcode?.toString();
        if (!productId || !barcode) continue;

        const details = preciosMap.get(productId) || {};
        merged.push({
          id: productId,
          barcode,
          ...details,
          updatedAt: new Date().toISOString(),
        });
      }

      // 🔹 Save backup JSON before upload
      saveBackup(merged);

      // Upload to Firestore
      const productsRef = collection(db, "products");
      for (const product of merged) {
        await setDoc(doc(productsRef, product.id), product);
      }

      alert(`✅ Importación completada: ${merged.length} productos cargados.`);
    } catch (err) {
      console.error("Error al importar Excel:", err);
      alert("❌ Error al importar Excel, revisa la consola.");
    } finally {
      setLoading(false);
      setImporting(false);
      setEquivalenciasFile(null);
      setPreciosFile(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6 text-gold">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-4">
        {/* Scan button */}
        <button
          onClick={onOpenScanner}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Escanear
        </button>

        {/* Import button */}
        <button
          onClick={() => setImporting(true)}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Importar
        </button>

        {/* Export placeholder */}
        <button
          onClick={() => alert("Exportar JSON/Excel aún no implementado.")}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Exportar
        </button>

        {/* Future inventory button */}
        <button
          onClick={() => alert("Inventario próximamente.")}
          className="px-4 py-3 bg-gold text-black rounded-2xl font-semibold hover:bg-yellow-500 transition shadow-lg"
        >
          Inventario
        </button>
      </div>

      {/* Importer Modal */}
      {importing && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-96 text-black shadow-xl">
            <h2 className="text-lg font-bold mb-4">Importar Excel</h2>

            {loading ? (
              <p className="text-center text-gray-700">Cargando...</p>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block font-medium mb-1">
                    Archivo Equivalencias (SKU ↔ ID):
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setEquivalenciasFile(e.target.files?.[0])}
                  />
                </div>

                <div className="mb-4">
                  <label className="block font-medium mb-1">
                    Archivo Precios (ID ↔ Detalles):
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
                  onClick={() => setImporting(false)}
                  className="mt-4 w-full px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
