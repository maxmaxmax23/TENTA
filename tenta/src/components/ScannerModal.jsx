import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ScannerModal({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    const handleScan = async (code) => {
      try {
        const docRef = doc(db, "products", code);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          scanner.clear();
          onScan(code); // pass code only, modal fetches Firestore
        } else {
          alert("Producto no encontrado.");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      }
    };

    scanner.render(handleScan, (err) => console.warn(err));

    return () => scanner.clear();
  }, [onScan]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-gold">
      <h2 className="text-xl font-semibold mb-4">Escanea un código</h2>
      <div id="reader" className="w-80 h-80 border border-gold rounded-lg"></div>
    </div>
  );
}
