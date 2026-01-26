export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-black text-white">
      <h1 className="text-2xl font-bold">VIT MART</h1>
      <div className="flex gap-6 text-lg">
        <a href="/" className="hover:text-gray-300">Home</a>
        <a href="/cart" className="hover:text-gray-300">Cart</a>
      </div>
    </nav>
  );
}
