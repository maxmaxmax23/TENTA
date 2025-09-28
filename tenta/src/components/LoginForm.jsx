import { useState } from 'react';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // In version 1, we just simulate login
    onLogin({ email });
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black text-gold p-4">
      <form
        onSubmit={handleLogin}
        className="bg-gray-900 p-6 rounded-xl w-full max-w-xs flex flex-col gap-4"
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 rounded bg-black text-gold border border-gold"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 rounded bg-black text-gold border border-gold"
          required
        />
        <button
          type="submit"
          className="bg-gold text-black font-bold p-2 rounded hover:bg-yellow-500 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
