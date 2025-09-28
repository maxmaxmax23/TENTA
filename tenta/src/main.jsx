import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Login from "./components/Login.jsx";
import "./App.css";

import glowupLogoLight from "./assets/glowupLogoLight.png";
import glowupLogoDark from "./assets/glowupLogoDark.png";

function Main() {
  const prefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  return (
    <React.StrictMode>
      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "0 1rem",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Sticky header/logo */}
        <header
          style={{
            position: "sticky",
            top: 0,
            backgroundColor: "#fff",
            zIndex: 10,
            padding: "0.5rem 0",
            display: "flex",
            justifyContent: "center",
            borderBottom: "1px solid #ccc",
          }}
        >
          <a
            href="https://instagram.com/glow.upvm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={prefersDarkMode ? glowupLogoDark : glowupLogoLight}
              alt="GlowUp Logo"
              style={{ width: "120px", maxWidth: "30vw", height: "auto" }}
            />
          </a>
        </header>

        {/* Login section */}
        <Login />

        {/* Main App content */}
        <App />

        {/* Floating "New Code" button */}
        <button
          onClick={() => window.location.reload()}
          style={{
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            backgroundColor: "#fff",
            border: "1px solid #000",
            borderRadius: "999px",
            padding: "0.75rem 1rem",
            fontSize: "1rem",
            fontWeight: "bold",
            zIndex: 20,
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          }}
        >
          NUEVO CÓDIGO
        </button>
      </div>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Main />);
