import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import tentaLogo from './assets/tenta.svg'
import tentalogov2 from './assets/tentalogov2.png'

export default function Main() {  

}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>    
      <>
        <div>
        <a href="https://instagram.com/tentacionesdeco" target="_blank">
          <img src={tentalogov2} className="logo" alt="logo" />
        </a>
      </div>
      <h1>BAZAR | DECO | COSMÉTICA</h1>
</>
    
   <App />
  </React.StrictMode>,
)
