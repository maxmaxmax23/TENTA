import React, { useState } from "react";

export default function ScannerModal({ onClose, onScan }) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() === "") return;
    onScan(inputValue.trim());
    setInputValue("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center p-4">
      <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg w-full max-w-md animate-fadeIn">
        <h2 className="text-2xl text-gold mb-4">Escanear Código de Barras</h2>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            autoFocus
            placeholder="Ingresa o escanea el código"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:border-gold text-white"
          />
          <div className="flex justify-between">
            <button
              type="submit"
              className="bg-gold text-black px-4 py-2 rounded hover:bg-yellow-500"
            >
              Escanear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
