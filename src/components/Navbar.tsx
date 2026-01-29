"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-white shadow-sm px-6 py-3">

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">

        {/* LOGO */}
        <h1 className="text-2xl font-bold text-emerald-600">
          VIT MART
        </h1>

        {/* CATEGORY BUTTONS */}
        <div className="flex flex-wrap items-center gap-3 justify-center">

          <Link href="/cakes">
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700">
              🎂 Cakes
            </button>
          </Link>

          <Link href="/fruits">
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700">
              🍎 Fruits
            </button>
          </Link>

          <Link href="/medicine">
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700">
              💊 Medicine
            </button>
          </Link>

          <Link href="/bike">
            <button className="bg-yellow-500 text-white px-4 py-2 rounded-full hover:bg-yellow-600">
              🚲 Bike Rental
            </button>
          </Link>

        </div>
      </div>
    </nav>
  );
}
