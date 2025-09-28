import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err) {
      setError("Login failed. Check credentials.");
    }
  };

  return (
    <div className="bg-black border-gold border rounded-xl p-6 flex flex-col gap-4 shadow-xl">
      <h2 className="text-2xl font-bold text-gold text-center">Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-4 py-2 rounded border border-gold bg-black text-gold placeholder-gold/70 focus:ring-2 focus:ring-gold outline-none w-full"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="px-4 py-2 rounded border border-gold bg-black text-gold placeholder-gold/70 focus:ring-2 focus:ring-gold outline-none w-full"
      />
      <button
        onClick={handleLogin}
        className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-goldLight active:bg-goldDark transition"
      >
        Login
      </button>
      {error && <p className="text-red-500 text-center">{error}</p>}
    </div>
  );
}
