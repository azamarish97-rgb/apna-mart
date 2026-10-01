import { Truck, BadgeCheck, RotateCcw, Headphones } from "lucide-react";

function WhyChooseUs() {
    const features = [
        {
            icon: Truck,
            title: "Fast Delivery",
            desc: "Get your order in 30 mins",
        },
        {
            icon: BadgeCheck,
            title: "Quality Assured",
            desc: "Fresh & genuine products",
        },
        {
            icon: RotateCcw,
            title: "Easy Returns",
            desc: "Hassle-free replacement",
        },
        {
            icon: Headphones,
            title: "24/7 Support",
            desc: "We're here to help",
        },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-5 mt-8 sm:mt-10">

            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                Why Choose Us
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">

                {features.map((feature, i) => {
                    const Icon = feature.icon;

                    return (
                        <div
                            key={i}
                            className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100"
                        >
                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                <Icon size={22} className="text-green-600" />
                            </div>

                            <h3 className="font-semibold text-sm text-gray-800 mt-3">
                                {feature.title}
                            </h3>

                            <p className="text-xs text-gray-500 mt-1">
                                {feature.desc}
                            </p>
                        </div>
                    );
                })}

            </div>

        </div>
    );
}

export default WhyChooseUs;