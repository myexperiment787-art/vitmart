"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "100% Premium & Organic",
    desc: "Exclusively sourced organic produce from certified luxury farms, ensuring the highest quality.",
    icon: "🌿",
  },
  {
    title: "Express Luxury Delivery",
    desc: "White-glove delivery service with premium packaging and same-day delivery options.",
    icon: "🚚",
  },
  {
    title: "Premium Quality Guarantee",
    desc: "Luxury-grade quality assurance with easy returns and full satisfaction guarantee.",
    icon: "🛡️",
  },
  {
    title: "Concierge Support",
    desc: "Dedicated premium customer support available 24/7 for personalized service.",
    icon: "🎧",
  },
];

export default function WhyChoose() {
  return (
    <section className="landscape-only md:block py-16 text-center">

      {/* Heading */}
      <h2 className="text-4xl font-bold mb-12">
        Why Choose <span className="text-emerald-600">Vit Mart</span>?
      </h2>

      {/* Cards Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6">
        {features.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500 flex items-center justify-center text-3xl text-white">
              {item.icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold mb-3">
              {item.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed">
              {item.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
