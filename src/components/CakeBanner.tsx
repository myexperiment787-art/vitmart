"use client";

import Link from "next/link";

export default function CakeBanner() {
  return (
    <section className="w-full">
      {/* BACKGROUND */}
      <div className="bg-gradient-to-r from-pink-100 via-rose-50 to-yellow-100 py-20 px-6 text-center">
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
          🎂 Fresh Cakes Delivered in Minutes
        </h1>

        <p className="text-gray-700 max-w-2xl mx-auto mb-6 text-base md:text-lg">
           Your cake, your design! 🍰✨ Send us your custom request or cake photo on WhatsApp.
        </p>
        
        <p className="text-gray-700 max-w-2xl mx-auto mb-6 text-base md:text-lg">
          Enjoy freshly baked cakes delivered right to your doorstep.
          Quality & taste guaranteed!
        </p>

        <p className="text-gray-700 max-w-2xl mx-auto mb-6 text-base md:text-lg">
          🚚 Free Delivery on orders above ₹299
        </p>

        <Link href="#cakes">
          <button className="px-6 py-3 border-2 border-gray-800 rounded-full font-semibold hover:bg-gray-900 hover:text-white transition">
            Shop Cakes
          </button>
        </Link>
      </div>
    </section>
  );
}
