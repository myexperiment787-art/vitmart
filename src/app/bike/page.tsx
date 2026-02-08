import Image from "next/image";

export default function BikeRentPage() {
  const bikes = [
    {
      name: "Scooty",
      price: 300,
      image: "/bikes/scooty.jpg",
    },
    {
      name: "Passion Pro",
      price: 350,
      image: "/bikes/passion-pro.jpg",
    },
    {
      name: "Splendor",
      price: 350,
      image: "/bikes/splendor.jpg",
    },
    {
      name: "Pulsar",
      price: 400,
      image: "/bikes/pulsar.jpg",
    },
  ];


  const whatsappNumber = "919630741753"; // change if needed

  return (
    <div className="px-6 py-12 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-10">
        🚲 Bike Rental – 24 Hours
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {bikes.map((bike) => (
          <div
            key={bike.name}
            className="bg-white rounded-xl shadow-md overflow-hidden text-center"
          >
            {/* BIKE IMAGE */}
            <div className="relative w-full h-48">
                <Image
                    src={bike.image}
                    alt={bike.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                     priority
                />
            </div>

            {/* BIKE DETAILS */}
            <div className="p-5">
              <h2 className="text-xl font-semibold mb-2">{bike.name}</h2>
              <p className="text-gray-600 mb-4">
                ₹{bike.price} / 24 Hours
              </p>

              <a
                href={`https://wa.me/${whatsappNumber}?text=Hello,%20I%20want%20to%20rent%20${bike.name}%20for%2024%20hours`}
                target="_blank"
                className="inline-block bg-green-600 text-white px-5 py-2 rounded-full hover:bg-green-700 transition"
              >
                📲 Book on WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
