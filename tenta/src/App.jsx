import { useState } from "react";
import { Popover } from "@headlessui/react";
import Scanner from "./components/Scanner";
import Lista from "./tentadb.json";

function App() {
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

  return (
    <div className="App">
      {scanResult ? (
        <div>
          CODIGO:
          <Popover className="relative">
            <Popover.Button className="px-1.5em py-2em text-lg bg-white text-black font-semibold rounded-full border border-black active:text-white active:bg-black active:border-blue-600">
              {scanResult}
            </Popover.Button>

            <Popover.Panel className="absolute left-1/2 z-10 mt-3 w-screen max-w-sm -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl">
              {Lista.filter((precio) => precio.id === scanResult).length > 0 ? (
                <div className="grid grid-cols-1">
                  <div className="justify-self-center mt-1 text-xl font-semibold uppercase leading-tight truncate">
                    {Lista.filter((precio) => precio.id === scanResult).map(
                      (precio) => (
                        <div key={precio.precio}>${precio.precio}</div>
                      )
                    )}
                  </div>
                  <div className="justify-self-center mt-1 text-xl font-semibold uppercase leading-tight truncate">
                    {Lista.filter((precio) => precio.id === scanResult).map(
                      (precio) => (
                        <div key={precio.descripcion}>{precio.descripcion}</div>
                      )
                    )}
                  </div>
                  <div className="justify-self-center mt-1 text-xl font-semibold uppercase leading-tight truncate">
                    {Lista.filter(
                      (precio) => precio.id === scanResult && precio.vigencia
                    ).map((precio) => (
                      <div key={precio.vigencia}>
                        {convertExcelDate(precio.vigencia)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>No hay datos para {scanResult}. Consultar en CAJA</div>
              )}
            </Popover.Panel>
          </Popover>
        </div>
      ) : (
        <Scanner onScan={setScanResult} />
      )}
    </div>
  );
}

export default App;
