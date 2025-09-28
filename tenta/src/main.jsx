import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div className="w-screen min-h-screen bg-black text-yellow-400 flex flex-col items-center justify-start overflow-y-auto">
      <App />
    </div>
  </React.StrictMode>
);
