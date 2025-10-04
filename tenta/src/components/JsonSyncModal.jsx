import { useState } from "react";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { firestore } from "../firebase.js";

export default function JsonSyncModal({ onClose }) {
  const [status, setStatus] = useState("");

  const handleSync = async () => {
    try {
      setStatus("Syncing data...");
      const snapshot = await getDocs(collection(firestore, "products"));
      const data = snapshot.docs.map((d) => d.data());

      await setDoc(doc(firestore, "sync", "latest"), {
        syncedAt: new Date().toISOString(),
        count: data.length,
      });

      setStatus(`Synced ${data.length} products successfully`);
    } catch (err) {
      console.error("Sync error:", err);
      setStatus("Error syncing data");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4">Sync JSON</h2>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleSync}
        >
          Sync
        </button>
        {status && <p className="mt-2">{status}</p>}
        <button
          className="mt-4 text-sm text-gray-600 underline"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
