import { useState } from "react";
import Login from "./components/Login.jsx";
import Scanner from "./components/Scanner.jsx";

import tentaLogo from "./assets/tenta.svg";
import glowupLogoLight from "./assets/glowupLogoLight.png";
import glowupLogoDark from "./assets/glowupLogoDark.png";

function App() {
  const [user, setUser] = useState(null);
  const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {!user ? (
        <>
          <div className="flex justify-center mb-6">
            <a href="https://instagram.com/glow.upvm" target="_blank">
              <img
                src={prefersDarkMode ? glowupLogoDark : glowupLogoLight}
                className="logo max-w-sm"
                alt="GlowUp Logo"
              />
            </a>
          </div>

          <div className="flex justify-center mb-4">
            <img src={tentaLogo} className="logo max-w-lg" alt="Tenta Logo" />
          </div>

          <Login onLogin={setUser} />
        </>
      ) : (
        <Scanner />
      )}
    </div>
  );
}

export default App;
