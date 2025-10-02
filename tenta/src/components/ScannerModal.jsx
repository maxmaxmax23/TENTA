// File: src/components/ScannerModal.jsx
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScannerModal({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [log, setLog] = useState("");

  useEffect(() => {
    // Initialize scanner
    scannerRef.current = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    let scanned = false;

    scannerRef.current.render(
      (decodedText) => {
        if (!scanned) {
          scanned = true;
          setScanning(false);
          setLog(`✅ Escaneado: ${decodedText}`);
          scannerRef.current.clear().then(() => {
            onScan(decodedText);
          });
        }
      },
      (error) => {
        console.warn(error);
        setLog(`⚠ Error de lectura`);
      }
    );

    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-semibold mb-2">Escanea un código</h2>
      {scanning ? (
        <div id="reader" className="w-80 h-80 border border-gold rounded-lg"></div>
      ) : (
        <p className="text-gold mb-2">{log}</p>
      )}
      <button
        onClick={() => {
          scannerRef.current?.clear();
          onClose();
        }}
        className="mt-4 py-2 px-4 bg-gray-700 text-gold rounded-lg hover:bg-gray-600 transition"
      >
        Cancelar
      </button>
    </div>
  );
}
