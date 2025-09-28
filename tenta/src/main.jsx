import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

function Main() {
  return (
    <React.StrictMode>
      <div className="min-h-screen w-full bg-black text-gold flex flex-col items-center justify-center px-4">
        <App />
      </div>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Main />);
