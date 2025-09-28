import { useState } from "react";
import LoginForm from "./components/LoginForm.jsx";
import Scanner from "./components/Scanner.jsx";
import { auth } from "./firebase.js";

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="w-full h-screen bg-black text-gold flex items-center justify-center">
      {!user ? (
        <LoginForm onLogin={setUser} />
      ) : (
        <Scanner />
      )}
    </div>
  );
}
