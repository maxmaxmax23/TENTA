import { useRef } from "react";
import { db } from "./firebase.js";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";

export default function JsonSyncModal({ closeModal }) {
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = fileRef.current.files[0];
    if (!file) return;
    const data = await file.text();
    const json = JSON.parse(data);

    for (const item of json) {
      const docRef = doc(db, "products", item.id);
      await setDoc(docRef, item, { merge: true });
    }
    alert("JSON synced to Firebase!");
  };

  const handleExport = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    const json = snapshot.docs.map((doc) => doc.data());
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "firebase_export.json";
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-black border-gold border rounded-xl p-6 w-11/12 max-w-md flex flex-col items-center animate-slideUp">
        <h2 className="text-xl font-bold mb-4">JSON Sync</h2>
        <input type="file" ref={fileRef} accept=".json" className="mb-4" />
        <button
          onClick={handleUpload}
          className="px-4 py-2 mb-2 bg-gold text-black rounded-lg font-semibold hover:scale-105 transition-transform"
        >
          Upload JSON
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 mb-2 bg-gold text-black rounded-lg font-semibold hover:scale-105 transition-transform"
        >
          Export Firebase JSON
        </button>
        <button
          onClick={closeModal}
          className="px-4 py-2 mt-2 bg-gray-800 text-gold rounded-lg font-semibold hover:scale-105 transition-transform"
        >
          Close
        </button>
      </div>
    </div>
  );
}
