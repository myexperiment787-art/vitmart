import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import WhyChoose from "../components/WhyChoose";
import Hero from "../components/Hero";
import Link from "next/link";




const products = [
  { name: "Smart Watch", price: 49 },
  { name: "Headphones", price: 29 },
  { name: "Shoes", price: 59 },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p, i) => (
          <ProductCard key={i} name={p.name} price={p.price} />
        ))}
      </div>

      <WhyChoose />


      
    </>
  );
}

<Link href="/cakes">
  <button className="px-4 py-2 bg-pink-600 text-white rounded-full">
    🎂 Cakes
  </button>
</Link>


