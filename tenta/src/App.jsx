import { useEffect, useState, Fragment } from 'react'
import './App.css'
import { Html5QrcodeScanType, Html5QrcodeScanner } from 'html5-qrcode'
import './components/modal'
import MyModal from './components/modal';


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
    setScanResult(result);
  
   }
   
   function error(err) {
    console.warn(err);
   }
  
  },[]);

  return (

   <>
    <div className='App'>
      { scanResult
      ? <div> Codigo:</div>
      : <div id="reader"></div>
      }
    </div>
    <div>
      <MyModal/>
     </div>
  </>  
  );
}
export default App