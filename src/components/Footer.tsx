export default function Footer() {
  return (
    <footer className="bg-black text-white px-6 py-12 mt-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
        
        {/* BRAND */}
        <div>
          <h2 className="text-2xl font-bold mb-3">VIT MART</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your trusted online store for quality products,
            delivered with care and convenience.
          </p>
        </div>

        {/* LINKS */}
        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>Home</li>
            <li>Products</li>
            <li>Categories</li>
            <li>Cart</li>
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h3 className="font-semibold mb-3">Contact Info</h3>
          <p className="text-gray-400 text-sm">📞 +91 9117865343</p>
          <p className="text-gray-400 text-sm">✉️ support@vitmart.com</p>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-500 text-sm">
        © 2025 VIT MART. All rights reserved.
      </div>
    </footer>
  );
}
