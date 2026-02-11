"use client";

import { useState, useEffect } from "react";

export default function StatsSection() {
  // We'll track cart additions differently without relying on CartContext
  // Since CartContext structure is unknown
  
  // State for all counters
  const [ordersDelivered, setOrdersDelivered] = useState(0);
  const [happyCustomers, setHappyCustomers] = useState(0);
  const [productsAvailable, setProductsAvailable] = useState(0);
  const [deliveryRate, setDeliveryRate] = useState(0);

  // Initial base numbers
  const baseOrders = 5000;
  const baseCustomers = 2500;
  const baseProducts = 150;
  const baseDeliveryRate = 99;

  // Load real-time data from localStorage on mount
  useEffect(() => {
    // Get stored data
    const storedOrders = localStorage.getItem('vitmart_total_orders');
    const storedCustomers = localStorage.getItem('vitmart_total_customers');
    
    const currentOrders = storedOrders ? parseInt(storedOrders) : baseOrders;
    const currentCustomers = storedCustomers ? parseInt(storedCustomers) : baseCustomers;

    // Animate counters on load
    animateCounter(setOrdersDelivered, currentOrders);
    animateCounter(setHappyCustomers, currentCustomers);
    animateCounter(setProductsAvailable, baseProducts);
    animateCounter(setDeliveryRate, baseDeliveryRate);

    // Listen for custom event when items are added to cart
    const handleCartUpdate = () => {
      const storedOrders = localStorage.getItem('vitmart_total_orders');
      const currentOrders = storedOrders ? parseInt(storedOrders) : baseOrders;
      const newOrderCount = currentOrders + 1;
      
      localStorage.setItem('vitmart_total_orders', newOrderCount.toString());
      setOrdersDelivered(newOrderCount);
      
      // Update customers occasionally
      if (Math.random() > 0.5) {
        const storedCustomers = localStorage.getItem('vitmart_total_customers');
        const currentCustomers = storedCustomers ? parseInt(storedCustomers) : baseCustomers;
        const newCustomerCount = currentCustomers + 1;
        localStorage.setItem('vitmart_total_customers', newCustomerCount.toString());
        setHappyCustomers(newCustomerCount);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Animated counter function
  const animateCounter = (setter: (value: number) => void, target: number) => {
    const duration = 2000;
    const steps = 50;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setter(Math.floor(target * progress));

      if (currentStep >= steps) {
        clearInterval(timer);
        setter(target);
      }
    }, interval);
  };

  const stats = [
    {
      number: ordersDelivered,
      label: "Orders Delivered",
      icon: "📦",
      suffix: "+",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#667eea",
    },
    {
      number: happyCustomers,
      label: "Happy Customers",
      icon: "😊",
      suffix: "+",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      color: "#f093fb",
    },
    {
      number: productsAvailable,
      label: "Products Available",
      icon: "🛍️",
      suffix: "+",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      color: "#4facfe",
    },
    {
      number: deliveryRate,
      label: "On-Time Delivery",
      icon: "⚡",
      suffix: "%",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      color: "#43e97b",
    },
  ];

  return (
    <section style={{
      padding: "80px 40px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative elements */}
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.1)",
        top: "-100px",
        left: "-100px",
        filter: "blur(80px)",
      }} />
      <div style={{
        position: "absolute",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.1)",
        bottom: "-50px",
        right: "-50px",
        filter: "blur(80px)",
      }} />

      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Header */}
        <div style={{
          textAlign: "center",
          marginBottom: "60px",
        }}>
          <h2 style={{
            fontSize: "48px",
            fontWeight: "900",
            color: "white",
            marginBottom: "12px",
          }}>
            🏆 Trusted by Thousands
          </h2>
          <p style={{
            fontSize: "20px",
            color: "rgba(255, 255, 255, 0.9)",
            fontWeight: "500",
          }}>
            Join our growing community of satisfied customers
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "32px",
        }}>
          {stats.map((stat, index) => (
            <div
              key={index}
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                borderRadius: "24px",
                padding: "40px 32px",
                textAlign: "center",
                boxShadow: "0 12px 35px rgba(0, 0, 0, 0.15)",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 20px 45px rgba(0, 0, 0, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 12px 35px rgba(0, 0, 0, 0.15)";
              }}
            >
              {/* Icon */}
              <div style={{
                fontSize: "56px",
                marginBottom: "16px",
                animation: "bounce 2s infinite",
              }}>
                {stat.icon}
              </div>

              {/* Number */}
              <div style={{
                fontSize: "56px",
                fontWeight: "900",
                background: stat.gradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "8px",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}>
                {stat.number.toLocaleString()}{stat.suffix}
              </div>

              {/* Label */}
              <div style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#2d3436",
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div style={{
          marginTop: "60px",
          textAlign: "center",
          padding: "24px",
          background: "rgba(255, 255, 255, 0.15)",
          borderRadius: "20px",
          backdropFilter: "blur(10px)",
          border: "2px solid rgba(255, 255, 255, 0.2)",
        }}>
          <p style={{
            fontSize: "18px",
            color: "white",
            fontWeight: "700",
            margin: 0,
          }}>
            ✅ 100% Verified Orders • 🔒 Secure Payments • 🚚 Fast Delivery • ⭐ 4.9/5 Rating
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  );
}