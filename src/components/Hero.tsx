"use client";

import Link from "next/link";
import { useState } from "react";

export default function HeroBanner() {
  const [hoveredButton, setHoveredButton] = useState(false);

  return (
    <section style={{
      position: "relative",
      minHeight: "600px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
      padding: "80px 24px",
    }}>
      {/* Animated background elements */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.1)",
        top: "-200px",
        right: "-200px",
        animation: "float 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.08)",
        bottom: "-150px",
        left: "-150px",
        animation: "float 6s ease-in-out infinite",
        animationDelay: "1s",
      }} />
      <div style={{
        position: "absolute",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.06)",
        top: "50%",
        left: "10%",
        animation: "float 7s ease-in-out infinite",
        animationDelay: "2s",
      }} />

      {/* Content */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Small badge */}
        <div style={{
          display: "inline-block",
          background: "rgba(255, 255, 255, 0.2)",
          padding: "8px 20px",
          borderRadius: "50px",
          marginBottom: "24px",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          animation: "fadeInDown 1s ease",
        }}>
          <span style={{
            color: "white",
            fontSize: "14px",
            fontWeight: "700",
            letterSpacing: "1px",
          }}>
            🎉 FREE DELIVERY ON ORDERS ABOVE ₹199
          </span>
        </div>

        {/* Main heading */}
        <h1 style={{
          fontSize: "72px",
          fontWeight: "900",
          color: "white",
          marginBottom: "24px",
          lineHeight: "1.2",
          animation: "fadeInUp 1s ease",
          textShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
        }}>
          Welcome to <br />
          <span style={{
            background: "linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            VitMart
          </span>
        </h1>

        {/* Subheading */}
        <p style={{
          fontSize: "24px",
          color: "rgba(255, 255, 255, 0.95)",
          marginBottom: "48px",
          maxWidth: "800px",
          margin: "0 auto 48px",
          lineHeight: "1.6",
          fontWeight: "500",
          animation: "fadeInUp 1.2s ease",
        }}>
          Your Premium Destination for Fresh Fruits & Luxury Groceries
        </p>

        {/* Buttons */}
        <div style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          flexWrap: "wrap",
          animation: "fadeInUp 1.4s ease",
        }}>
          {/* Primary button */}
          <Link href="/#categories">
            <button
              onMouseEnter={() => setHoveredButton(true)}
              onMouseLeave={() => setHoveredButton(false)}
              style={{
                background: "white",
                color: "#667eea",
                padding: "18px 48px",
                borderRadius: "50px",
                border: "none",
                fontSize: "18px",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: hoveredButton 
                  ? "0 12px 35px rgba(0, 0, 0, 0.3)"
                  : "0 8px 25px rgba(0, 0, 0, 0.2)",
                transition: "all 0.3s ease",
                transform: hoveredButton ? "translateY(-4px) scale(1.05)" : "translateY(0) scale(1)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "24px" }}>🛍️</span>
              Explore Collection
            </button>
          </Link>

          {/* Secondary button */}
          <Link href="/fruits">
            <button style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "white",
              padding: "18px 48px",
              borderRadius: "50px",
              border: "2px solid rgba(255, 255, 255, 0.4)",
              fontSize: "18px",
              fontWeight: "800",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.transform = "translateY(0)";
            }}>
              <span style={{ fontSize: "24px" }}>🍎</span>
              Shop Fresh Fruits
            </button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div style={{
          marginTop: "60px",
          display: "flex",
          justifyContent: "center",
          gap: "48px",
          flexWrap: "wrap",
          animation: "fadeInUp 1.6s ease",
        }}>
          {[
            { icon: "✓", text: "100% Fresh" },
            { icon: "🚚", text: "Fast Delivery" },
            { icon: "💰", text: "Best Price" },
            { icon: "⭐", text: "50+ Orders" },
          ].map((item, index) => (
            <div key={index} style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "white",
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "800",
                backdropFilter: "blur(10px)",
              }}>
                {item.icon}
              </div>
              <span style={{ fontWeight: "700", fontSize: "16px" }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(5deg);
          }
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 48px !important;
          }
          p {
            font-size: 18px !important;
          }
        }
      `}</style>
    </section>
  );
}