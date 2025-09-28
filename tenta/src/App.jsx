import { useState, useEffect } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase.js";
import Scanner from "./components/Scanner.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Login failed. Check email/password.");
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // ----- Render -----
  if (!user) {
    // LOGIN FORM
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <form className="flex flex-col w-full max-w-sm" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-2 p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-2 p-2 border rounded"
          />
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">
            Login
          </button>
        </form>
      </div>
    );
  }

  // AFTER LOGIN – SHOW SCANNER
  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 bg-gray-50">
      <div className="flex w-full justify-end mb-4">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
      <Scanner />
    </div>
  );
}
