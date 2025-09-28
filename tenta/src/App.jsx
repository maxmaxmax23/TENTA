import { useState } from "react";
import Login from "./components/Login.jsx";
import Scanner from "./components/Scanner.jsx";

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-gold px-4">
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <Scanner />
      )}
    </div>
  );
}
