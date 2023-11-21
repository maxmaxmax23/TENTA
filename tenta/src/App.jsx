import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import tentaLogo from './assets/tenta.svg'
import './App.css'
import { Html5QrcodeScanType, Html5QrcodeScanner } from 'html5-qrcode'

//function App() {
//  const [count, setCount] = useState(0)
//
//  return (
//    <>
//      <div>
//        <a href="https://instagram.com/tentacionesdeco" target="_blank">
//          <img src={tentaLogo} className="logo" alt="logo" />
//        </a>
//      </div>
//      <h1>BAZAR | DECO | COSMÉTICA</h1>
//      <div className="card">
//        <button onClick={() => setCount((count) => count + 1)}>
//          ESCANEAR CODIGO {count}
//        </button>
//      </div>
//    </>
//  )
//}
//export default App

function App() {
  const [scanResult, setScanResult] = useState(null);
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
    setScanResult(result);
  
   }
   
   function error(err) {
    console.warn(err);
   }
  
  },[]);

  return (

   <>
      <div>
        <a href="https://instagram.com/tentacionesdeco" target="_blank">
          <img src={tentaLogo} className="logo" alt="logo" />
        </a>
      </div>
      <h1>BAZAR | DECO | COSMÉTICA</h1>
    <div className='App'>
      { scanResult
      ? <div> Codigo: {scanResult}</div>
      : <div id="reader"></div>
}
    </div>
  </>
  );
}
export default App