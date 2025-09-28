import { useState } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCredential.user);
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="p-3 rounded-lg bg-gray-900 text-yellow-400"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="p-3 rounded-lg bg-gray-900 text-yellow-400"
      />
      {error && <div className="text-red-500">{error}</div>}
      <button type="submit" className="p-3 bg-yellow-400 text-black rounded-lg font-bold">Login</button>
    </form>
  );
}
