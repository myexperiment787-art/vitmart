import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full h-[75vh] flex items-center justify-center overflow-hidden">
      
      {/* BACKGROUND IMAGE */}
      <Image
        src="/hero/hero-banner.jpg"   // keep your existing image
        alt="VitMart Hero"
        fill
        priority
        className="object-cover"
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* CONTENT */}
      <div className="relative z-10 text-center px-6 max-w-3xl">
        
        {/* BUTTON */}
        <Link href="#categories">
          <button 
          style={{
            marginTop: "354px",
            padding: "48px 180px",
            fontSize: "30px",
            borderRadius: "999px",
            background: "#ffffff",
            color: "#7c3aed",
            fontWeight: "600",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          }}
        >  
            Explore Collection
          </button>
        </Link>
      </div>
    </section>
  );
}
