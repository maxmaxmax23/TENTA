import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js"; // ✅ added .js

export default function LoginForm({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
    } catch (err) {
         console.error(err); // <-- add this
         setError(err.code); // show error code to user for debugging

    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="flex flex-col w-full max-w-md p-6 bg-black border-gold border rounded-xl shadow-lg"
    >
      <h2 className="text-2xl mb-4 text-gold font-bold text-center">
        Login
      </h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
      />
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <button
        type="submit"
        className="px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:scale-105 transition-transform"
      >
        Login
      </button>
    </form>
  );
}
