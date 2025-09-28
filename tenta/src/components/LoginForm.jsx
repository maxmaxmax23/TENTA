import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCredential.user);
    } catch (err) {
      setError("Credenciales inválidas");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full max-w-sm p-6 bg-black/80 rounded-xl gap-4"
    >
      <h2 className="text-2xl font-bold text-center text-gold">Login</h2>
      <input
        type="email"
        placeholder="Email"
        className="p-3 rounded-md text-black"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="p-3 rounded-md text-black"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" className="p-3 bg-gold text-black rounded-md font-bold hover:bg-yellow-500 transition">
        Iniciar Sesión
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
