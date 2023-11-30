import { useEffect, useState, Fragment} from 'react'
import './App.css'
import './index.css'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Popover } from '@headlessui/react'
import './index.jsx'
import Lista from "./tentadb.json"


function App() {
  const [scanResult, setScanResult] = useState(null);
  const [codigoAr, setCodigoAr] = useState(0);
  let [isOpen, setIsOpen] = useState(false)
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width:250,
        height: 250,
      },
      fps: 5,
    });
  
   scanner.render(success, error);

   function success (result) {
    scanner.clear();
    setScanResult(String(result));
  
   }
   
   function error(err) {
    console.warn(err);
   }
  
  },[]);

  return (

   <> 
   
   <div className='App'>
  {scanResult ? (
    <div>
      Codigo:
      <Popover className="relative">
        <Popover.Button className="px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2">{scanResult}</Popover.Button>

        <Popover.Panel className="absolute z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div className="mt-1 text-xl font-semibold uppercase leading-tight truncate">
            {Lista.filter((precio) => precio.id === scanResult).map((precio) => (
              <div key={precio.precio}>${precio.precio}</div>
            ))}
          </div>
          <div className="mt-1 text-xl font-semibold uppercase leading-tight truncate">
            {Lista.filter((precio) => precio.id === scanResult).map((precio) => (
              <div key={precio.descripcion}>{precio.descripcion}</div>
            ))}
          </div>
          </div>          

          <img src="/solutions.jpg" alt="" />
        </Popover.Panel>
      </Popover>
    </div>
  ) : (
    <div id="reader"></div>
  )}
</div>
 
    </>  
  );

}
export default App