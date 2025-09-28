import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import Login from "./components/Login.jsx";
import App from "./App.jsx";
import "./App.css";

function Main() {
  const [user, setUser] = useState(null);

  return (
    <React.StrictMode>
      {user ? (
        <App />
      ) : (
        <Login onLogin={(user) => setUser(user)} />
      )}
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Main />);
