import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";

import "swiper/css";
import "swiper/css/free-mode";

import { supabase } from "./supabase";

// =====================================================
// CATEGORY NAME KE HISAB SE EMOJI
// =====================================================

const categoryEmoji = {
    Grocery: "🛒",

    "Cold Drink": "🥤",
    "Cold Drinks": "🥤",

    Dairy: "🥛",

    Vegetable: "🥦",
    Vegetables: "🥦",

    Fruits: "🍎",
    Fruit: "🍎",

    Snacks: "🍪",

    Beverages: "🥤",

    "Rice & Grains": "🍚",
    Rice: "🍚",
    Grains: "🌾",

    "Atta & Flour": "🌾",
    Atta: "🌾",
    Flour: "🥣",

    "Dal & Pulses": "🫘",
    Dal: "🫘",
    Pulses: "🫘",

    "Oil & Ghee": "🫗",
    Oil: "🫗",
    Ghee: "🧈",

    "Spices & Masala": "🌶️",
    Spices: "🌶️",
    Masala: "🌶️",

    "Biscuits & Cookies": "🍪",
    Biscuits: "🍪",
    Cookies: "🍪",

    "Tea & Coffee": "☕",
    Tea: "🍵",
    Coffee: "☕",

    "Sweets & Chocolates": "🍫",
    Sweets: "🍬",
    Chocolates: "🍫",

    "Packaged Food": "🥫",
    "Ready to Eat": "🍱",

    "Breakfast": "🥣",
    Cereals: "🥣",

    "Bread & Bakery": "🍞",
    Bakery: "🥐",
    Bread: "🍞",

    "Dry Fruits": "🥜",
    "Dry Fruits & Nuts": "🥜",
    Nuts: "🥜",

    "Personal Care": "🧴",

    "Hair Care": "🧴",
    "Skin Care": "🧴",

    "Bath & Body": "🛁",

    "Baby Care": "🍼",

    "Cleaning & Household": "🧹",
    Cleaning: "🧹",
    Household: "🏠",

    "Home Care": "🏠",

    "Stationery": "✏️",

    "Pet Care": "🐶",

    "Pooja Items": "🪔",

    "Frozen Food": "❄️",

    "Instant Food": "🍜",

    "Sauces & Spreads": "🍯",

    "Pickles & Papad": "🥒",

    "Salt & Sugar": "🧂",

    Sugar: "🍚",
    Salt: "🧂",
};

// =====================================================
// COMPONENT
// =====================================================

function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    // =====================================================
    // GET UNIQUE CATEGORIES FROM PRODUCTS
    // =====================================================

    useEffect(() => {
        const getCategories = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from("products")
                .select("category")
                .eq("is_active", true);

            if (error) {
                console.error("SUPABASE ERROR:", error);
                setLoading(false);
                return;
            }

            const unique = [
                ...new Set(
                    (data || [])
                        .map((item) => item.category?.trim())
                        .filter(Boolean)
                ),
            ];

            setCategories(unique);

            setLoading(false);
        };

        getCategories();
    }, []);

    // =====================================================
    // CLICK HANDLER
    // =====================================================

    const handleClick = (name) => {
        navigate(
            `/products?category=${encodeURIComponent(name)}`
        );
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-5 mt-8 sm:mt-10">

                <div className="flex gap-3 overflow-hidden">

                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="
                                bg-[var(--primary-light)]
                                rounded-2xl
                                h-24
                                w-24
                                flex-shrink-0
                                animate-pulse
                            "
                        />
                    ))}

                </div>

            </div>
        );
    }

    // =====================================================
    // EMPTY
    // =====================================================

    if (categories.length === 0) {
        return null;
    }

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-5 mt-8 sm:mt-10">

            <h2
                className="
                    text-xl
                    sm:text-2xl
                    font-bold
                    text-[var(--text-main)]
                    mb-4
                "
            >
                Shop by Category
            </h2>

            <Swiper
                modules={[FreeMode]}
                slidesPerView="auto"
                spaceBetween={12}
                freeMode={true}
                grabCursor={true}
                className="!overflow-visible"
            >

                {categories.map((cat) => (

                    <SwiperSlide
                        key={cat}
                        style={{ width: "88px" }}
                    >

                        <div
                            onClick={() => handleClick(cat)}
                            className="
                                bg-white
                                rounded-2xl
                                p-3
                                text-center
                                shadow-sm
                                hover:shadow-md
                                border
                                border-gray-100
                                transition
                                cursor-pointer
                                active:scale-95
                            "
                        >

                            <div className="text-3xl">
                                {categoryEmoji[cat] || "🛒"}
                            </div>

                            <p
                                className="
                                    text-xs
                                    font-medium
                                    text-[var(--text-main)]
                                    mt-2
                                    truncate
                                "
                            >
                                {cat}
                            </p>

                        </div>

                    </SwiperSlide>

                ))}

            </Swiper>

        </div>
    );
}

export default Categories;