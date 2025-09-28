import { useState } from "react";
import LoginForm from "./LoginForm.jsx";
import Scanner from "./Scanner.jsx";

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col items-center justify-center p-4">
      {!user ? (
        <LoginForm onLogin={setUser} />
      ) : (
        <Scanner />
      )}
    </div>
  );
}
