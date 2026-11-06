import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";

import "swiper/css";
import "swiper/css/free-mode";

import { supabase } from "./supabase";
import { HandHeart } from "lucide-react";

// =====================================================
// CATEGORY NAME KE HISAB SE EMOJI
// =====================================================

import {
    ShoppingCart,
    CupSoda,
    Milk,
    Carrot,
    Apple,
    Cookie,
    Coffee,
    Wheat,
    Soup,
    Bean,
    Droplets,
    Flame,
    Candy,
    Package,
    Croissant,
    Nut,
    SprayCan,
    Bath,
    Baby,
    House,
    Pencil,
    Dog,
    FlameKindling,
    Snowflake,
    Utensils,
    Citrus,
    Cookie as BiscuitIcon,
    Popcorn,
    CookingPot,
    IceCreamCone,
    Leaf,
    Sparkles,
} from "lucide-react";

const categoryEmoji = {
    Grocery: ShoppingCart,



    "Cold Drink": CupSoda,
    "Cold Drinks": CupSoda,

    Dairy: Milk,

    "Ice Cream": IceCreamCone,
    "Ice Creams": IceCreamCone,
    "Icecream": IceCreamCone,
    "Icecreams": IceCreamCone,

    Vegetable: Carrot,
    Vegetables: Carrot,

    Fruits: Apple,
    Fruit: Apple,

    Snacks: Popcorn,
    Beverages: CupSoda,

    "Rice & Grains": Wheat,
    Rice: Wheat,
    Grains: Wheat,

    "Atta & Flour": Wheat,
    Atta: Wheat,
    Flour: Soup,

    "Dal & Pulses": Bean,
    Dal: Bean,
    Pulses: Bean,

    "Oil & Ghee": Droplets,
    Oil: Droplets,
    Ghee: CookingPot,

    "Spices & Masala": Flame,
    Spices: Flame,
    Masala: Flame,

    "Biscuits & Cookies": BiscuitIcon,
    Biscuits: BiscuitIcon,
    Cookies: BiscuitIcon,

    "Tea & Coffee": Coffee,
    Tea: Coffee,
    Coffee: Coffee,

    "Sweets & Chocolates": Candy,
    Sweets: Candy,
    Chocolates: Candy,

    "Packaged Food": Package,
    "Ready to Eat": Utensils,

    Breakfast: Soup,
    Cereals: Wheat,

    "Bread & Bakery": Croissant,
    Bakery: Croissant,
    Bread: Croissant,

    "Dry Fruits": Nut,
    "Dry Fruits & Nuts": Nut,
    Nuts: Nut,

    "personal care": HandHeart,
    "Hair Care": Sparkles,
    "Skin Care": Sparkles,
    "Bath & Body": Bath,
    "Baby Care": Baby,


    "Bath & Body": Bath,
    "Baby Care": Baby,

    "Cleaning & Household": House,
    Cleaning: SprayCan,
    Household: House,

    "Home Care": House,
    Stationery: Pencil,
    "Pet Care": Dog,
    "Pooja Items": FlameKindling,
    "Frozen Food": Snowflake,
    "Instant Food": CookingPot,
    "Sauces & Spreads": Droplets,
    "Pickles & Papad": Citrus,
    "Salt & Sugar": CookingPot,
    Sugar: CookingPot,
    Salt: CookingPot,
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

                            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 flex items-center justify-center">
                                {(() => {
                                    const Icon = categoryEmoji[cat] || ShoppingCart;

                                    return (
                                        <Icon
                                            size={26}
                                            strokeWidth={1.8}
                                            className="text-blue-600"
                                        />
                                    );
                                })()}
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