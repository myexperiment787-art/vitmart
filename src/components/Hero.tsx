import Image from "next/image";

export default function Hero() {
  return (
    <section
      className="
        relative w-full 
        h-[45vh] sm:h-[60vh] md:h-[75vh]
        flex items-center justify-center
        overflow-hidden
      "
    >
      {/* BACKGROUND IMAGE */}
      <Image
        src="/hero/hero-banner.jpg"
        alt="VitMart Hero"
        fill
        priority
        className="
          object-cover
          object-center
        "
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* CONTENT */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl">
        
      </div>
    </section>
  );
}
