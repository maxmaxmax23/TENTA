import { useState } from "react";
import { firestore } from "../firebase.js"; // make sure firebase is initialized
import { collection, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";

export default function ImporterModal({ mergedData, onClose }) {
  const [progress, setProgress] = useState({
    total: mergedData.length,
    written: 0,
    skipped: 0,
    outOfVigencia: 0
  });
  const [logs, setLogs] = useState([]);
  const [processing, setProcessing] = useState(false);

  const BATCH_SIZE = 400; // safe batch size for Firestore

  const handleImport = async () => {
    setProcessing(true);
    setLogs([]);
    const batch = writeBatch(firestore);
    let batchCount = 0;
    let written = 0;
    let skipped = 0;
    let outOfVigencia = 0;

    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    for (let i = 0; i < mergedData.length; i++) {
      const item = mergedData[i];
      const docRef = doc(firestore, "products", item.productId);
      const docSnap = await getDoc(docRef);
      const itemOutOfVigencia = new Date(item.vigencia.split("-").reverse().join("-")) < oneYearAgo;

      if (itemOutOfVigencia) {
        outOfVigencia++;
        continue;
      }

      let needsWrite = true;
      if (docSnap.exists()) {
        const existing = docSnap.data();
        // check if any field changed
        if (
          existing.description === item.description &&
          existing.price === item.price &&
          JSON.stringify(existing.barcodes) === JSON.stringify(item.barcodes) &&
          existing.vigencia === item.vigencia
        ) {
          needsWrite = false;
        }
      }

      if (needsWrite) {
        batch.set(docRef, item, { merge: true });
        batchCount++;
        written++;
      } else {
        skipped++;
      }

      // commit batch every BATCH_SIZE
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batchCount = 0;
      }

      // update live counters
      setProgress({ total: mergedData.length, written, skipped, outOfVigencia });
    }

    // final commit if any remaining
    if (batchCount > 0) {
      await batch.commit();
    }

    setLogs((prev) => [
      ...prev,
      `Import completed: Written ${written}, Skipped ${skipped}, Out-of-vigencia ${outOfVigencia}`
    ]);
    setProcessing(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Importer</h2>
      <button
        className={`bg-green-500 text-white px-4 py-2 mb-4 ${processing ? "opacity-50" : ""}`}
        onClick={handleImport}
        disabled={processing}
      >
        {processing ? "Importing..." : "Start Import"}
      </button>

      <div className="mb-2">
        <strong>Progress:</strong>
        <ul>
          <li>Total rows: {progress.total}</li>
          <li>Written: {progress.written}</li>
          <li>Skipped (unchanged): {progress.skipped}</li>
          <li>Out-of-vigencia: {progress.outOfVigencia}</li>
        </ul>
      </div>

      <div className="mt-2">
        <strong>Logs:</strong>
        <ul className="text-sm text-gray-700">
          {logs.map((l, idx) => (
            <li key={idx}>{l}</li>
          ))}
        </ul>
      </div>

      <button className="mt-4 bg-gray-400 px-4 py-2" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
