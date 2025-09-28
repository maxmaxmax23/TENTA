import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';
import tentaLogo from './assets/tenta.svg';
import glowupLogoLight from './assets/glowupLogoLight.png';
import glowupLogoDark from './assets/glowupLogoDark.png';

function Main() {
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <React.StrictMode>
      <>
        {/* Logo section */}
        <div
          className="flex justify-center items-center"
          style={{ padding: '1rem 0' }}
        >
          <a
            href="https://instagram.com/glow.upvm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={prefersDarkMode ? glowupLogoDark : glowupLogoLight}
              className="logo"
              alt="GlowUp Logo"
              style={{
                width: '120px',
                maxWidth: '30vw',
                height: 'auto',
              }}
            />
          </a>
        </div>

        {/* New code button */}
        <div className="flex justify-center" style={{ marginBottom: '1rem' }}>
          <button
            className="px-4 py-2 text-base bg-white text-black font-semibold rounded-full border border-black active:text-white active:bg-black active:border-blue-600"
            onClick={() => window.location.reload()}
            style={{ minWidth: '150px' }}
          >
            NUEVO CÓDIGO
          </button>
        </div>

        {/* Main App content */}
        <div style={{ padding: '0 1rem' }}>
          <App />
        </div>
      </>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Main />);
