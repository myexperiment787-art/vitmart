import ProductCard from "../components/ProductCard";

const products = [
  { name: "Smart Watch", price: 49 },
  { name: "Headphones", price: 29 },
  { name: "Shoes", price: 59 },
];

export default function Home() {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map((p, i) => (
        <ProductCard key={i} name={p.name} price={p.price} />
      ))}
    </div>
  );
}
