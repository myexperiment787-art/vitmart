"use client";

import Image from "next/image";
import { useState } from "react";

export default function BikeRentPage() {
  const [hoveredBike, setHoveredBike] = useState<string | null>(null);

  const bikes = [
    {
      name: "PULSER NS 200",
      price: 1200,
      image: "/bikes/PULSERNS200.jpg",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      color: "#f093fb",
    },
    {
      name: "Scooty",
      price: 350,
      image: "/bikes/scooty.jpg",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      color: "#f093fb",
    },
    {
      name: "Passion Pro",
      price: 350,
      image: "/bikes/passion-pro.jpg",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#667eea",
    },
    {
      name: "Platina",
      price: 350,
      image: "/bikes/platina.jpg",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      color: "#4facfe",
    },
    {
      name: "Pulsar",
      price: 500,
      image: "/bikes/pulsar.jpg",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      color: "#fa709a",
    },
  ];

  const whatsappNumber = "919630741753";

  return (
    <div style={{
      padding: "80px 24px",
      background: "linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)",
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4facfe22 0%, #00f2fe22 100%)",
        top: "-100px",
        right: "-100px",
        filter: "blur(80px)",
      }} />
      <div style={{
        position: "absolute",
        width: "350px",
        height: "350px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #f093fb22 0%, #f5576c22 100%)",
        bottom: "-100px",
        left: "-100px",
        filter: "blur(80px)",
      }} />

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Header */}
        <div style={{
          textAlign: "center",
          marginBottom: "60px",
        }}>
          <div style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            padding: "12px 32px",
            borderRadius: "50px",
            marginBottom: "16px",
            boxShadow: "0 8px 25px rgba(79, 172, 254, 0.3)",
          }}>
            <h1 style={{
              fontSize: "42px",
              fontWeight: "900",
              color: "white",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              🏍️ Bike Rental – 24 Hours
            </h1>
          </div>
          <p style={{
            fontSize: "18px",
            color: "#6c757d",
            fontWeight: "500",
            marginTop: "12px",
          }}>
            Affordable bike rentals for your daily commute
          </p>
        </div>

        {/* Bikes Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "32px",
        }}>
          {bikes.map((bike) => (
            <div
              key={bike.name}
              onMouseEnter={() => setHoveredBike(bike.name)}
              onMouseLeave={() => setHoveredBike(null)}
              style={{
                background: "white",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: hoveredBike === bike.name 
                  ? `0 20px 40px ${bike.color}44`
                  : "0 8px 24px rgba(0,0,0,0.1)",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: hoveredBike === bike.name 
                  ? "translateY(-12px) scale(1.02)" 
                  : "translateY(0) scale(1)",
                border: hoveredBike === bike.name 
                  ? `3px solid ${bike.color}`
                  : "3px solid transparent",
              }}
            >
              {/* BIKE IMAGE with gradient overlay */}
              <div style={{
                position: "relative",
                width: "100%",
                height: "250px",
                overflow: "hidden",
              }}>
                <Image
                  src={bike.image}
                  alt={bike.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{
                    objectFit: "cover",
                    transition: "transform 0.4s ease",
                    transform: hoveredBike === bike.name ? "scale(1.1)" : "scale(1)",
                  }}
                  priority
                />
                {/* Gradient Overlay */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: hoveredBike === bike.name 
                    ? bike.gradient
                    : "transparent",
                  opacity: hoveredBike === bike.name ? 0.3 : 0,
                  transition: "opacity 0.4s ease",
                }} />

                {/* "24 Hours" Badge */}
                <div style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "white",
                  padding: "8px 16px",
                  borderRadius: "50px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  fontWeight: "700",
                  fontSize: "13px",
                  color: bike.color,
                }}>
                  ⏰ 24 Hours
                </div>
              </div>

              {/* BIKE DETAILS */}
              <div style={{
                padding: "24px",
                textAlign: "center",
              }}>
                <h2 style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  marginBottom: "8px",
                  color: "#2d3436",
                }}>
                  {bike.name}
                </h2>

                {/* Price Badge */}
                <div style={{
                  display: "inline-block",
                  background: `${bike.gradient}`,
                  padding: "10px 24px",
                  borderRadius: "50px",
                  marginBottom: "20px",
                  boxShadow: `0 4px 15px ${bike.color}44`,
                }}>
                  <p style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    color: "white",
                    margin: 0,
                  }}>
                    ₹{bike.price} / 24 Hours
                  </p>
                </div>

                {/* WhatsApp Button */}
                <a
                  href={`https://wa.me/${whatsappNumber}?text=Hello,%20I%20want%20to%20rent%20${bike.name}%20for%2024%20hours`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-button"
                  onClick={() => {
                    // Trigger stats counter update
                    window.dispatchEvent(new Event('cartUpdated'));
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                    color: "white",
                    padding: "14px 32px",
                    borderRadius: "50px",
                    fontSize: "16px",
                    fontWeight: "800",
                    textDecoration: "none",
                    transition: "all 0.3s ease",
                    boxShadow: "0 6px 20px rgba(37, 211, 102, 0.4)",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>📲</span>
                  Book on WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Info Section */}
        <div style={{
          marginTop: "60px",
          textAlign: "center",
          padding: "32px",
          background: "white",
          borderRadius: "24px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}>
          <h3 style={{
            fontSize: "24px",
            fontWeight: "800",
            marginBottom: "16px",
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Why Choose Our Bike Rental? 🏍️
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
            marginTop: "24px",
          }}>
            {[
              { emoji: "⚡", text: "Instant Booking" },
              { emoji: "💰", text: "Best Prices" },
              { emoji: "🔧", text: "Well Maintained" },
              { emoji: "🛡️", text: "Fully Insured" },
            ].map((feature, index) => (
              <div key={index} style={{
                padding: "16px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
              }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>{feature.emoji}</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#2d3436" }}>
                  {feature.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .whatsapp-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(37, 211, 102, 0.5) !important;
        }
      `}</style>
    </div>
  );
}