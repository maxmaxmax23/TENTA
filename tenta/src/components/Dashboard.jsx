import { useState } from "react";
import ExcelMerger from "./ExcelMerger";
import ImporterModal from "./ImporterModal";

export default function Dashboard() {
  const [mergedData, setMergedData] = useState([]);
  const [showImporter, setShowImporter] = useState(false);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Merge Files */}
      <div className="mb-4 border p-4">
        <h2 className="text-xl mb-2">Step 1: Merge Excel Files</h2>
        <ExcelMerger onMerged={(data) => setMergedData(data)} />
      </div>

      {/* Import Button */}
      {mergedData.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl mb-2">Step 2: Import Merged Data</h2>
          <button
            className="bg-green-500 text-white px-4 py-2"
            onClick={() => setShowImporter(true)}
          >
            Open Importer
          </button>
        </div>
      )}

      {/* Importer Modal */}
      {showImporter && (
        <ImporterModal
          mergedData={mergedData}
          onClose={() => setShowImporter(false)}
        />
      )}
    </div>
  );
}
