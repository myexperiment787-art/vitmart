export default function CakesPage() {
  const cakes = [
    { name: "Chocolate Cake", price: "₹499" },
    { name: "Vanilla Cake", price: "₹399" },
    { name: "Red Velvet Cake", price: "₹699" },
    { name: "Black Forest Cake", price: "₹599" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        🍰 Cake Varieties
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cakes.map((cake, index) => (
          <div
            key={index}
            className="border rounded-xl p-4 shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold">{cake.name}</h2>
            <p className="text-gray-600 mt-2">{cake.price}</p>

            <button className="mt-4 w-full bg-pink-600 text-white py-2 rounded">
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
