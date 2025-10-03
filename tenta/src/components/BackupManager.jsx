// File: src/components/BackupManager.jsx
import React, { useState, useEffect } from "react";
import { firestore, storage } from "../firebase.js";  
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";


export default function BackupManager() {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");

  const handleBackup = async () => {
    setLoading(true);
    setLog("Iniciando backup...");

    try {
      const snapshot = await getDocs(collection(db, "products"));
      const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      const timestamp = new Date().toISOString();
      const backupRef = doc(db, "backups", `backup_${timestamp}`);
      await setDoc(backupRef, { products, timestamp });

      setLog(`✅ Backup completo: ${products.length} productos`);
    } catch (err) {
      console.error(err);
      setLog("❌ Error al crear backup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-gold rounded-xl shadow-md space-y-2">
      <h3 className="font-bold text-lg">Gestión de Backups</h3>
      <button
        onClick={handleBackup}
        disabled={loading}
        className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
      >
        {loading ? "Creando backup..." : "Crear Backup"}
      </button>
      {log && <p className="text-sm">{log}</p>}
    </div>
  );
}
