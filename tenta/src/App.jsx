import { useState } from "react";
import Login from "./components/Login.jsx";
import Scanner from "./components/Scanner.jsx";

function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <Scanner />
      )}
    </div>
  );
}

export default App;
