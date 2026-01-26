export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-white mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Brand Info */}
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">
            VIT MART
          </h2>
          <p className="text-gray-300">
            Your trusted online store for quality products,
            delivered with care and convenience.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-yellow-400">
            Quick Links
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li className="hover:text-white cursor-pointer">Home</li>
            <li className="hover:text-white cursor-pointer">Products</li>
            <li className="hover:text-white cursor-pointer">Categories</li>
            <li className="hover:text-white cursor-pointer">Cart</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-yellow-400">
            Contact Info
          </h3>
          <p className="text-gray-300 mb-2">
            📞 +91 17865343
          </p>
          <p className="text-gray-300">
            ✉️ myexperiment787@gmail.com
          </p>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 text-center py-4 text-gray-400 text-sm">
        © 2025 VIT MART. All rights reserved.
      </div>
    </footer>
  );
}
