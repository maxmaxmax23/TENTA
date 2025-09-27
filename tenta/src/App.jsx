import { useState } from "react";
import { Popover } from "@headlessui/react";
import Login from "./components/Login.jsx";
import Scanner from "./components/Scanner.jsx";
import ProductUploader from "./components/ProductUploader.jsx";
import Lista from "./tentadb.json";

// Helper function to convert Excel serial number to Date
const convertExcelDate = (serial) => {
  const excelBaseDate = new Date(1899, 11, 30);
  const date = new Date(excelBaseDate.getTime() + serial * 86400000);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
};

function App() {
  const [scanResult, setScanResult] = useState(null);
  const [user, setUser] = useState(null); // Track logged-in user

  return (
    <div className="App">
      {/* Login */}
      <Login onLogin={setUser} />

      {/* Scanner (only show if logged in) */}
      {user && !scanResult && <Scanner onScan={setScanResult} />}

      {/* Product info / uploader */}
      {scanResult && (
        <div>
          <h2>Scanned Code: {scanResult}</h2>

          <Popover className="relative">
            <Popover.Button className="px-3 py-2 text-lg bg-white text-black font-semibold rounded-full border border-black">
              {scanResult}
            </Popover.Button>

            <Popover.Panel className="absolute left-1/2 z-10 mt-3 w-screen max-w-sm -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl">
              {Lista.filter((item) => item.id === scanResult).length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {Lista.filter((item) => item.id === scanResult).map(
                    (item) => (
                      <div key={item.id}>
                        <div>${item.precio}</div>
                        <div>{item.descripcion}</div>
                        {item.vigencia && <div>{convertExcelDate(item.vigencia)}</div>}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div>No hay datos para {scanResult}. Consultar en CAJA</div>
              )}
            </Popover.Panel>
          </Popover>

          {/* Product uploader */}
          <ProductUploader scannedCode={scanResult} />
        </div>
      )}
    </div>
  );
}

export default App;
