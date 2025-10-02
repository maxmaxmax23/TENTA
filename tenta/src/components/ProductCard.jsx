// File: src/components/ProductCard.jsx
export default function ProductCard({ product }) {
  return (
    <div className="w-full bg-gray-900 text-gold p-4 rounded-lg shadow-md space-y-2">
      <h3 className="text-lg font-bold">{product.descripcion || "Sin descripción"}</h3>
      <p className="text-sm">Precio: ${product.precio || "-"}</p>
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.descripcion}
          className="w-full h-32 object-cover rounded-lg"
          onError={(e) => (e.target.src = "/placeholder.png")}
        />
      ) : (
        <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-sm">No hay imagen</span>
        </div>
      )}
    </div>
  );
}
