// src/components/BackupManager.jsx
import React, { useEffect, useState } from "react";
import { db, storage } from "../firebase.js";
import {
  collection,
  getDocs,
  doc as docRef,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { ref as storageRef, getDownloadURL } from "firebase/storage";

export default function BackupManager({ user, onClose }) {
  const [backups, setBackups] = useState([]);
  const [log, setLog] = useState([]);
  const [processing, setProcessing] = useState(false);

  const appendLog = (l) => setLog((s) => [...s, `${new Date().toISOString()} - ${l}`]);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const metaSnap = await getDocs(collection(db, "backups_meta"));
      const list = metaSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
      setBackups(list.slice(0, 10));
    } catch (e) {
      console.error(e);
      appendLog("Error fetching backups: " + (e.message || e));
    }
  };

  const handleDownload = async (meta) => {
    try {
      const url = await getDownloadURL(storageRef(storage, meta.path));
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      appendLog("No se pudo descargar el archivo: " + (err.message || err));
      alert("No se pudo obtener el archivo.");
    }
  };

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const BATCH = 500;
  const BATCH_DELAY_MS = 200;

  const handleRestore = async (meta) => {
    if (!meta) return;
    if (!window.confirm(`Restaurar backup ${meta.timestamp} (usuario: ${meta.user})? Esto sobrescribirá la colección products.`)) return;

    setProcessing(true);
    appendLog(`Starting restore from ${meta.path}...`);

    try {
      const url = await getDownloadURL(storageRef(storage, meta.path));
      const res = await fetch(url);
      const payload = await res.json();
      const products = payload.products || payload;

      let restored = 0;
      for (let i = 0; i < products.length; i += BATCH) {
        const batch = writeBatch(db);
        const chunk = products.slice(i, i + BATCH);
        chunk.forEach((p) => {
          if (!p.id) return;
          batch.set(docRef(db, "products", p.id), p);
        });
        try {
          await batch.commit();
          restored += chunk.length;
          appendLog(`Restored batch ${i / BATCH + 1}: ${chunk.length} items`);
        } catch (batchErr) {
          console.error("Batch restore failed", batchErr);
          appendLog("ERROR restoring batch: " + (batchErr.message || batchErr));
        }
        if (i + BATCH < products.length) await delay(BATCH_DELAY_MS);
      }

      appendLog(`Restore complete: ${restored} items`);
      alert(`Restore completo: ${restored} items`);
    } catch (err) {
      console.error(err);
      appendLog("Error during restore: " + (err.message || err));
      alert("Error al restaurar backup. Revisa el log.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 overflow-auto z-50">
      <div className="w-11/12 max-w-3xl bg-gray-900 p-6 rounded-xl shadow-lg text-gold">
        <h2 className="text-xl font-bold mb-4">Backups</h2>

        <div className="mb-4 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-300">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">User</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id} className="border-t border-gray-800">
                  <td className="py-2">{b.timestamp}</td>
                  <td className="py-2">{b.user}</td>
                  <td className="py-2">
                    <button onClick={() => handleDownload(b)} className="mr-2 px-2 py-1 bg-gray-700 rounded">Download</button>
                    <button onClick={() => handleRestore(b)} className="px-2 py-1 bg-red-600 rounded">Restore</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-2 bg-black bg-opacity-40 rounded h-48 overflow-auto text-xs">
          {log.map((l, i) => <div key={i} className="text-yellow-300">{l}</div>)}
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="py-2 px-4 bg-gray-700 rounded text-gold">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
