"use client";

import Image from "next/image";
import CakeBanner from "../../components/CakeBanner";

const phoneNumber = "919117865343"; // 🔴 replace with your WhatsApp number

function orderOnWhatsApp(name: string, price: number) {
  const message = `Hello, I want to order:

🍰 ${name}
💰 Price: ₹${price}

Please confirm availability.`;

  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  window.open(url, "_blank");
}

export default function CakesPage() {
  return (
    <div className="px-6 py-10">
      <CakeBanner />

      <h1 className="text-3xl font-bold text-center mb-8">
        Our Cake Collection 🎂
      </h1>

      <section
        id="cakes"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
      >
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

          <button
            onClick={() => orderOnWhatsApp("Chocolate Cake", 499)}
            className="mt-4 bg-green-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-700 transition"
          >
            📲 Order on WhatsApp
          </button>
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

          <button
            onClick={() => orderOnWhatsApp("Vanilla Cake", 399)}
            className="mt-4 bg-green-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-700 transition"
          >
            📲 Order on WhatsApp
          </button>
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

          <button
            onClick={() => orderOnWhatsApp("Red Velvet Cake", 549)}
            className="mt-4 bg-green-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-700 transition"
          >
            📲 Order on WhatsApp
          </button>
        </div>
      </section>
    </div>
  );
}
