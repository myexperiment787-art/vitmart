"use client";

import Link from "next/link";
import { useState } from "react";

const categories = [
  {
    title: "Premium Fresh Fruits",
    desc: "Handpicked fresh fruits directly from farms.",
    image: "/categories/fruits.jpg",
    href: "/fruits",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#667eea",
    emoji: "🍎",
  },
  {
    title: "Fresh Cakes & Desserts",
    desc: "Delicious cakes for every celebration.",
    image: "/categories/cakes.jpg",
    href: "/cakes",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "#f093fb",
    emoji: "🎂",
  },
  {
    title: "Bike Rentals",
    desc: "Affordable bike rentals for daily needs.",
    image: "/categories/bike.jpg",
    href: "/bike",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    color: "#4facfe",
    emoji: "🏍️",
  },
  {
    title: "Medicine Order",
    desc: "Send prescription via WhatsApp.",
    image: "/categories/medicine.jpg",
    href: "/medicine",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    color: "#43e97b",
    emoji: "💊",
  },
];

export default function CategorySection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section 
      id="categories"
      style={{ 
        padding: "80px 40px",
        background: "linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background elements */}
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #667eea22 0%, #764ba222 100%)",
        top: "-100px",
        right: "-100px",
        filter: "blur(80px)",
      }} />
      <div style={{
        position: "absolute",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #f093fb22 0%, #f5576c22 100%)",
        bottom: "-50px",
        left: "-50px",
        filter: "blur(80px)",
      }} />

      {/* Heading */}
      <div style={{ 
        textAlign: "center", 
        marginBottom: "60px",
        position: "relative",
        zIndex: 1,
      }}>
        <h2 style={{
          fontSize: "48px",
          fontWeight: "900",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "12px",
        }}>
          🛍️ Shop by Categories
        </h2>
        <p style={{
          fontSize: "18px",
          color: "#6c757d",
          fontWeight: "500",
        }}>
          Explore our diverse range of products and services
        </p>
      </div>

      {/* Categories Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "32px",
        maxWidth: "1200px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}>
        {categories.map((cat, index) => (
          <Link key={cat.title} href={cat.href}>
            <div
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                background: "#fff",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: hoveredIndex === index 
                  ? `0 20px 40px ${cat.color}44`
                  : "0 8px 24px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: hoveredIndex === index 
                  ? "translateY(-12px) scale(1.02)" 
                  : "translateY(0) scale(1)",
                border: hoveredIndex === index 
                  ? `3px solid ${cat.color}`
                  : "3px solid transparent",
              }}
            >
              {/* Image Container with Gradient Overlay */}
              <div style={{ 
                height: "200px",
                position: "relative",
                overflow: "hidden",
              }}>
                <img
                  src={cat.image}
                  alt={cat.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.4s ease",
                    transform: hoveredIndex === index ? "scale(1.1)" : "scale(1)",
                  }}
                />
                {/* Gradient Overlay */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: hoveredIndex === index 
                    ? cat.gradient
                    : "transparent",
                  opacity: hoveredIndex === index ? 0.3 : 0,
                  transition: "opacity 0.4s ease",
                }} />
                
                {/* Floating Emoji Badge */}
                <div style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  width: "60px",
                  height: "60px",
                  background: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  transform: hoveredIndex === index ? "scale(1.2) rotate(10deg)" : "scale(1) rotate(0deg)",
                  transition: "all 0.4s ease",
                }}>
                  {cat.emoji}
                </div>
              </div>

              {/* Text Content with Gradient Background */}
              <div style={{ 
                padding: "24px",
                background: hoveredIndex === index 
                  ? `${cat.gradient}`
                  : "white",
                transition: "all 0.4s ease",
              }}>
                <h3 style={{ 
                  marginBottom: "8px",
                  fontSize: "22px",
                  fontWeight: "800",
                  color: hoveredIndex === index ? "white" : "#2d3436",
                  transition: "color 0.4s ease",
                }}>
                  {cat.title}
                </h3>
                <p style={{ 
                  fontSize: "15px",
                  color: hoveredIndex === index ? "rgba(255,255,255,0.95)" : "#636e72",
                  lineHeight: "1.6",
                  fontWeight: "500",
                  transition: "color 0.4s ease",
                }}>
                  {cat.desc}
                </p>

                {/* Animated Arrow */}
                <div style={{
                  marginTop: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: hoveredIndex === index ? "white" : cat.color,
                  fontWeight: "700",
                  fontSize: "15px",
                  transition: "all 0.3s ease",
                }}>
                  <span>Explore Now</span>
                  <span style={{
                    transform: hoveredIndex === index ? "translateX(5px)" : "translateX(0)",
                    transition: "transform 0.3s ease",
                  }}>
                    →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom decorative line */}
      <div style={{
        marginTop: "60px",
        height: "4px",
        maxWidth: "800px",
        margin: "60px auto 0",
        background: "linear-gradient(90deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #43e97b 100%)",
        borderRadius: "4px",
      }} />
    </section>
  );
}