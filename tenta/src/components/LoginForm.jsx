import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';

export default function LoginForm({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <form
      className="flex flex-col gap-4 w-full max-w-sm p-6 bg-black/80 rounded-lg shadow-xl animate-fade-in"
      onSubmit={handleLogin}
    >
      <h1 className="text-2xl font-bold text-gold text-center">Login</h1>
      <input
        type="email"
        placeholder="Email"
        className="p-3 rounded bg-black/60 text-white placeholder-gold focus:outline-none"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="p-3 rounded bg-black/60 text-white placeholder-gold focus:outline-none"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-red-500 text-center">{error}</p>}
      <button type="submit" className="py-3 bg-gold text-black font-semibold rounded hover:brightness-110 transition">
        Login
      </button>
    </form>
  );
}
