export default function MedicinePage() {
  const whatsappNumber = "919630741753";
  const message =
    "Hello Vit Mart, I want to order medicine. Please find my prescription attached.";

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-6">

        {/* ✅ TOP TRUST / LEGAL NOTICE */}
        <h2 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-3">
          GET UPTO 10% OFF
        </h2>
        
        <p className="text-sm text-gray-600 font-medium">
          🩺 Verified Medicines | Doctor’s Prescription Mandatory
        </p>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-3">
          💊 Order Medicines Easily
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-lg leading-relaxed">
          Please send your doctor’s prescription directly on WhatsApp.
          <br />
          Our team will verify it and deliver your medicines safely.
        </p>

        {/* Button */}
        <div className="pt-4">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition"
          >
            📲 Send Prescription on WhatsApp
          </a>
        </div>

      </div>
    </section>
  );
}
