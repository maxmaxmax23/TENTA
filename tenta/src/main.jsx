import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import tentaLogo from './assets/tenta.svg'

export default function Main() {  

}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>    
      <>
        <div>
        <a href="https://instagram.com/tentacionesdeco" target="_blank">
          <img src={tentaLogo} className="logo" alt="logo" />
        </a>
      </div>
      <h1>BAZAR | DECO | COSMÉTICA</h1>
</>
    
   <App />
  </React.StrictMode>,
)
