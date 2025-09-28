import { useState } from "react";
import LoginForm from "./components/LoginForm";
import Scanner from "./components/Scanner";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <>
      {!loggedIn ? (
        <LoginForm onLogin={() => setLoggedIn(true)} />
      ) : (
        <Scanner />
      )}
    </>
  );
}
