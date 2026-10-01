import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { supabase } from "./supabase";

// category name ke hisaab se emoji
const categoryEmoji = {
    Grocery: "🛒",
    "Cold Drink": "🥤",
    "Cold Drinks": "🥤",
    Dairy: "🥛",
    Vegetable: "🥦",
    Vegetables: "🥦",
    Fruits: "🍎",
    Snacks: "🍪",
    Beverages: "🥤",
};

function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    // ================= GET UNIQUE CATEGORIES FROM PRODUCTS =================

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
                        .map((item) => item.category)
                        .filter(Boolean)
                ),
            ];

            setCategories(unique);
            setLoading(false);
        };

        getCategories();
    }, []);

    // ================= CLICK HANDLER =================

    const handleClick = (name) => {
        navigate(`/products?category=${encodeURIComponent(name)}`);
    };

    // ================= LOADING =================

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-5 mt-8 sm:mt-10">
                <div className="flex gap-3 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-gray-100 rounded-2xl h-24 w-24 flex-shrink-0 animate-pulse"
                        ></div>
                    ))}
                </div>
            </div>
        );
    }

    // ================= EMPTY =================

    if (categories.length === 0) {
        return null;
    }

    // ================= UI =================

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-5 mt-8 sm:mt-10">

            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
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
                            className="bg-white rounded-2xl p-3 text-center shadow-sm hover:shadow-md border border-gray-100 transition cursor-pointer active:scale-95"
                        >
                            <div className="text-3xl">
                                {categoryEmoji[cat] || "🛒"}
                            </div>

                            <p className="text-xs font-medium text-gray-700 mt-2 truncate">
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