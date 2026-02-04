export default function TopBanner() {
  return (
    <>
      {/* WARNING BANNER */}
      <div className="bg-yellow-400 text-red-700 text-sm text-center py-2 font-medium">
        ⚠️ Kindly ensure to take delivery on time. 
        If you do not answer the delivery boy’s call, your order will be rejected.
      </div>

      {/* FREE DELIVERY BANNER */}
      <div className="bg-green-600 text-white text-sm text-center py-2 font-medium flex items-center justify-center gap-2">
        🚚 Free Delivery on orders above ₹199
      </div>
    </>
  );
}
