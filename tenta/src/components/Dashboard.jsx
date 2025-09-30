// File: src/components/Dashboard.jsx
import { useState, useEffect } from "react";
import ScannerModal from "./ScannerModal.jsx";
import ExcelImporter from "./ExcelImporter.jsx";
import BackupRestore from "./BackupRestore.jsx";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export default function Dashboard({ onScan, user }) {
  const [showScanner, setShowScanner] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [firestoreWrites, setFirestoreWrites] = useState(0);

  // Fetch initial write count from Firestore metadata (optional)
  useEffect(() => {
    const fetchWriteCount = async () => {
      try {
        const counterDoc = await getDoc(doc(db, "metadata", "counters"));
        if (counterDoc.exists()) {
          setFirestoreWrites(counterDoc.data().writes || 0);
        }
      } catch (err) {
        console.error("Error fetching write counter:", err);
      }
    };
    fetchWriteCount();
  }, []);

  // Callback to update writes after each import
  const handleWritesUpdate = (writesAdded) => {
    setFirestoreWrites((prev) => prev + writesAdded);
    // Optional: persist to Firestore
    // setDoc(doc(db, "metadata", "counters"), { writes: firestoreWrites + writesAdded });
  };

  return (
    <div className="w-full h-screen bg-black text-gold flex flex-col items-center justify-start p-6 space-y-4 overflow-auto">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-sm mb-4">Firestore writes acumulados: {firestoreWrites}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        <button
          onClick={() => setShowScanner(true)}
          className="w-full py-3 bg-gold text-black rounded-lg hover:bg-yellow-500 transition"
        >
          Escanear
        </button>

        <button
          onClick={() => setShowImporter(true)}
          className="w-full py-3 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
        >
          Importar Excel
        </button>

        <button
          onClick={() => setShowBackup(true)}
          className="w-full py-3 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
        >
          Restaurar Backup
        </button>
      </div>

      {showScanner && <ScannerModal onScan={onScan} />}
      {showImporter && (
        <ExcelImporter
          onClose={() => setShowImporter(false)}
          user={user}
          initialWrites={firestoreWrites}
          onWritesUpdate={handleWritesUpdate}
        />
      )}
      {showBackup && <BackupRestore onClose={() => setShowBackup(false)} />}
    </div>
  );
}
