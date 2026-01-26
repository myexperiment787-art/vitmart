type Product = {
  name: string;
  price: number;
};

export default function ProductCard({ name, price }: Product) {
  return (
    <div className="border p-4 rounded-lg shadow">
      <h3 className="font-semibold">{name}</h3>
      <p>${price}</p>
      <button className="mt-2 bg-black text-white px-4 py-2 rounded">
        Add to Cart
      </button>
    </div>
  );
}
