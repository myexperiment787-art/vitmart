"use client";

import Image from "next/image";
import { useState } from "react";
import TopBanner from "../../components/TopBanner";
import { useCart } from "../../context/CartContext";

export default function FruitsPage() {
  const { addToCart } = useCart();
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  const fruits = [
    {
      name: "Apple 500 g",
      price: 120,
      image: "/fruits/apple.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)",
      accentColor: "#e17055",
    },
    {
      name: "Banana 1Kg",
      price: 60,
      image: "/fruits/banana.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #fff9e6 0%, #ffe066 100%)",
      accentColor: "#f39c12",
    },
    {
      name: "Orange 500g",
      price: 80,
      image: "/fruits/orange.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #ffe8cc 0%, #ffb366 100%)",
      accentColor: "#e67e22",
    },
    {
      name: "Strawberry 100g",
      price: 130,
      image: "/fruits/Strawberry.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #ffe0e6 0%, #ff99ac 100%)",
      accentColor: "#e74c3c",
    },
    {
      name: "Grape Green 250g",
      price: 80,
      image: "/fruits/Grape.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #e8f8e8 0%, #a3d9a5 100%)",
      accentColor: "#27ae60",
    },
    {
      name: "Pineapple 1Kg",
      price: 150,
      image: "/fruits/Pineapple.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #fff4cc 0%, #ffdc5e 100%)",
      accentColor: "#f39c12",
    },
    {
      name: "Guava 1kg",
      price: 90,
      image: "/fruits/Guava.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #e8ffe8 0%, #b3ffb3 100%)",
      accentColor: "#2ecc71",
    },
    {
      name: "Big Lemon 4 Piece",
      price: 30,
      image: "/fruits/Big Lemon.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #ffffcc 0%, #ffff66 100%)",
      accentColor: "#f1c40f",
    },
    {
      name: "Onions 500 Gm",
      price: 50,
      image: "/fruits/Onions.jpg",
      inStock: false,
      bgGradient: "linear-gradient(135deg, #ffe6f0 0%, #ffb3d9 100%)",
      accentColor: "#e84393",
    },
    {
      name: "Tomatoes 500 Gm",
      price: 50,
      image: "/fruits/Tomatoes.jpg",
      inStock: false,
      bgGradient: "linear-gradient(135deg, #ffe6f0 0%, #ffb3d9 100%)",
      accentColor: "#e84393",
    },
    {
      name: "Big Kiwi",
      price: 150,
      image: "/fruits/Big Kiwi.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #ccffcc 0%, #66ff99 100%)",
      accentColor: "#16a085",
    },
    {
      name: "Dragon Fruit",
      price: 130,
      image: "/fruits/Dragon Fruit.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #ffe6f0 0%, #ffb3d9 100%)",
      accentColor: "#e84393",
    },
    {
      name: "Black Grape 500g",
      price: 140,
      image: "/fruits/Black Grape.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #e6ccff 0%, #b366ff 100%)",
      accentColor: "#9b59b6",
    },
    {
      name: "Coconut Water",
      price: 100,
      image: "/fruits/Coconut.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #f0f0f0 0%, #d9d9d9 100%)",
      accentColor: "#95a5a6",
    },
    {
      name: "Dates PER Packet",
      price: 100,
      image: "/fruits/Dates.jpg",
      inStock: true,
      bgGradient: "linear-gradient(135deg, #ffe6cc 0%, #ffb366 100%)",
      accentColor: "#d35400",
    },
  ];

  const getQuantity = (fruitName: string) => quantities[fruitName] || 0;

  const updateQuantity = (fruitName: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[fruitName] || 0;
      const newQty = Math.max(0, current + delta);
      return { ...prev, [fruitName]: newQty };
    });
  };

  const handleAddToCart = (fruit: typeof fruits[0]) => {
    const qty = getQuantity(fruit.name);
    if (qty > 0) {
      for (let i = 0; i < qty; i++) {
        addToCart({
          name: fruit.name,
          price: fruit.price,
          image: fruit.image,
        });
      }
      setQuantities((prev) => ({ ...prev, [fruit.name]: 0 }));
      
      // Trigger stats counter update
      console.log('🚀 Dispatching cartUpdated event from fruits page');
      window.dispatchEvent(new Event('cartUpdated'));
    } else {
      console.log('⚠️ Quantity is 0, cannot add to cart');
    }
  };

  return (
    <>
      <TopBanner />

      <div style={{
        background: 'linear-gradient(180deg, #fff 0%, #f8f9fa 100%)',
        minHeight: '100vh',
        padding: '48px 24px',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header with gradient text */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '12px',
            }}>
              🍎 Fresh Fruits
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#6c757d',
              fontWeight: '500',
            }}>
              Handpicked fresh fruits delivered to your doorstep
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '28px',
          }}>
            {fruits.map((fruit) => (
              <div
                key={fruit.name}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '28px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  border: '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = fruit.accentColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {/* Stock Badge */}
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', 
                    top: '20px', 
                    right: '20px', 
                    zIndex: 10 
                  }}>
                    {fruit.inStock ? (
                      <span style={{
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '8px 16px',
                        borderRadius: '25px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        boxShadow: '0 4px 15px rgba(56, 239, 125, 0.3)',
                      }}>
                        ✓ IN STOCK
                      </span>
                    ) : (
                      <span style={{
                        background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '8px 16px',
                        borderRadius: '25px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        boxShadow: '0 4px 15px rgba(238, 9, 121, 0.3)',
                      }}>
                        OUT OF STOCK
                      </span>
                    )}
                  </div>

                  {/* Fruit Image with colorful gradient background */}
                  <div style={{
                    height: '320px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: fruit.bgGradient,
                    padding: '32px',
                    position: 'relative',
                  }}>
                    <Image
                      src={fruit.image}
                      alt={fruit.name}
                      width={300}
                      height={300}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.15))',
                      }}
                    />
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '24px' }}>
                  {/* Fruit Name */}
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#2d3436',
                    marginBottom: '10px',
                    minHeight: '50px',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {fruit.name}
                  </h2>

                  {/* Price with gradient background */}
                  <div style={{
                    display: 'inline-block',
                    background: `linear-gradient(135deg, ${fruit.accentColor}22 0%, ${fruit.accentColor}44 100%)`,
                    padding: '8px 16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                  }}>
                    <p style={{
                      fontSize: '28px',
                      fontWeight: '800',
                      color: fruit.accentColor,
                      margin: 0,
                    }}>
                      ₹{fruit.price}
                    </p>
                  </div>

                  {/* Quantity and Add to Cart */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px' 
                  }}>
                    {/* Quantity Controls */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      background: '#f8f9fa',
                      padding: '6px 12px',
                      borderRadius: '50px',
                    }}>
                      <button
                        onClick={() => updateQuantity(fruit.name, -1)}
                        disabled={!fruit.inStock}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          border: `2px solid ${fruit.accentColor}33`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          fontWeight: '700',
                          color: fruit.accentColor,
                          cursor: fruit.inStock ? 'pointer' : 'not-allowed',
                          opacity: fruit.inStock ? 1 : 0.4,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (fruit.inStock) {
                            e.currentTarget.style.backgroundColor = fruit.accentColor;
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.color = fruit.accentColor;
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        −
                      </button>
                      <span style={{
                        width: '40px',
                        textAlign: 'center',
                        fontWeight: '800',
                        fontSize: '20px',
                        color: '#2d3436',
                      }}>
                        {getQuantity(fruit.name)}
                      </span>
                      <button
                        onClick={() => updateQuantity(fruit.name, 1)}
                        disabled={!fruit.inStock}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          border: `2px solid ${fruit.accentColor}33`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          fontWeight: '700',
                          color: fruit.accentColor,
                          cursor: fruit.inStock ? 'pointer' : 'not-allowed',
                          opacity: fruit.inStock ? 1 : 0.4,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (fruit.inStock) {
                            e.currentTarget.style.backgroundColor = fruit.accentColor;
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.color = fruit.accentColor;
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart Button with gradient */}
                    <button
                      onClick={() => handleAddToCart(fruit)}
                      disabled={!fruit.inStock || getQuantity(fruit.name) === 0}
                      style={{
                        flex: 1,
                        background: fruit.inStock && getQuantity(fruit.name) > 0 
                          ? `linear-gradient(135deg, ${fruit.accentColor} 0%, ${fruit.accentColor}dd 100%)`
                          : '#d1d5db',
                        color: 'white',
                        fontWeight: '800',
                        padding: '14px 20px',
                        borderRadius: '50px',
                        border: 'none',
                        fontSize: '15px',
                        cursor: fruit.inStock && getQuantity(fruit.name) > 0 ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: fruit.inStock && getQuantity(fruit.name) > 0 
                          ? `0 4px 15px ${fruit.accentColor}44` 
                          : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (fruit.inStock && getQuantity(fruit.name) > 0) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 6px 20px ${fruit.accentColor}66`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        if (fruit.inStock && getQuantity(fruit.name) > 0) {
                          e.currentTarget.style.boxShadow = `0 4px 15px ${fruit.accentColor}44`;
                        }
                      }}
                    >
                      {!fruit.inStock ? "Out of Stock" : "🛒 Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}