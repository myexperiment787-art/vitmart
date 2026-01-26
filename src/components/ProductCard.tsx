type ProductProps = {
  name: string;
  price: number;
};

export default function ProductCard({ name, price }: ProductProps) {
  return (
    <div className="border rounded-lg p-6 shadow hover:shadow-lg transition">
      <h3 className="text-xl font-semibold mb-2">{name}</h3>
      <p className="text-lg font-bold mb-4">${price}</p>
      <button className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
        Add to Cart
      </button>
    </div>
  );
}
