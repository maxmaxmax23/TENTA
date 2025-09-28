import { useEffect, useState } from "react";
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import Scanner from "./components/Scanner.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gold gap-4 p-4">
        <h1 className="text-3xl font-bold tracking-widest">TENTA CATALOG</h1>
        <input
          type="email"
          placeholder="Email"
          className="px-4 py-2 rounded bg-black border border-gold text-gold placeholder-gold/70 focus:outline-none focus:ring-2 focus:ring-gold w-full max-w-xs"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="px-4 py-2 rounded bg-black border border-gold text-gold placeholder-gold/70 focus:outline-none focus:ring-2 focus:ring-gold w-full max-w-xs"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition"
        >
          LOGIN
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-gold p-4">
      <button
        onClick={handleLogout}
        className="self-end mb-4 px-4 py-2 border border-gold rounded hover:bg-gold hover:text-black transition"
      >
        LOGOUT
      </button>
      <Scanner />
    </div>
  );
}
