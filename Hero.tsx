"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./Hero.module.css";

const slides = [
  {
    eyebrow: "FRESH PICKS • DAILY DELIVERY",
    title: "Freshness delivered to your doorstep.",
    description:
      "Shop colourful, hand-picked fruits for everyday snacking and family meals.",
    buttonLabel: "Shop fresh fruits",
    href: "/fruits",
    images: [
      { src: "/fruits/Mango.jpg", alt: "Fresh mangoes" },
      { src: "/fruits/Strawberry.jpg", alt: "Fresh strawberries" },
      { src: "/fruits/Watermelon.jpg", alt: "Fresh watermelon" },
    ],
    offer: "Fresh today",
    background:
      "linear-gradient(115deg, #095c45 0%, #0e8f62 55%, #8bd450 100%)",
  },
  {
    eyebrow: "HOT, TASTY & READY TO ORDER",
    title: "Your cravings just found a shortcut.",
    description:
      "From momos to street-food favourites, discover something delicious in a few taps.",
    buttonLabel: "Explore food",
    href: "/food",
    images: [
      { src: "/food/pannermomo.jpg", alt: "A plate of paneer momos" },
      { src: "/food/chillipotato.jpg", alt: "A plate of chilli potato" },
      { src: "/food/Manchurian.jpg", alt: "A plate of Manchurian" },
    ],
    offer: "Order now",
    background:
      "linear-gradient(115deg, #8d220d 0%, #e34b17 54%, #ffb326 100%)",
  },
  {
    eyebrow: "CAR RENTAL • 24 HOURS",
    title: "A comfortable car for every journey.",
    description:
      "Choose from reliable hatchbacks and SUVs for family trips, business travel, and daily plans.",
    buttonLabel: "Rent a car",
    href: "/car",
    images: [
      {
        src: "/cars/baleno-delta-petrol-cng.jpg",
        alt: "Baleno rental car",
      },
      { src: "/cars/creta-petrol.jpg", alt: "Creta rental car" },
      { src: "/cars/exter-cng.jpg", alt: "Exter rental car" },
    ],
    offer: "From ₹3000",
    background:
      "linear-gradient(115deg, #182235 0%, #33466b 54%, #d4872b 100%)",
  },
  {
    eyebrow: "BIKE RENTAL • 24 HOURS",
    title: "A ready ride for wherever today takes you.",
    description:
      "Choose an affordable bike, book on WhatsApp, and enjoy the freedom of the road.",
    buttonLabel: "Rent a bike",
    href: "/bike",
    images: [
      { src: "/bikes/PULSERNS200.jpg", alt: "Pulsar NS 200 rental bike" },
      { src: "/bikes/scooty.jpg", alt: "Scooty available for rent" },
      { src: "/bikes/passion-pro.jpg", alt: "Passion Pro rental bike" },
    ],
    offer: "From ₹450",
    background:
      "linear-gradient(115deg, #14213d 0%, #2555a6 55%, #29b6f6 100%)",
  },
  {
    eyebrow: "CELEBRATE EVERY LITTLE MOMENT",
    title: "Sweet cakes for your happiest occasions.",
    description:
      "Pick a classic flavour for birthdays, surprises, and the days that deserve a treat.",
    buttonLabel: "Browse cakes",
    href: "/cakes",
    images: [
      { src: "/cakes/chocolate.jpg", alt: "Chocolate celebration cake" },
      { src: "/cakes/redvelvet.jpg", alt: "Red velvet celebration cake" },
      { src: "/cakes/vanilla.jpg", alt: "Vanilla celebration cake" },
    ],
    offer: "Made with love",
    background:
      "linear-gradient(115deg, #562044 0%, #a73871 54%, #f27faf 100%)",
  },
];

const AUTOPLAY_DELAY = 5000;

export default function HeroBanner() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slide = slides[activeSlide];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (isPaused || prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, AUTOPLAY_DELAY);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  const showPrevious = () => {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  };

  const showNext = () => {
    setActiveSlide((current) => (current + 1) % slides.length);
  };

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label="Quick Mart offers"
      tabIndex={0}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") showPrevious();
        if (event.key === "ArrowRight") showNext();
      }}
    >
      <div className={styles.track}>
        <article
          className={styles.slide}
          style={{ background: slide.background }}
          aria-roledescription="slide"
          aria-label={`${activeSlide + 1} of ${slides.length}`}
          key={slide.title}
        >
          <div className={styles.glowOne} />
          <div className={styles.glowTwo} />

          <div className={styles.content}>
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h1>{slide.title}</h1>
            <p className={styles.description}>{slide.description}</p>
            <Link className={styles.cta} href={slide.href}>
              {slide.buttonLabel}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className={styles.visual} aria-hidden="true">
            <div className={styles.imageHalo} />
            {slide.images.map((image, imageIndex) => (
              <div
                className={`${styles.imageCard} ${
                  styles[`imageCard${imageIndex + 1}`]
                }`}
                key={image.src}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 720px) 45vw, 22vw"
                  className={styles.productImage}
                  priority={activeSlide === 0 && imageIndex === 0}
                />
              </div>
            ))}
            <span className={styles.offer}>{slide.offer}</span>
          </div>
        </article>
      </div>

      <button
        className={`${styles.arrow} ${styles.previous}`}
        type="button"
        aria-label="Show previous offer"
        onClick={showPrevious}
      >
        ‹
      </button>
      <button
        className={`${styles.arrow} ${styles.next}`}
        type="button"
        aria-label="Show next offer"
        onClick={showNext}
      >
        ›
      </button>

      <div className={styles.dots} aria-label="Choose an offer">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            className={`${styles.dot} ${
              index === activeSlide ? styles.activeDot : ""
            }`}
            aria-label={`Show offer ${index + 1}: ${slide.buttonLabel}`}
            aria-current={index === activeSlide ? "true" : undefined}
            onClick={() => setActiveSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}
