import Image from "next/image";

export default function CakesPage() {
  return (
    <div className="px-6 py-10">
      <h1 className="text-3xl font-bold text-center mb-8">
        Our Cake Collection 🎂
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        
        {/* Cake 1 */}
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <Image
            src="/cakes/chocolate.jpg"
            alt="Chocolate Cake"
            width={300}
            height={200}
            className="rounded-lg mx-auto"
          />
          <h2 className="mt-3 font-semibold">Chocolate Cake</h2>
          <p className="text-gray-600">₹499</p>
        </div>

        {/* Cake 2 */}
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <Image
            src="/cakes/vanilla.jpg"
            alt="Vanilla Cake"
            width={300}
            height={200}
            className="rounded-lg mx-auto"
          />
          <h2 className="mt-3 font-semibold">Vanilla Cake</h2>
          <p className="text-gray-600">₹399</p>
        </div>

        {/* Cake 3 */}
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <Image
            src="/cakes/redvelvet.jpg"
            alt="Red Velvet Cake"
            width={300}
            height={200}
            className="rounded-lg mx-auto"
          />
          <h2 className="mt-3 font-semibold">Red Velvet Cake</h2>
          <p className="text-gray-600">₹549</p>
        </div>

      </div>
    </div>
  );
}
