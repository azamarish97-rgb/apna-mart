import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "./supabase";
import { useCart } from "./cartcontext";

function NewArrivals() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const {
        cart,
        addToCart,
        decreaseQuantity,
        increaseQuantity,
    } = useCart();

    // =====================================================
    // GET NEW PRODUCTS
    // =====================================================

    useEffect(() => {
        const getProducts = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("is_active", true)
                .order("created_at", {
                    ascending: false,
                })
                .limit(8);

            if (error) {
                console.error("SUPABASE ERROR:", error);
                setLoading(false);
                return;
            }

            setProducts(data || []);
            setLoading(false);
        };

        getProducts();
    }, []);

    // =====================================================
    // DISCOUNT
    // =====================================================

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

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-5 mt-8 sm:mt-10">

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="
                                bg-[var(--primary-light)]
                                rounded-2xl
                                h-52
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

    if (products.length === 0) {
        return null;
    }

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-5 mt-8 sm:mt-10">

            {/* HEADER */}

            <div className="flex items-center justify-between mb-4">

                <h2
                    className="
                        text-xl
                        sm:text-2xl
                        font-bold
                        text-[var(--text-main)]
                    "
                >
                    🆕 New Arrivals
                </h2>

                <Link
                    to="/products"
                    className="
                        text-[var(--primary)]
                        font-medium
                        text-sm
                        hover:underline
                    "
                >
                    View all →
                </Link>

            </div>

            {/* PRODUCT GRID */}

            <div
                className="
                    grid
                    grid-cols-2
                    sm:grid-cols-3
                    lg:grid-cols-4
                    gap-3
                    sm:gap-5
                "
            >

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
                            className="
                                bg-white
                                rounded-2xl
                                overflow-hidden
                                shadow-sm
                                hover:shadow-lg
                                transition
                                duration-300
                                border
                                border-gray-100
                            "
                        >

                            {/* IMAGE */}

                            <div
                                className="
                                    relative
                                    h-32
                                    sm:h-40
                                    bg-[var(--primary-light)]
                                    flex
                                    items-center
                                    justify-center
                                    overflow-hidden
                                "
                            >

                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="
                                            w-full
                                            h-full
                                            object-cover
                                        "
                                        loading="lazy"
                                    />
                                ) : (
                                    <span className="text-4xl">
                                        🛒
                                    </span>
                                )}

                                {/* DISCOUNT */}

                                {hasOffer &&
                                    discount > 0 && (
                                        <span
                                            className="
                                                absolute
                                                top-2
                                                left-2
                                                bg-[var(--primary)]
                                                text-white
                                                text-xs
                                                font-bold
                                                px-2
                                                py-1
                                                rounded-lg
                                            "
                                        >
                                            {discount}% OFF
                                        </span>
                                    )}

                            </div>

                            {/* DETAILS */}

                            <div className="p-3">

                                <h3
                                    className="
                                        font-semibold
                                        text-sm
                                        sm:text-base
                                        text-[var(--text-main)]
                                        line-clamp-2
                                        min-h-[36px]
                                    "
                                >
                                    {product.name}
                                </h3>

                                {/* WEIGHT */}

                                <h3
                                    className="
                                        font-semibold
                                        text-sm
                                        sm:text-base
                                        text-[var(--primary)]
                                        line-clamp-2
                                        min-h-[36px]
                                        mt-2
                                    "
                                >
                                    {product.weight}
                                </h3>

                                {/* PRICE */}

                                <div className="mt-2">

                                    {hasOffer ? (

                                        <div
                                            className="
                                                flex
                                                items-center
                                                gap-2
                                                flex-wrap
                                            "
                                        >

                                            <span
                                                className="
                                                    text-base
                                                    sm:text-lg
                                                    font-bold
                                                    text-[var(--primary)]
                                                "
                                            >
                                                ₹{product.offer_price}
                                            </span>

                                            <span
                                                className="
                                                    text-xs
                                                    text-gray-400
                                                    line-through
                                                "
                                            >
                                                ₹{product.price}
                                            </span>

                                        </div>

                                    ) : (

                                        <span
                                            className="
                                                text-base
                                                sm:text-lg
                                                font-bold
                                                text-[var(--primary)]
                                            "
                                        >
                                            ₹{product.price}
                                        </span>

                                    )}

                                </div>

                                {/* CART */}

                                {stock > 0 && cartItem ? (

                                    <div
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            mt-3
                                            border
                                            border-gray-200
                                            rounded-xl
                                            overflow-hidden
                                        "
                                    >

                                        <button
                                            onClick={() =>
                                                decreaseQuantity(
                                                    product.id
                                                )
                                            }
                                            className="
                                                w-9
                                                py-2
                                                bg-gray-100
                                                font-bold
                                                text-gray-700
                                            "
                                        >
                                            −
                                        </button>

                                        <span
                                            className="
                                                text-sm
                                                font-bold
                                                text-[var(--text-main)]
                                            "
                                        >
                                            {cartItem.quantity}
                                        </span>

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
                                            className="
                                                w-9
                                                py-2
                                                bg-[var(--primary)]
                                                text-white
                                                font-bold
                                                disabled:bg-gray-300
                                            "
                                        >
                                            +
                                        </button>

                                    </div>

                                ) : stock > 0 ? (

                                    <button
                                        onClick={() =>
                                            addToCart(product)
                                        }
                                        className="
                                            w-full
                                            mt-3
                                            bg-[var(--primary)]
                                            text-white
                                            py-2
                                            rounded-xl
                                            text-sm
                                            font-semibold
                                            active:scale-95
                                            transition
                                        "
                                    >
                                        🛒 Add to Cart
                                    </button>

                                ) : (

                                    <button
                                        disabled
                                        className="
                                            w-full
                                            mt-3
                                            bg-gray-200
                                            text-gray-500
                                            py-2
                                            rounded-xl
                                            text-sm
                                            font-semibold
                                        "
                                    >
                                        Out of Stock
                                    </button>

                                )}

                            </div>

                        </div>
                    );
                })}

            </div>

        </div>
    );
}

export default NewArrivals;