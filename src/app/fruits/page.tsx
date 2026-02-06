"use client";

import Image from "next/image";
import TopBanner from "../../components/TopBanner";
import { useCart } from "../../context/CartContext";

export default function FruitsPage() {
  const { addToCart } = useCart();

  const fruits = [
    {
      name: "Apple PER KG",
      price: 120,
      image: "/fruits/apple.jpg",
    },
    {
      name: "Banana",
      price: 60,
      image: "/fruits/banana.jpg",
    },
    {
      name: "Orange",
      price: 80,
      image: "/fruits/orange.jpg",
    },
    {
      name: "Pomegranate",
      price: 80,
      image: "/fruits/Pomegranate.jpg",
    },
    {
      name: "Strawberry",
      price: 80,
      image: "/fruits/Strawberry.jpg",
    },

    {
      name: "Grape",
      price: 80,
      image: "/fruits/Grape.jpg",
    },

    {
      name: "Mango",
      price: 80,
      image: "/fruits/Mango.jpg",
    },

    {
      name: "Pineapple",
      price: 80,
      image: "/fruits/Pineapple.jpg",
    },

    {
      name: "Guava",
      price: 80,
      image: "/fruits/Guava.jpg",
    },

    {
      name: "Watermelon",
      price: 80,
      image: "/fruits/Watermelon.jpg",
    },

    {
      name: "Big Lemon",
      price: 80,
      image: "/fruits/Big Lemon.jpg",
    },

    {
      name: "Big Kiwi",
      price: 80,
      image: "/fruits/Big Kiwi.jpg",
    },

    {
      name: "Dragon Fruit",
      price: 80,
      image: "/fruits/Dragon Fruit.jpg",
    },

    {
      name: "Black Grape",
      price: 80,
      image: "/fruits/Black Grape.jpg",
    },

    {
      name: "Avocado",
      price: 80,
      image: "/fruits/Avocado.jpg",
    },

    {
      name: "Dates",
      price: 80,
      image: "/fruits/Dates.jpg",
    },

  ];

  return (
    <>
      <TopBanner />

      <div className="px-6 py-10 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-10">
          🍎 Fresh Fruits
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {fruits.map((fruit) => (
            <div
              key={fruit.name}
              className="bg-white rounded-xl shadow-md p-4 text-center"
            >
              <Image
                src={fruit.image}
                alt={fruit.name}
                width={300}
                height={200}
                className="rounded-xl mx-auto"
              />

              <h2 className="text-xl font-semibold mt-4">
                {fruit.name}
              </h2>

              <p className="mt-2">₹{fruit.price}</p>

              {/* ✅ THIS IS THE FIX */}
              <button
                onClick={() =>
                  addToCart({
                    name: fruit.name,
                    price: fruit.price,
                    image: fruit.image,
                  })
                }
                className="mt-4 bg-emerald-600 text-white px-5 py-2 rounded-full"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
