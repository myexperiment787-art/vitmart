import Link from "next/link";

const categories = [
  {
    title: "Premium Fresh Fruits",
    desc: "Handpicked fresh fruits directly from farms.",
    image: "/categories/fruits.jpg",
    href: "/fruits",
  },
  {
    title: "Fresh Cakes & Desserts",
    desc: "Delicious cakes for every celebration.",
    image: "/categories/cakes.jpg",
    href: "/cakes",
  },
  {
    title: "Bike Rentals",
    desc: "Affordable bike rentals for daily needs.",
    image: "/categories/bike.jpg",
    href: "/bike",
  },
  {
    title: "Medicine Order",
    desc: "Send prescription via WhatsApp.",
    image: "/categories/medicine.jpg",
    href: "/medicine",
  },
];

export default function CategorySection() {
  return (
    <section style={{ padding: "40px", background: "#f5f5f5" }}>
      <h2
        style={{
          textAlign: "center",
          fontSize: "28px",
          marginBottom: "40px",
        }}
      >
        Shop by Categories
      </h2>

      <div
        style={{
          display: "flex",
          gap: "24px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {categories.map((cat) => (
          <Link key={cat.title} href={cat.href}>
            <div
              style={{
                width: "250px",
                background: "#fff",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                cursor: "pointer",
              }}
            >
              {/* IMAGE */}
              <div style={{ height: "150px" }}>
                <img
                  src={cat.image}
                  alt={cat.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* TEXT */}
              <div style={{ padding: "16px", textAlign: "center" }}>
                <h3 style={{ marginBottom: "8px" }}>{cat.title}</h3>
                <p style={{ fontSize: "14px", color: "#555" }}>
                  {cat.desc}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
