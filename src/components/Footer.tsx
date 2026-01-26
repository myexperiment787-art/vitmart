export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#0f172a] to-[#020617] text-white mt-20">
      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">

        {/* Brand */}
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">
            VIT MART
          </h2>
          <p className="text-gray-200 leading-relaxed">
            Your trusted online store for quality products,
            delivered with care and convenience.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">
            Quick Links
          </h3>
          <ul className="space-y-3 text-gray-200">
            <li className="hover:text-white cursor-pointer">Home</li>
            <li className="hover:text-white cursor-pointer">Products</li>
            <li className="hover:text-white cursor-pointer">Categories</li>
            <li className="hover:text-white cursor-pointer">Cart</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">
            Contact Info
          </h3>
          <p className="mb-3 flex items-center gap-2 text-gray-200">
            📞 <span>+91 9117865343</span>
          </p>
          <p className="flex items-center gap-2 text-gray-200">
            ✉️ <span>myexperiment787@gmail.com</span>
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-700 py-6 text-center text-sm text-gray-300">
        © 2025 VIT MART. All rights reserved.
      </div>
    </footer>
  );
}
