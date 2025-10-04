import React from "react";

export default function Dashboard({ onScan, onOpenImporter, firebaseWrites }) {
  return (
    <div className="text-center text-white animate-fadeIn">
      <h1 className="text-3xl text-gold mb-6">Panel de Control</h1>
      <div className="space-x-4">
        <button
          onClick={() => onScan(prompt("Escanear código de barras:"))}
          className="bg-gold text-black px-4 py-2 rounded hover:bg-yellow-500"
        >
          Escanear producto
        </button>
        <button
          onClick={onOpenImporter}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-400"
        >
          Importar Excel
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-400">
        <p>Escrituras Firebase realizadas: <b>{firebaseWrites}</b></p>
      </div>
    </div>
  );
}
