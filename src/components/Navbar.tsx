"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const navButtons = [
    {
      label: "Cakes",
      href: "/cakes",
      emoji: "🎂",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      color: "#f093fb",
    },
    {
      label: "Fruits",
      href: "/fruits",
      emoji: "🍎",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#667eea",
    },
    {
      label: "Medicine",
      href: "/medicine",
      emoji: "💊",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      color: "#43e97b",
    },
    {
      label: "Bike Rental",
      href: "/bike",
      emoji: "🏍️",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      color: "#4facfe",
    },
  ];

  return (
    <nav style={{
      width: "100%",
      background: "white",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      padding: "16px 24px",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      borderBottom: "3px solid transparent",
      borderImage: "linear-gradient(90deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #43e97b 100%) 1",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        maxWidth: "1400px",
        margin: "0 auto",
        flexWrap: "wrap",
      }}>

        {/* LOGO with gradient and animation */}
        <Link href="/">
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            transition: "transform 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}>
            {/* Logo Icon */}
            <div style={{
              width: "50px",
              height: "50px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
            }}>
              🛒
            </div>
            
            {/* Logo Text */}
            <h1 style={{
              fontSize: "32px",
              fontWeight: "900",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: 0,
              letterSpacing: "1px",
            }}>
              VIT MART
            </h1>
          </div>
        </Link>

        {/* CATEGORY BUTTONS */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          justifyContent: "center",
        }}>
          {navButtons.map((btn) => (
            <Link key={btn.label} href={btn.href}>
              <button
                onMouseEnter={() => setHoveredButton(btn.label)}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  background: hoveredButton === btn.label 
                    ? btn.gradient 
                    : "white",
                  color: hoveredButton === btn.label ? "white" : "#2d3436",
                  padding: "12px 24px",
                  borderRadius: "50px",
                  border: hoveredButton === btn.label 
                    ? "none"
                    : `2px solid ${btn.color}`,
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: "700",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: hoveredButton === btn.label 
                    ? `0 8px 20px ${btn.color}44`
                    : "0 2px 8px rgba(0,0,0,0.08)",
                  transform: hoveredButton === btn.label 
                    ? "translateY(-3px) scale(1.05)" 
                    : "translateY(0) scale(1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{
                  fontSize: "20px",
                  transform: hoveredButton === btn.label ? "scale(1.2) rotate(10deg)" : "scale(1) rotate(0deg)",
                  transition: "transform 0.3s ease",
                  display: "inline-block",
                }}>
                  {btn.emoji}
                </span>
                {btn.label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}