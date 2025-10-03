// src/components/Dashboard.jsx
import React, { useState } from "react";
import ImporterModal from "./ImporterModal";

export default function Dashboard() {
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          className="bg-black text-gold px-4 py-2 rounded hover:opacity-90"
          onClick={() => setIsImporterOpen(true)}
        >
          Importar Productos
        </button>

        <button
          className="bg-black text-gold px-4 py-2 rounded hover:opacity-90"
          onClick={() => setIsExportOpen(true)}
        >
          Exportar JSON / Excel
        </button>

        <button
          className="bg-black text-gold px-4 py-2 rounded hover:opacity-90"
          onClick={() => setIsInventoryOpen(true)}
        >
          Inventario
        </button>
      </div>

      {/* Importer Modal */}
      <ImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
      />

      {/* Future modals (just placeholders for now) */}
      {isExportOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2>Exportar JSON / Excel</h2>
            <button onClick={() => setIsExportOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {isInventoryOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2>Inventario</h2>
            <button onClick={() => setIsInventoryOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
