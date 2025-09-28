export default function Login({ onLogin }) {
  // state and submit handler...
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCredential.user); // triggers scanner rendering
    } catch (err) {
      setError(err.message);
    }
  };
}
