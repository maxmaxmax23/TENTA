import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';
import tentaLogo from './assets/tenta.svg';
import tentalogov2Light from './assets/tentalogov2Light.svg';
import tentalogov2Dark from './assets/tentalogov2Dark.svg'

function Main() {
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return (
    <React.StrictMode>
      <>
        <div className="flex justify-center items-center">
          <a href="https://instagram.com/tentacionesdeco" target="_blank">
            <img src={prefersDarkMode ? tentalogov2Dark : tentalogov2Light} className="logo" alt="logo" />
          </a>
        </div>
        <button
          className="px-1.5em py-2em text-lg text-logo-shaddow font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-pink-shaddow hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          onClick={() => window.location.reload(true)}
        >
          NUEVO CODIGO
        </button>
      </>
      <App />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Main />);
