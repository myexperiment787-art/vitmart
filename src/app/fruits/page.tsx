import Image from "next/image";
import TopBanner from "../../components/TopBanner";

const fruits = [
  {
    name: "Apple",
    price: "₹120 / kg",
    image: "/fruits/apple.jpg",
  },
  {
    name: "Banana",
    price: "₹60 / dozen",
    image: "/fruits/banana.jpg",
  },
  {
    name: "Orange",
    price: "₹80 / kg",
    image: "/fruits/orange.jpg",
  },
];

export default function FruitsPage() {
  return (
    <>
      {/* TOP INFO BANNER */}
      <TopBanner />

      {/* FRUITS CONTENT */}
      <div className="px-6 py-10 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-10">
          🍎 Fresh Fruits
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {fruits.map((fruit) => (
            <div
              key={fruit.name}
              className="bg-white rounded-2xl shadow-md p-4 text-center hover:shadow-xl transition"
            >
              <Image
                src={fruit.image}
                alt={fruit.name}
                width={300}
                height={200}
                className="rounded-xl mx-auto object-cover"
              />

              <h2 className="text-xl font-semibold mt-4">
                {fruit.name}
              </h2>

              <p className="text-gray-600 mt-2">
                {fruit.price}
              </p>

              <button className="mt-4 bg-emerald-600 text-white px-5 py-2 rounded-full hover:bg-emerald-700 transition">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
