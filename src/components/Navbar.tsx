export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 bg-black text-white">
      <h1 className="text-xl font-bold">VITMART</h1>
      <div className="space-x-4">
        <a href="/">Home</a>
        <a href="/cart">Cart</a>
      </div>
    </nav>
  );
}
