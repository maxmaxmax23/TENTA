// src/App.jsx
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import LoginForm from "./components/LoginForm";
import Scanner from "./components/Scanner";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => signOut(auth);

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-yellow-400">
      <header className="flex justify-between items-center p-4 border-b border-yellow-400">
        <h1 className="text-lg font-bold">Tenta App</h1>
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded bg-yellow-500 text-black font-semibold hover:bg-yellow-600"
        >
          Salir
        </button>
      </header>
      <main className="flex-grow flex justify-center items-center">
        <Scanner />
      </main>
    </div>
  );
}

export default App;
