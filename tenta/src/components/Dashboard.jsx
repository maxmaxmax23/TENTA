import { useState } from "react";
import ScannerModal from "./ScannerModal.jsx";
import ExcelImporter from "./ExcelImporter.jsx";
import { db } from "../firebase.js";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";

export default function Dashboard({ onScan, user }) {
  const [showScanner, setShowScanner] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [firebaseWrites, setFirebaseWrites] = useState(0);
  const [restoreProcessing, setRestoreProcessing] = useState(false);

  const handleRestore = async () => {
    const confirmRestore = window.confirm(
      "¿Deseas restaurar el backup anterior? Esto sobrescribirá los productos actuales."
    );
    if (!confirmRestore) return;

    try {
      setRestoreProcessing(true);

      // Get previous backup from Firestore backup collection
      const backupCol = collection(db, "backups");
      const snapshot = await getDocs(backupCol);
      const previousBackupDoc = snapshot.docs.find(doc => doc.id === "previous");
      if (!previousBackupDoc) {
        alert("No hay backup previo disponible.");
        return;
      }

      const backupData = previousBackupDoc.data().products;

      // Overwrite live products
      for (const item of backupData) {
        await setDoc(doc(db, "products", item.id), item);
      }

      alert(`Restore completo: ${backupData.length} productos restaurados.`);
    } catch (err) {
      console.error(err);
      alert("Error durante la restauración del backup.");
    } finally {
      setRestoreProcessing(false);
    }
  };

  return (
    <div className="w-full h-screen bg-black text-gold flex flex-col items-center justify-center p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="flex space-x-4">
        <button
          onClick={() => setShowScanner(true)}
          className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition"
        >
          Escanear
        </button>

        <button
          onClick={() => setShowImporter(true)}
          className="px-4 py-2 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
        >
          Importar
        </button>

        <button
          onClick={handleRestore}
          className="px-4 py-2 bg-red-600 text-black rounded-lg hover:bg-red-500 transition disabled:opacity-50"
          disabled={restoreProcessing}
        >
          {restoreProcessing ? "Restaurando..." : "Restaurar Backup"}
        </button>
      </div>

      <p className="text-sm text-gray-300">
        Writes acumulados en Firebase: {firebaseWrites}
      </p>

      {showScanner && <ScannerModal onScan={onScan} />}
      {showImporter && (
        <ExcelImporter
          user={user}
          initialWrites={firebaseWrites}
          onWritesUpdate={(count) => setFirebaseWrites(count)}
          onClose={() => setShowImporter(false)}
        />
      )}
    </div>
  );
}
