import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { supabase } from "./supabase";
import { useCart } from "./cartcontext";

function DealsSection() {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);

    const { cart, addToCart, decreaseQuantity, increaseQuantity } = useCart();

    // ================= GET DISCOUNTED PRODUCTS =================

    useEffect(() => {
        const getDeals = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("is_active", true)
                .not("offer_price", "is", null)
                .order("created_at", { ascending: false })
                .limit(10);

            if (error) {
                console.error("SUPABASE ERROR:", error);
                setLoading(false);
                return;
            }

            setDeals(data || []);
            setLoading(false);
        };

        getDeals();
    }, []);

    // ================= DISCOUNT =================

    const getDiscount = (price, offerPrice) => {
        if (!price || !offerPrice || Number(offerPrice) >= Number(price)) {
            return 0;
        }
        return Math.round(
            ((Number(price) - Number(offerPrice)) / Number(price)) * 100
        );
    };

    // ================= LOADING / EMPTY =================

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-5 mt-8 sm:mt-10">
                <div className="flex gap-3 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-gray-100 rounded-2xl h-56 w-36 flex-shrink-0 animate-pulse"
                        ></div>
                    ))}
                </div>
            </div>
        );
    }

    if (deals.length === 0) {
        return null;
    }

    // ================= UI =================

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-5 mt-8 sm:mt-10">

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                    🔥 Deals of the Day
                </h2>
                <Link
                    to="/products"
                    className="text-green-600 font-medium text-sm hover:underline"
                >
                    View all →
                </Link>
            </div>

            <Swiper
                modules={[FreeMode]}
                slidesPerView="auto"
                spaceBetween={12}
                freeMode={true}
                grabCursor={true}
                className="!overflow-visible"
            >
                {deals.map((product) => {

                    const discount = getDiscount(product.price, product.offer_price);
                    const stock = Number(product.stock);
                    const cartItem = cart.find((item) => item.id === product.id);

                    return (
                        <SwiperSlide key={product.id} style={{ width: "144px" }}>

                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">

                                <div className="relative h-28 bg-gray-100 flex items-center justify-center overflow-hidden">

                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl">🛒</span>
                                    )}

                                    {discount > 0 && (
                                        <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                            {discount}% OFF
                                        </span>
                                    )}

                                </div>

                                <div className="p-2.5">

                                    <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 min-h-[32px]">
                                        {product.name}
                                    </h3>
                                    <h3 className="text-xs font-semibold text-fuchsia-800 line-clamp-2 min-h-[32px]">
                                        {product.weight}
                                    </h3>

                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        <span className="text-sm font-bold text-green-600">
                                            ₹{product.offer_price}
                                        </span>
                                        <span className="text-[10px] text-gray-400 line-through">
                                            ₹{product.price}
                                        </span>
                                    </div>

                                    {stock > 0 && cartItem ? (
                                        <div className="flex items-center justify-between mt-2 border border-gray-200 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => decreaseQuantity(product.id)}
                                                className="w-7 py-1 bg-gray-100 text-sm font-bold text-gray-700"
                                            >
                                                −
                                            </button>
                                            <span className="text-xs font-bold text-gray-800">
                                                {cartItem.quantity}
                                            </span>
                                            <button
                                                onClick={() => increaseQuantity(product.id)}
                                                disabled={cartItem.quantity >= stock}
                                                className="w-7 py-1 bg-green-600 text-white text-sm font-bold disabled:bg-gray-300"
                                            >
                                                +
                                            </button>
                                        </div>
                                    ) : stock > 0 ? (
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="w-full mt-2 bg-green-600 text-white py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition"
                                        >
                                            Add
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full mt-2 bg-gray-200 text-gray-500 py-1.5 rounded-lg text-xs font-semibold"
                                        >
                                            Out of Stock
                                        </button>
                                    )}

                                </div>

                            </div>

                        </SwiperSlide>
                    );
                })}

            </Swiper>

        </div>
    );
}

export default DealsSection;