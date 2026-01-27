export default function WhyChoose() {
  return (
    <section className="why-choose w-full py-16 bg-white">
      <h2 className="text-4xl font-bold text-center mb-12">
        Why Choose Vit Mart?
      </h2>

      {/* GRID WRAPPER (DO NOT REMOVE) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-6">
        
        <div className="feature-card">
          <div className="icon">🌿</div>
          <h3>100% Premium & Organic</h3>
          <p>
            Exclusively sourced organic produce from certified luxury farms,
            ensuring the highest quality.
          </p>
        </div>

        <div className="feature-card">
          <div className="icon">🚚</div>
          <h3>Express Luxury Delivery</h3>
          <p>
            White-glove delivery service with premium packaging and same-day
            delivery options.
          </p>
        </div>

        <div className="feature-card">
          <div className="icon">🛡️</div>
          <h3>Premium Quality Guarantee</h3>
          <p>
            Luxury-grade quality assurance with easy returns and full
            satisfaction guarantee.
          </p>
        </div>

        <div className="feature-card">
          <div className="icon">🎧</div>
          <h3>Concierge Support</h3>
          <p>
            24/7 premium customer support with personalized assistance.
          </p>
        </div>

      </div>
    </section>
  );
}
