export default function Navbar() {
  return (
    <nav className="w-full bg-white shadow-sm px-6 py-3 flex items-center justify-between">
      
      {/* LEFT: LOGO */}
      <h1 className="text-2xl font-bold text-emerald-600">
        VIT MART
      </h1>

      {/* RIGHT: ACTION BUTTONS */}
      <div className="hidden md:flex items-center gap-3">
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition">
          🧁 Shop Cakes
        </button>

        <button className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition">
          🍎 Shop Fruits
        </button>

        <button className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition">
          💊 Shop Medicine
        </button>

        <button className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-yellow-600 transition">
          🚲 Bike Rental
        </button>
      </div>

      {/* MOBILE BUTTONS */}
      <div className="md:hidden flex flex-wrap gap-2 px-4 py-3 bg-white">
        <button className="bg-emerald-600 text-white px-3 py-2 rounded-full text-xs">
          🧁 Cakes
        </button>
        <button className="bg-emerald-600 text-white px-3 py-2 rounded-full text-xs">
          🍎 Fruits
        </button>
        <button className="bg-emerald-600 text-white px-3 py-2 rounded-full text-xs">
         💊 Medicine
        </button>
        <button className="bg-yellow-500 text-white px-3 py-2 rounded-full text-xs">
        🚲 Bike
      </button>
      </div>


    </nav>
  );
}
