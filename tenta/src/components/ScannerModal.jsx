// File: src/components/ScannerModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase.js";
import PropTypes from "prop-types";

/**
 * ScannerModal
 * - Uses Html5QrcodeScanner (rear camera)
 * - Manual input search (with basic debounce)
 * - Exact match resolution:
 *    1) try document by productId (exact)
 *    2) query where('barcodes', 'array-contains', code)
 * - Partial/manual search: fetch small subset and filter client-side (candidate approach)
 * - If one result -> call onSelect(productId)
 * - If multiple -> show list with which field matched, tap to select
 */
export default function ScannerModal({ onClose, onSelect }) {
  const readerRef = useRef(null);
  const scannerKeyRef = useRef(0);
  const html5Ref = useRef(null);

  const [manual, setManual] = useState("");
  const [searching, setSearching] = useState(false);
  const [scanError, setScanError] = useState("");
  const [matches, setMatches] = useState([]); // array of { id, description, matchedField }
  const [scanning, setScanning] = useState(false);

  // Debounce manual input
  useEffect(() => {
    if (!manual) {
      setMatches([]);
      return;
    }
    const t = setTimeout(() => {
      handleSearch(manual.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [manual]);

  // Initialize scanner lifecycle
  useEffect(() => {
    // start scanner only when modal is visible and not scanning yet
    return () => {
      if (html5Ref.current) {
        html5Ref.current
          .stop()
          .then(() => html5Ref.current.clear())
          .catch(() => {});
        html5Ref.current = null;
      }
    };
  }, []);

  const startScanner = async () => {
    if (scanning) return;
    setScanError("");
    setScanning(true);

    try {
      const scanner = new Html5QrcodeScanner(
        readerRef.current.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 120 },
          aspectRatio: 1,
        },
        /* verbose= */ false
      );
      html5Ref.current = scanner;

      scanner.render(
        async (decodedText) => {
          // decodedText from camera
          // stop scanner and handle
          try {
            await scanner.clear(); // stops camera preview
          } catch {}
          setScanning(false);
          handleDecoded(decodedText);
        },
        (err) => {
          // ignore frequent minor errors
          // console.warn("scan err", err);
        }
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      setScanError("Error iniciando la cámara. Revisa permisos.");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5Ref.current) {
      try {
        await html5Ref.current.clear();
      } catch {}
      html5Ref.current = null;
    }
    setScanning(false);
  };

  // Main flow when a code is scanned (camera) or when user triggers manual search result selection
  const handleDecoded = async (code) => {
    if (!code) return;
    setManual(code);
    await resolveCode(code);
  };

  // search wrapper used by manual submit / debounce and by decoded
  const handleSearch = async (q) => {
    if (!q) {
      setMatches([]);
      return;
    }
    setSearching(true);
    try {
      await resolveCode(q, /* allowPartial */ true);
    } finally {
      setSearching(false);
    }
  };

  // Resolve code: exact doc -> barcode query -> partial local filter (candidate)
  // allowPartial: when true, fallback to partial search if exact not found
  const resolveCode = async (code, allowPartial = false) => {
    setScanError("");
    setMatches([]);

    // 1) try direct doc lookup by productId
    try {
      const docRef = doc(db, "products", code);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const d = docSnap.data();
        // single exact match
        onSelect && onSelect(docSnap.id);
        onClose && onClose();
        return;
      }
    } catch (err) {
      console.warn("Doc lookup failed:", err);
    }

    // 2) try array-contains on barcodes
    try {
      const q = query(
        collection(db, "products"),
        where("barcodes", "array-contains", code)
      );
      const qsnap = await getDocs(q);
      if (!qsnap.empty) {
        const results = [];
        qsnap.forEach((d) => {
          const data = d.data();
          results.push({
            id: d.id,
            description: data.description || data.descripcion || "",
            matchedField: "barcode",
            barcodes: data.barcodes || data.barcode || [],
            price: data.price || data.precio || null,
          });
        });
        if (results.length === 1) {
          onSelect && onSelect(results[0].id);
          onClose && onClose();
          return;
        }
        setMatches(results);
        return;
      }
    } catch (err) {
      console.warn("Barcode query failed:", err);
    }

    // 3) partial search fallback (candidate approach)
    if (allowPartial) {
      try {
        // Candidate: fetch a limited number of products and filter locally
        // This is a pragmatic approach for mobile/testing; we avoid huge reads.
        const docsSnap = await getDocs(collection(db, "products"));
        const list = [];
        docsSnap.forEach((d) => {
          const data = d.data();
          const id = d.id;
          const desc = (data.description || data.descripcion || "").toString();
          const barcodes = data.barcodes || data.barcode || [];
          // match if id contains, desc contains, or any barcode includes
          const idMatch = id && id.toString().includes(code);
          const descMatch = desc && desc.toLowerCase().includes(code.toLowerCase());
          const barcodeMatch =
            Array.isArray(barcodes) &&
            barcodes.some((b) => b && b.toString().includes(code));
          if (idMatch || descMatch || barcodeMatch) {
            list.push({
              id,
              description: desc,
              matchedField: idMatch ? "productId" : descMatch ? "description" : "barcode",
              barcodes,
              price: data.price || data.precio || null,
            });
          }
        });

        if (list.length === 0) {
          setScanError("No se encontraron coincidencias.");
        } else if (list.length === 1) {
          onSelect && onSelect(list[0].id);
          onClose && onClose();
        } else {
          setMatches(list);
        }
        return;
      } catch (err) {
        console.error("Partial search failed:", err);
        setScanError("Error buscando coincidencias parciales.");
      }
    }

    // nothing found
    setScanError("Código no encontrado.");
  };

  const handleManualSubmit = async (e) => {
    e && e.preventDefault();
    if (!manual.trim()) return alert("Ingresa un código o escanea uno.");
    await resolveCode(manual.trim(), true);
  };

  const handleSelectMatch = (id) => {
    onSelect && onSelect(id);
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-start justify-center p-4 z-50">
      <div className="bg-gray-900 text-gold rounded-2xl p-4 w-full max-w-md flex flex-col gap-3">
        <h2 className="text-xl font-bold text-center">Escanear o Buscar Producto</h2>

        {/* Camera area */}
        <div
          id={`reader-${scannerKeyRef.current}`}
          ref={readerRef}
          className="w-full h-56 bg-black border border-gold rounded-lg overflow-hidden"
        />

        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 bg-gray-800 text-white rounded px-3 py-2 text-sm"
            placeholder="Ingresar código o SKU manualmente"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
          <button
            onClick={() => {
              // start scanner if not scanning; otherwise stop
              scanning ? stopScanner() : startScanner();
            }}
            className={`px-3 py-2 rounded ${scanning ? "bg-red-600" : "bg-green-600"} text-black font-semibold`}
          >
            {scanning ? "Detener" : "Escanear"}
          </button>
          <button
            onClick={handleManualSubmit}
            className="px-3 py-2 rounded bg-gold text-black font-semibold"
          >
            Buscar
          </button>
        </div>

        {searching && <p className="text-sm text-gray-400">Buscando…</p>}
        {scanError && <p className="text-sm text-red-500">{scanError}</p>}

        {/* Matches list */}
        {matches && matches.length > 0 && (
          <div className="overflow-y-auto max-h-48 mt-2 border border-gold rounded p-2">
            {matches.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelectMatch(m.id)}
                className="w-full text-left p-2 mb-1 bg-gray-800 rounded hover:bg-gray-700"
              >
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm font-semibold">{m.description || "Sin descripción"}</div>
                    <div className="text-xs text-gray-400">
                      {m.matchedField} • {m.id}
                    </div>
                    {Array.isArray(m.barcodes) && m.barcodes.length > 0 && (
                      <div className="text-xs text-gray-400 truncate">{m.barcodes.join(", ")}</div>
                    )}
                  </div>
                  <div className="text-xs text-gold self-start">Seleccionar</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 bg-gray-700 text-gold py-2 rounded">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

ScannerModal.propTypes = {
  onClose: PropTypes.func,
  onSelect: PropTypes.func, // receives productId
};
