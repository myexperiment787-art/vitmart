"use client";

export default function WhyChoose() {
  return (
    <section className="why-choose-section">
      <h2 className="title">Why Choose Vit Mart?</h2>

      <div className="features-grid">
        <div className="feature-card fade-up">
          <div className="icon">🌿</div>
          <h3>100% Premium & Organic</h3>
          <p>
            Exclusively sourced organic produce from certified luxury farms,
            ensuring the highest quality.
          </p>
        </div>

        <div className="feature-card fade-up delay-1">
          <div className="icon">🚚</div>
          <h3>Express Luxury Delivery</h3>
          <p>
            White-glove delivery service with premium packaging and same-day
            delivery options.
          </p>
        </div>

        <div className="feature-card fade-up delay-2">
          <div className="icon">🛡️</div>
          <h3>Premium Quality Guarantee</h3>
          <p>
            Luxury-grade quality assurance with easy returns and full
            satisfaction guarantee.
          </p>
        </div>

        <div className="feature-card fade-up delay-3">
          <div className="icon">🎧</div>
          <h3>Concierge Support</h3>
          <p>24/7 premium customer support with personalized assistance.</p>
        </div>
      </div>
    </section>
  );
}
