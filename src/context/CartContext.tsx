"use client";
import { createContext, useContext, useState } from "react";

type CartItem = { name: string; price: number; image: string; quantity: number };

type CartContextType = {
  // convenience: default category cart ("default")
  cart: CartItem[];
  // get cart for a specific category
  getCart: (category?: string) => CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, category?: string) => void;
  increaseQty: (name: string, category?: string) => void;
  decreaseQty: (name: string, category?: string) => void;
  clearCart: (category?: string) => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // store carts per category
  const [carts, setCarts] = useState<Record<string, CartItem[]>>({ default: [] });
  const DEFAULT = "default";

  const getCart = (category = DEFAULT) => carts[category] || [];

  const addToCart = (item: Omit<CartItem, "quantity">, category = DEFAULT) => {
    setCarts((prev) => {
      const current = prev[category] || [];
      const existing = current.find((i) => i.name === item.name);
      const updated = existing
        ? current.map((i) => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i)
        : [...current, { ...item, quantity: 1 }];
      return { ...prev, [category]: updated };
    });
  };

  const increaseQty = (name: string, category = DEFAULT) => setCarts((prev) => {
    const current = prev[category] || [];
    const updated = current.map((i) => i.name === name ? { ...i, quantity: i.quantity + 1 } : i);
    return { ...prev, [category]: updated };
  });

  const decreaseQty = (name: string, category = DEFAULT) => setCarts((prev) => {
    const current = prev[category] || [];
    const updated = current.map((i) => i.name === name ? { ...i, quantity: i.quantity - 1 } : i).filter((i) => i.quantity > 0);
    return { ...prev, [category]: updated };
  });

  const clearCart = (category = DEFAULT) => setCarts((prev) => ({ ...prev, [category]: [] }));

  return (
    <CartContext.Provider value={{ cart: getCart(), getCart, addToCart, increaseQty, decreaseQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};