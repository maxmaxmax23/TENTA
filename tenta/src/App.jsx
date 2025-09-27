import { useState } from "react";
import { Popover } from "@headlessui/react";
import Login from "./components/Login";
import Scanner from "./components/Scanner";
import ProductUploader from "./components/ProductUploader";
import Lista from "./tentadb.json"; // Vite supports JSON imports

function App() {
  const [user, setUser] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const convertExcelDate = (serial) => {
    const excelBaseDate = new Date(1899, 11, 30);
    const date = new Date(excelBaseDate.getTime() + serial * 86400000);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(date);
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="App">
      {scanResult ? (
        <>
          <div>
            CODIGO:
            <Popover className="relative">
              <Popover.Button className="px-1.5em py-2em text-lg bg-white text-black font-semibold rounded-full border border-black active:text-white active:bg-black active:border-blue-600">
                {scanResult}
              </Popover.Button>

              <Popover.Panel className="absolute left-1/2 z-10 mt-3 w-screen max-w-sm -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl">
                {Lista.filter((precio) => precio.id === scanResult).length > 0 ? (
                  <div className="grid grid-cols-1">
                    {["precio", "descripcion", "vigencia"].map((key) => (
                      <div
                        key={key}
                        className="justify-self-center mt-1 text-xl font-semibold uppercase leading-tight truncate"
                      >
                        {Lista.filter((precio) => precio.id === scanResult)
                          .map((precio) => {
                            if (key === "vigencia" && precio[key])
                              return convertExcelDate(precio[key]);
                            return precio[key];
                          })
                          .map((v, i) => (
                            <div key={i}>{v}</div>
                          ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>No hay datos para {scanResult}. Consultar en CAJA</div>
                )}
              </Popover.Panel>
            </Popover>
          </div>
          <ProductUploader scannedCode={scanResult} />
        </>
      ) : (
        <Scanner onScan={setScanResult} />
      )}
    </div>
  );
}

export default App;
