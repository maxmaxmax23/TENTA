import { useState } from 'react';
import LoginForm from './LoginForm.jsx';
import ProductUploaderModal from './ProductUploaderModal.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-gold">
      <h1 className="text-center text-2xl font-bold p-4">Tenta Scanner</h1>
      <ProductUploaderModal
        user={user}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
      />
    </div>
  );
}

export default App;
