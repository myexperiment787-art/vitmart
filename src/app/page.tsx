import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import WhyChoose from "../components/WhyChoose";




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
