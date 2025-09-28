export default function ProductCard({ product, imageUrl }) {
  return (
    <div className="flex flex-col items-center p-4 bg-black/70 rounded-lg shadow-lg">
      <h3 className="text-gold font-semibold">{product.descripcion}</h3>
      <p className="text-white">Precio: ${product.precio}</p>
      {imageUrl && (
        <img src={imageUrl} alt={product.descripcion} className="w-32 h-32 object-cover mt-2 rounded-md" />
      )}
    </div>
  );
}
