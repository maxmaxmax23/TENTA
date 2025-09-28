import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

// Optional logos (replace with your own assets if needed)
import tentaLogo from "./assets/tenta.svg";
import glowupLogoLight from "./assets/glowupLogoLight.png";
import glowupLogoDark from "./assets/glowupLogoDark.png";

function Main() {
  const prefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  return (
    <React.StrictMode>
      <div className="flex flex-col items-center min-h-screen bg-black text-gold px-4">
        <div className="flex justify-center items-center py-4">
          <a href="https://instagram.com/glow.upvm" target="_blank" rel="noreferrer">
            <img
              src={prefersDarkMode ? glowupLogoDark : glowupLogoLight}
              alt="logo"
              className="logo max-w-xs sm:max-w-sm md:max-w-md"
            />
          </a>
        </div>

        <App />
      </div>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Main />);
