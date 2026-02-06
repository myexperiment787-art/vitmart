import "./globals.css";
import Footer from "../components/Footer";
import { CartProvider } from "../context/CartContext";
import FloatingCart from "../components/FloatingCart";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative overflow-x-hidden">
        <CartProvider>
          {children}

          {/* Floating cart should be ABOVE footer visually */}
          <FloatingCart />

          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
