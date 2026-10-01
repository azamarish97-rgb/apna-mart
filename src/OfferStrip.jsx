import { Truck, Percent, ShieldCheck } from "lucide-react";

function OfferStrip() {
    const offers = [
        { icon: Truck, text: "Free Delivery on ₹199+" },
        { icon: Percent, text: "Up to 40% OFF" },
        { icon: ShieldCheck, text: "100% Genuine Products" },
    ];

    return (
        <div className="bg-green-600 mt-8 sm:mt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-5 py-3">

                <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-6">

                    {offers.map((offer, i) => {
                        const Icon = offer.icon;
                        return (
                            <div
                                key={i}
                                className="flex items-center gap-2 text-white whitespace-nowrap flex-shrink-0"
                            >
                                <Icon size={18} />
                                <span className="text-xs sm:text-sm font-medium">
                                    {offer.text}
                                </span>
                            </div>
                        );
                    })}

                </div>

            </div>
        </div>
    );
}

export default OfferStrip;