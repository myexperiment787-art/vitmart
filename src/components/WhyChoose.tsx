"use client";

import { useState } from "react";
import Link from "next/link";

export default function WhyChoose() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const features = [
    {
      icon: "🌿",
      title: "100% Premium & Organic",
      description: "Exclusively sourced organic produce from certified luxury farms, ensuring the highest quality.",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#667eea",
    },
    {
      icon: "🚚",
      title: "Express Luxury Delivery",
      description: "White-glove delivery service with premium packaging and same-day delivery options.",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      color: "#f093fb",
    },
    {
      icon: "🛡️",
      title: "Premium Quality Guarantee",
      description: "Luxury-grade quality assurance with easy returns and full satisfaction guarantee.",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      color: "#4facfe",
    },
    {
      icon: "🎧",
      title: "Concierge Support",
      description: "24/7 premium customer support with personalized assistance.",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      color: "#43e97b",
    },
  ];

  return (
    <section style={{
      padding: "80px 40px",
      background: "linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative background */}
      <div style={{
        position: "absolute",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #667eea11 0%, #764ba211 100%)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        filter: "blur(100px)",
      }} />

      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Title */}
        <div style={{
          textAlign: "center",
          marginBottom: "60px",
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
            ✨ Why Choose Vit Mart?
          </h2>
          <p style={{
            fontSize: "18px",
            color: "#6c757d",
            fontWeight: "500",
          }}>
            Experience the difference with our premium services
          </p>
        </div>

        {/* Features Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "32px",
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: "white",
                borderRadius: "24px",
                padding: "40px 32px",
                textAlign: "center",
                boxShadow: hoveredCard === index
                  ? `0 20px 40px ${feature.color}44`
                  : "0 8px 24px rgba(0,0,0,0.08)",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: hoveredCard === index 
                  ? "translateY(-12px) scale(1.02)" 
                  : "translateY(0) scale(1)",
                border: hoveredCard === index 
                  ? `3px solid ${feature.color}`
                  : "3px solid transparent",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Background gradient effect */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: feature.gradient,
                opacity: hoveredCard === index ? 0.05 : 0,
                transition: "opacity 0.4s ease",
              }} />

              {/* Icon */}
              <div style={{
                width: "80px",
                height: "80px",
                margin: "0 auto 24px",
                background: hoveredCard === index 
                  ? feature.gradient
                  : `${feature.color}22`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                transition: "all 0.4s ease",
                transform: hoveredCard === index ? "scale(1.15) rotate(10deg)" : "scale(1) rotate(0deg)",
                boxShadow: hoveredCard === index 
                  ? `0 12px 30px ${feature.color}44`
                  : "0 4px 15px rgba(0,0,0,0.08)",
                position: "relative",
                zIndex: 1,
              }}>
                {feature.icon}
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: "22px",
                fontWeight: "800",
                marginBottom: "16px",
                color: hoveredCard === index ? feature.color : "#2d3436",
                transition: "color 0.4s ease",
                position: "relative",
                zIndex: 1,
              }}>
                {feature.title}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: "15px",
                lineHeight: "1.7",
                color: "#636e72",
                fontWeight: "500",
                position: "relative",
                zIndex: 1,
              }}>
                {feature.description}
              </p>

              {/* Decorative corner element */}
              <div style={{
                position: "absolute",
                bottom: "-20px",
                right: "-20px",
                width: "100px",
                height: "100px",
                background: feature.gradient,
                borderRadius: "50%",
                opacity: hoveredCard === index ? 0.15 : 0,
                transition: "opacity 0.4s ease",
                filter: "blur(30px)",
              }} />
            </div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div style={{
          marginTop: "60px",
          textAlign: "center",
          padding: "40px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "24px",
          boxShadow: "0 12px 35px rgba(102, 126, 234, 0.3)",
        }}>
          <h3 style={{
            fontSize: "28px",
            fontWeight: "800",
            color: "white",
            marginBottom: "12px",
          }}>
            Ready to Experience Premium Quality? 🎉
          </h3>
          <p style={{
            fontSize: "16px",
            color: "rgba(255, 255, 255, 0.9)",
            marginBottom: "24px",
          }}>
            Join thousands of satisfied customers who trust Vit Mart
          </p>
          <Link href="/#categories">
            <button style={{
              background: "white",
              color: "#667eea",
              padding: "16px 40px",
              borderRadius: "50px",
              border: "none",
              fontSize: "18px",
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
            }}>
              🛍️ Start Shopping Now
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}