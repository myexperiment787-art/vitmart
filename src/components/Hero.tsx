import Image from "next/image";

export default function Hero() {
  return (
    <section
      className="
        relative w-full
        min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh]
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
        className="object-cover object-center"
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/40" />

      {/* CONTENT */}
      <div className="relative z-10 text-center px-4 max-w-3xl">
        

        
      </div>
    </section>
  );
}
