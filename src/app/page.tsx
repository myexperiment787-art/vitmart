import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import CategorySection from "../components/CategorySection";
import ProductCard from "../components/ProductCard";
import WhyChoose from "../components/WhyChoose";
import Statssection from "../components/Statssection";


export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Statssection />
      {/* CATEGORY SECTION */}
      <CategorySection />

      {/* PRODUCTS */}
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
      </div>

      <WhyChoose />
    </>
  );
}
