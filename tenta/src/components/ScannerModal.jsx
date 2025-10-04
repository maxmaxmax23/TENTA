// File: src/components/ScannerModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function ScannerModal({ onClose, onScan }) {
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => html5QrCodeRef.current.clear())
          .catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    if (scanning) return;
    setScanError("");
    setScanning(true);

    try {
      const html5QrCode = new Html5Qrcode(scannerRef.current.id);
      html5QrCodeRef.current = html5QrCode;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setScanError("No se detectó ninguna cámara.");
        setScanning(false);
        return;
      }

      const cameraId = cameras[0].id;
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          stopScanner();
          setManualCode(decodedText);
          if (onScan) onScan(decodedText);
        },
        (errorMessage) => {
          // Ignorar errores menores de lectura
        }
      );
    } catch (err) {
      console.error("Error iniciando cámara:", err);
      setScanError("Error iniciando cámara o permisos denegados.");
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => html5QrCodeRef.current.clear())
        .catch(() => {});
    }
    setScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return alert("Ingrese un código o escanee uno.");
    onScan(manualCode.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4 z-50">
      <div className="bg-gray-900 text-gold rounded-2xl p-4 w-full max-w-md flex flex-col gap-4">
        <h2 className="text-xl font-bold text-center mb-2">Escanear o Buscar Producto</h2>

        <div id="qr-reader" ref={scannerRef} className="w-full bg-black rounded-lg overflow-hidden" />

        {scanError && <p className="text-red-500 text-sm text-center mt-2">{scanError}</p>}

        <div className="flex flex-col gap-2 mt-4">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Ingresar código o SKU manualmente"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="bg-gold text-black px-4 py-2 rounded-lg font-semibold"
            >
              Buscar
            </button>
          </form>

          <button
            onClick={scanning ? stopScanner : startScanner}
            className={`${
              scanning ? "bg-red-600" : "bg-green-600"
            } text-black py-2 rounded-lg font-semibold mt-2`}
          >
            {scanning ? "Detener Escaneo" : "Iniciar Escaneo"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 bg-gray-700 text-gold py-2 rounded-lg hover:bg-gray-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
