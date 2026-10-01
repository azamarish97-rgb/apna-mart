import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useCart } from "./cartcontext";
import { useSearchParams } from "react-router-dom";

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const selectedCategory = searchParams.get("category"); // URL se category nikalega, jaise "Vegetable"

    const {
        cart,
        addToCart,
        decreaseQuantity,
        increaseQuantity,
    } = useCart();


    useEffect(() => {
        const getProducts = async () => {
            setLoading(true);

            let query = supabase
                .from("products")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            // ============ AGAR CATEGORY URL ME HAI TO FILTER KARO ============

            if (selectedCategory) {
                query = query.eq("category", selectedCategory);
            }

            const { data, error } = await query;

            if (error) {
                console.error("SUPABASE ERROR:", error);
                setLoading(false);
                return;
            }

            setProducts(data || []);
            setLoading(false);
        };

        getProducts();
    }, [selectedCategory]); // selectedCategory change hone par dobara fetch karega

    // ================= GET PRODUCTS =================

    useEffect(() => {
        const getProducts = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("SUPABASE ERROR:", error);
                setLoading(false);
                return;
            }

            console.log("ACTIVE PRODUCTS:", data);

            setProducts(data || []);
            setLoading(false);
        };

        getProducts();
    }, []);

    // ================= DISCOUNT =================

    const getDiscount = (price, offerPrice) => {
        if (
            !price ||
            !offerPrice ||
            Number(offerPrice) >= Number(price)
        ) {
            return 0;
        }

        return Math.round(
            ((Number(price) - Number(offerPrice)) /
                Number(price)) *
            100
        );
    };

    // ================= LOADING =================

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 px-5 py-10">
                <div className="max-w-6xl mx-auto">

                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">

                            <div className="w-10 h-10 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto"></div>

                            <h2 className="text-lg font-semibold text-gray-700 mt-4">
                                Loading products...
                            </h2>

                        </div>
                    </div>

                </div>
            </main>
        );
    }

    // ================= UI =================

    return (
        <main className="bg-gray-50 min-h-screen px-4 sm:px-5 py-8 sm:py-10">

            <div className="max-w-7xl mx-auto">

                {/* ================= HEADING ================= */}

                <div className="mb-7 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        {selectedCategory ? `${selectedCategory} 🛒` : "All Products 🛒"}
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Fresh products at the best prices
                    </p>

                </div>

                {/* ================= NO PRODUCTS ================= */}

                {products.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm">

                        <div className="text-6xl mb-4">
                            📦
                        </div>

                        <h2 className="text-xl font-bold text-gray-700">
                            No products available
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Please check again later.
                        </p>

                    </div>
                ) : (

                    /* ================= PRODUCT GRID ================= */

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">

                        {products.map((product) => {

                            const discount = getDiscount(
                                product.price,
                                product.offer_price
                            );

                            const hasOffer =
                                product.offer_price !== null &&
                                Number(product.offer_price) <
                                Number(product.price);

                            const stock = Number(product.stock);

                            const cartItem = cart.find(
                                (item) =>
                                    item.id === product.id
                            );

                            return (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300 border border-gray-100"
                                >

                                    {/* ================= IMAGE ================= */}

                                    <div className="relative h-40 sm:h-48 bg-gray-100 flex items-center justify-center overflow-hidden">

                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover hover:scale-105 transition duration-300"
                                                onError={(e) => {
                                                    e.currentTarget.style.display =
                                                        "none";
                                                }}
                                            />
                                        ) : (
                                            <span className="text-5xl">
                                                🛒
                                            </span>
                                        )}

                                        {/* DISCOUNT BADGE */}

                                        {hasOffer && discount > 0 && (
                                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs sm:text-sm font-bold px-2 py-1 rounded-lg">
                                                {discount}% OFF
                                            </span>
                                        )}

                                    </div>

                                    {/* ================= CONTENT ================= */}

                                    <div className="p-3 sm:p-4">

                                        {/* CATEGORY */}

                                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                                            {product.category ||
                                                "Grocery"}
                                        </p>

                                        {/* NAME */}

                                        <h2 className="font-semibold text-base sm:text-lg text-gray-800 mt-1 line-clamp-2 min-h-[40px]">
                                            {product.name}
                                        </h2>


                                        {product.weight && (
                                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                                {product.weight}
                                            </p>
                                        )}

                                        {/* DESCRIPTION */}

                                        {product.description && (
                                            <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-2">
                                                {product.description}
                                            </p>
                                        )}

                                        {/* ================= PRICE ================= */}

                                        <div className="mt-3">

                                            {hasOffer ? (
                                                <div className="flex items-center gap-2 flex-wrap">

                                                    {/* OFFER PRICE */}

                                                    <span className="text-lg sm:text-xl font-bold text-green-600">
                                                        ₹
                                                        {
                                                            product.offer_price
                                                        }
                                                    </span>

                                                    {/* ORIGINAL PRICE */}

                                                    <span className="text-xs sm:text-sm text-gray-400 line-through">
                                                        ₹{product.price}
                                                    </span>

                                                </div>
                                            ) : (
                                                <span className="text-lg sm:text-xl font-bold text-green-600">
                                                    ₹{product.price}
                                                </span>
                                            )}

                                        </div>

                                        {/* ================= STOCK ================= */}

                                        <div className="mt-2">

                                            {stock > 0 ? (
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    📦 Stock: {stock}
                                                </p>
                                            ) : (
                                                <p className="text-xs sm:text-sm font-semibold text-red-600">
                                                    ❌ Out of Stock
                                                </p>
                                            )}

                                        </div>

                                        {/* ================= CART ================= */}

                                        {stock > 0 && cartItem ? (

                                            <div className="flex items-center justify-between mt-4 border border-gray-200 rounded-xl overflow-hidden">

                                                {/* MINUS */}

                                                <button
                                                    onClick={() =>
                                                        decreaseQuantity(
                                                            product.id
                                                        )
                                                    }
                                                    className="w-10 sm:w-12 py-2.5 bg-gray-100 text-xl font-bold text-gray-700 hover:bg-gray-200 transition"
                                                >
                                                    −
                                                </button>

                                                {/* QUANTITY */}

                                                <span className="font-bold text-gray-800">
                                                    {cartItem.quantity}
                                                </span>

                                                {/* PLUS */}

                                                <button
                                                    onClick={() =>
                                                        increaseQuantity(
                                                            product.id
                                                        )
                                                    }
                                                    disabled={
                                                        cartItem.quantity >=
                                                        stock
                                                    }
                                                    className="w-10 sm:w-12 py-2.5 bg-green-600 text-white text-xl font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                                                >
                                                    +
                                                </button>

                                            </div>

                                        ) : stock > 0 ? (

                                            /* ================= ADD TO CART ================= */

                                            <button
                                                onClick={() =>
                                                    addToCart(product)
                                                }
                                                className="w-full mt-4 bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 active:scale-95 transition"
                                            >
                                                🛒 Add to Cart
                                            </button>

                                        ) : (

                                            /* ================= OUT OF STOCK BUTTON ================= */

                                            <button
                                                disabled
                                                className="w-full mt-4 bg-gray-200 text-gray-500 py-2.5 rounded-xl font-semibold cursor-not-allowed"
                                            >
                                                Out of Stock
                                            </button>

                                        )}

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}

            </div>

        </main>
    );
}

export default Products;