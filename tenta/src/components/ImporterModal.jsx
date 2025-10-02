// File: src/components/ImporterModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { db, storage } from "../firebase.js";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ImporterModal({ onClose, user }) {
  const [fileEqui, setFileEqui] = useState(null);
  const [filePre, setFilePre] = useState(null);
  const [toWrite, setToWrite] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(1); // 1=load,2=preview,3=writing
  const [error, setError] = useState("");

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  };

  const mergeFiles = async () => {
    if (!fileEqui || !filePre) return setError("Selecciona ambos archivos");
    try {
      const equiRows = await parseExcel(fileEqui);
      const preRows = await parseExcel(filePre);

      const equiMap = {};
      // Equivalencias: column 0=barcode, 1=productId, 2=desc
      equiRows.slice(1).forEach((row) => {
        if (row[0] && row[1]) equiMap[row[1]] = { barcode: row[0], desc: row[2] };
      });

      const today = new Date();
      const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

      const writeArr = [];
      const skipArr = [];
      // Precios: column 0=productId, 1=desc, 4=vigencia (DD/MM/YYYY), 5=price
      preRows.slice(1).forEach((row, idx) => {
        const productId = row[0];
        const vig = row[4];
        const price = row[5];

        if (!productId || !price || !vig) {
          skipArr.push({ row: idx + 2, reason: "Datos incompletos", productId });
          return;
        }

        const [d, m, y] = vig.split("/").map((v) => parseInt(v, 10));
        const vigDate = new Date(y + 2000, m - 1, d); // handle YY -> YYYY

        if (isNaN(vigDate.getTime()) || vigDate < lastYear) {
          skipArr.push({ row: idx + 2, reason: "Vigencia fuera de rango", productId });
          return;
        }

        const barcode = equiMap[productId]?.barcode || null;
        const desc = equiMap[productId]?.desc || row[1];

        writeArr.push({ productId, barcode, desc, vigencia: vig, precio: price });
      });

      setToWrite(writeArr);
      setSkipped(skipArr);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError("Error al procesar los archivos");
    }
  };

  const backupCurrentData = async () => {
    // get all products
    const backupName = `backup_import_${Date.now()}.json`;
    const snapshot = {};
    for (const item of toWrite) {
      const docRef = doc(db, "products", item.productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) snapshot[item.productId] = docSnap.data();
    }
    const blob = new Blob([JSON.stringify(snapshot)], { type: "application/json" });
    const storageRef = ref(storage, backupName);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    console.log("Backup uploaded:", url);
  };

  const writeToFirestore = async () => {
    setStep(3);
    let written = 0;
    const batchSize = 200;
    for (let i = 0; i < toWrite.length; i += batchSize) {
      const batch = toWrite.slice(i, i + batchSize);
      for (const item of batch) {
        const docRef = doc(db, "products", item.productId);
        const existing = await getDoc(docRef);
        let shouldWrite = true;
        if (existing.exists()) {
          const data = existing.data();
          shouldWrite =
            data.precio !== item.precio ||
            data.vigencia !== item.vigencia ||
            data.desc !== item.desc ||
            data.barcode !== item.barcode;
        }
        if (shouldWrite) {
          await setDoc(docRef, item);
          written++;
        }
      }
      setProgress(Math.min(100, Math.round(((i + batch.length) / toWrite.length) * 100)));
    }
    setStep(1);
    alert(`Importación completada. Productos escritos: ${written}, ignorados: ${skipped.length}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-3xl bg-gray-900 p-6 rounded-xl shadow-lg text-gold space-y-4">
        <h2 className="text-xl font-bold">Importar Productos</h2>
        {error && <p className="text-red-500">{error}</p>}
        {step === 1 && (
          <>
            <div className="flex space-x-2">
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => setFileEqui(e.target.files[0])}
                className="flex-1"
              />
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => setFilePre(e.target.files[0])}
                className="flex-1"
              />
            </div>
            <button
              onClick={mergeFiles}
              className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition"
            >
              Procesar y Previsualizar
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h3 className="font-semibold">Vista previa</h3>
            <p>Productos a escribir: {toWrite.length}</p>
            <p>Productos ignorados: {skipped.length}</p>
            <div className="max-h-60 overflow-auto bg-gray-800 p-2 rounded">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr>
                    <th className="p-1">Producto ID</th>
                    <th className="p-1">Barcode</th>
                    <th className="p-1">Precio</th>
                    <th className="p-1">Vigencia</th>
                    <th className="p-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {toWrite.map((p) => (
                    <tr key={p.productId} className="bg-gray-700">
                      <td className="p-1">{p.productId}</td>
                      <td className="p-1">{p.barcode}</td>
                      <td className="p-1">{p.precio}</td>
                      <td className="p-1">{p.vigencia}</td>
                      <td className="p-1 text-green-400">A escribir</td>
                    </tr>
                  ))}
                  {skipped.map((p) => (
                    <tr key={p.row} className="bg-gray-700">
                      <td className="p-1">{p.productId}</td>
                      <td className="p-1">-</td>
                      <td className="p-1">-</td>
                      <td className="p-1">-</td>
                      <td className="p-1 text-red-500">{p.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={writeToFirestore}
                className="flex-1 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition"
              >
                Confirmar escritura en Firebase
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <p>Importando... {progress}% completado</p>
            <div className="w-full h-4 bg-gray-700 rounded">
              <div className="h-4 bg-gold" style={{ width: `${progress}%` }}></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
