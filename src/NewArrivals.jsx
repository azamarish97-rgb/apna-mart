import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useCart } from "./cartcontext";

function NewArrivals() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const {
        cart,
        addToCart,
        decreaseQuantity,
        increaseQuantity,
    } = useCart();

    // =====================================================
    // OPEN PRODUCT DETAILS
    // =====================================================

    const openProduct = (productId) => {
        navigate(`/product/${productId}`);
    };

    // =====================================================
    // GET NEW PRODUCTS - BANDWIDTH OPTIMIZED
    // =====================================================

    useEffect(() => {
        let isMounted = true;

        const getProducts = async () => {
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select(
                        "id, name, price, offer_price, stock, weight, image_url, created_at"
                    )
                    .eq("is_active", true)
                    .order("created_at", {
                        ascending: false,
                    })
                    .limit(8);

                if (error) throw error;

                if (isMounted) {
                    setProducts(data || []);
                }
            } catch (error) {
                console.error("SUPABASE ERROR:", error);

                if (isMounted) {
                    setProducts([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        getProducts();

        return () => {
            isMounted = false;
        };
    }, []);

    // =====================================================
    // DISCOUNT
    // =====================================================

    const getDiscount = (price, offerPrice) => {
        if (
            price == null ||
            Number(price) <= 0 ||
            offerPrice == null ||
            Number(offerPrice) <= 0 ||
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
                <div className="flex gap-3 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="
                                bg-[var(--primary-light)]
                                rounded-2xl
                                h-52
                                min-w-[46%]
                                sm:min-w-[30%]
                                lg:min-w-[23%]
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

            {/* HORIZONTAL SIDE SLIDER */}

            <div
                className="
                    flex
                    gap-3
                    sm:gap-5
                    overflow-x-auto
                    overflow-y-hidden
                    scroll-smooth
                    snap-x
                    snap-mandatory
                    pb-3
                    scrollbar-hide
                "
            >
                {products.map((product) => {
                    const discount = getDiscount(
                        product.price,
                        product.offer_price
                    );

                    const hasOffer =
                        product.offer_price != null &&
                        Number(product.offer_price) > 0 &&
                        Number(product.offer_price) <
                        Number(product.price);

                    const stock = Number(product.stock) || 0;

                    const cartItem = cart.find(
                        (item) => item.id === product.id
                    );

                    return (
                        <div
                            key={product.id}
                            className="
                                min-w-[46%]
                                w-[46%]
                                sm:min-w-[30%]
                                sm:w-[30%]
                                lg:min-w-[23%]
                                lg:w-[23%]
                                flex-shrink-0
                                snap-start
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
                            {/* CLICKABLE PRODUCT AREA */}

                            <div
                                onClick={() =>
                                    openProduct(product.id)
                                }
                                className="cursor-pointer"
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
                                            alt={product.name || "Product"}
                                            className="
                                                w-full
                                                h-full
                                                object-cover
                                            "
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <span className="text-4xl">
                                            🛒
                                        </span>
                                    )}

                                    {/* DISCOUNT */}

                                    {hasOffer && discount > 0 && (
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

                                    {/* NAME */}

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
                                </div>
                            </div>

                            {/* CART CONTROLS */}

                            <div className="px-3 pb-3">
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
                                            type="button"
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
                                            type="button"
                                            onClick={() =>
                                                increaseQuantity(
                                                    product.id
                                                )
                                            }
                                            disabled={
                                                cartItem.quantity >= stock
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
                                        type="button"
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
                                        type="button"
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