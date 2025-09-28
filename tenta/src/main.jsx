import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

function Main() {
  return (
    <React.StrictMode>
      <div className="w-screen h-screen bg-black text-yellow-400 flex flex-col items-center justify-center animate-fade-in">
        <App />
      </div>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Main />);
