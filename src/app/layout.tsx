import "./globals.css";
import Footer from "../components/Footer";
import { CartProvider } from "../context/CartContext";
import FloatingCart from "../components/FloatingCart";

export const metadata = {
  title: "Quick Mart",
  description: "Quick Mart - rent, deliver, serve.",
};

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
