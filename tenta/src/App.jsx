import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Popover } from "@headlessui/react";
import ProductUploader from "./components/ProductUploader.jsx"; // your existing uploader
import Lista from "./oliolidb.json";

function Scanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.5,
        focusMode: "continuous",
      },
      /* verbose= */ false
    );

    scanner.render(
      (result) => {
        onScan(result);
        // Optional: stop scanner after first scan
        // scanner.clear().catch((err) => console.warn(err));
      },
      (err) => console.warn(err)
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="flex justify-center mt-4">
      <div
        id="reader"
        className="w-full max-w-md rounded-lg overflow-hidden"
      ></div>
    </div>
  );
}

function App() {
  const [scanResult, setScanResult] = useState(null);

  const handleScan = (code) => {
    setScanResult(code);
  };

  const productData = Lista.find((item) => item.id === scanResult);

  return (
    <div className="flex flex-col items-center p-4">
      {/* Top Logo */}
      <div className="mb-4 w-full flex justify-center">
        <img
          src="/assets/tenta.svg"
          alt="Tenta Logo"
          className="max-w-xs w-full"
        />
      </div>

      {/* Scanner */}
      <Scanner onScan={handleScan} />

      {/* Scan Result */}
      {scanResult && (
        <div className="mt-4 w-full max-w-md">
          <Popover className="relative w-full">
            <Popover.Button className="w-full px-4 py-2 text-lg bg-white text-black font-semibold rounded-full border border-black active:bg-black active:text-white active:border-blue-600">
              {scanResult}
            </Popover.Button>
            <Popover.Panel className="absolute left-1/2 z-10 mt-2 w-screen max-w-sm -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl">
              {productData ? (
                <div className="grid grid-cols-1 gap-2">
                  <div className="text-xl font-semibold uppercase">
                    ${productData.precio}
                  </div>
                  <div className="text-lg truncate">{productData.descripcion}</div>
                </div>
              ) : (
                <div className="text-red-500">
                  No hay datos para {scanResult}. Consultar en CAJA
                </div>
              )}
            </Popover.Panel>
          </Popover>
        </div>
      )}

      {/* Product Uploader */}
      {scanResult && (
        <div className="mt-4 w-full max-w-md">
          <ProductUploader scannedCode={scanResult} />
        </div>
      )}

      {/* Floating "New Code" Button */}
      <button
        className="fixed bottom-6 right-6 px-4 py-2 bg-white text-black font-semibold rounded-full border border-black active:bg-black active:text-white active:border-blue-600"
        onClick={() => window.location.reload(true)}
      >
        NUEVO CODIGO
      </button>
    </div>
  );
}

export default App;
  