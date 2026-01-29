import Link from "next/link";
<Link href="/cakes">
  <button className="px-4 py-2 bg-pink-600 text-white rounded-full">
    🎂 Cakes
  </button>
</Link>

export default function Hero() {
  return (
    <section className="relative w-full h-[70vh] flex items-center justify-center overflow-hidden">
      
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1542838132-92c53300491e')",
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-yellow-500/80" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
          Welcome to <span className="text-yellow-300">Vit Mart</span>
        </h1>

        <p className="text-lg md:text-xl text-white/90 mb-8">
          Your Premium Destination for Fresh Fruits, Medicines & Bike Rentals
        </p>

        <button className="px-8 py-3 rounded-full bg-white text-emerald-700 font-semibold hover:bg-gray-100 transition">
          Explore Collection
        </button>
      </div>
    </section>
  );
}
