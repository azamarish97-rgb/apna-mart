import { useEffect, useState } from "react";
import Banner from "./Banner";
import OfferStrip from "./OfferStrip";
import DealsSection from "./DealsSection";

import { useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    ShoppingCart,
    Plus,
    Minus,
    Package,
    Check,
    Truck,
    ShieldCheck,
} from "lucide-react";

import { supabase } from "./supabase";

import { useCart } from "./cartcontext";

function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const {
        cart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
    } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // ==========================================
    // FETCH PRODUCT
    // ==========================================

    useEffect(() => {
        const getProduct = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", id)
                .eq("is_active", true)
                .single();

            if (error) {
                console.error(
                    "PRODUCT DETAILS ERROR:",
                    error
                );

                setProduct(null);
                setLoading(false);
                return;
            }

            setProduct(data);
            setLoading(false);
        };

        if (id) {
            getProduct();
        }
    }, [id]);

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <main
                className="
                    min-h-screen
                    bg-[var(--page-bg)]
                    px-4
                    sm:px-5
                    py-5
                    pb-24
                "
            >
                <div className="max-w-6xl mx-auto">

                    {/* Back skeleton */}

                    <div
                        className="
                            h-9
                            w-24
                            bg-[var(--primary-light)]
                            rounded-xl
                            animate-pulse
                            mb-5
                        "
                    />

                    <div
                        className="
                            bg-white
                            rounded-3xl
                            overflow-hidden
                            border
                            border-gray-100
                            shadow-sm
                            grid
                            md:grid-cols-2
                        "
                    >
                        {/* Image skeleton */}

                        <div
                            className="
                                h-[320px]
                                sm:h-[460px]
                                bg-[var(--primary-light)]
                                animate-pulse
                            "
                        />

                        {/* Content skeleton */}

                        <div className="p-6 sm:p-8 space-y-5">

                            <div
                                className="
                                    h-7
                                    w-24
                                    bg-[var(--primary-light)]
                                    rounded-full
                                    animate-pulse
                                "
                            />

                            <div
                                className="
                                    h-10
                                    w-4/5
                                    bg-[var(--primary-light)]
                                    rounded-xl
                                    animate-pulse
                                "
                            />

                            <div
                                className="
                                    h-6
                                    w-24
                                    bg-[var(--primary-light)]
                                    rounded-lg
                                    animate-pulse
                                "
                            />

                            <div
                                className="
                                    h-12
                                    w-48
                                    bg-[var(--primary-light)]
                                    rounded-xl
                                    animate-pulse
                                "
                            />

                            <div
                                className="
                                    h-24
                                    bg-[var(--primary-light)]
                                    rounded-xl
                                    animate-pulse
                                "
                            />

                            <div
                                className="
                                    h-12
                                    bg-[var(--primary-light)]
                                    rounded-xl
                                    animate-pulse
                                "
                            />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // ==========================================
    // PRODUCT NOT FOUND
    // ==========================================

    if (!product) {
        return (
            <main
                className="
                    min-h-screen
                    bg-[var(--page-bg)]
                    flex
                    items-center
                    justify-center
                    px-4
                    pb-24
                "
            >
                <div className="text-center">

                    <div
                        className="
                            w-24
                            h-24
                            bg-[var(--primary-light)]
                            rounded-full
                            flex
                            items-center
                            justify-center
                            mx-auto
                            mb-5
                        "
                    >
                        <Package
                            size={40}
                            className="text-[var(--primary)]"
                        />
                    </div>

                    <h2
                        className="
                            text-2xl
                            font-bold
                            text-[var(--text-main)]
                        "
                    >
                        Product Not Found
                    </h2>

                    <p className="text-sm text-gray-500 mt-2">
                        Ye product abhi available nahi hai.
                    </p>

                    <button
                        onClick={() =>
                            navigate("/products")
                        }
                        className="
                            mt-6
                            bg-[var(--primary)]
                            hover:bg-[var(--primary-dark)]
                            text-white
                            px-6
                            py-3
                            rounded-xl
                            font-semibold
                            transition
                            active:scale-95
                        "
                    >
                        Back to Products
                    </button>
                </div>
            </main>
        );
    }

    // ==========================================
    // PRODUCT DATA
    // ==========================================

    const price = Number(product.price) || 0;

    const offerPrice =
        product.offer_price !== null &&
            product.offer_price !== undefined &&
            product.offer_price !== ""
            ? Number(product.offer_price)
            : null;

    const hasOffer =
        offerPrice !== null &&
        offerPrice > 0 &&
        offerPrice < price;

    const finalPrice = hasOffer
        ? offerPrice
        : price;

    const discount = hasOffer
        ? Math.round(
            ((price - offerPrice) / price) * 100
        )
        : 0;

    const savedAmount = hasOffer
        ? price - finalPrice
        : 0;

    const stock = Number(product.stock) || 0;

    const cartItem = cart.find(
        (item) =>
            String(item.id) === String(product.id)
    );

    const quantity = cartItem?.quantity || 0;

    // ==========================================
    // CART
    // ==========================================

    const handleAddToCart = () => {
        if (stock <= 0) return;

        addToCart(product);
    };

    // ==========================================
    // UI
    // ==========================================

    return (
        <main
            className="
                min-h-screen
                bg-[var(--page-bg)]
                text-[var(--text-main)]
                px-4
                sm:px-5
                py-4
                sm:py-6
                pb-24
            "
        >
            <div className="max-w-6xl mx-auto">

                {/* ==================================
                    BACK BUTTON
                ================================== */}

                <button
                    onClick={() => navigate(-1)}
                    className="
                        group
                        flex
                        items-center
                        gap-2
                        text-sm
                        font-semibold
                        text-[var(--primary)]
                        mb-4
                        px-3
                        py-2
                        rounded-xl
                        hover:bg-[var(--primary-light)]
                        transition
                    "
                >
                    <ArrowLeft
                        size={18}
                        className="
                            group-hover:-translate-x-1
                            transition
                        "
                    />

                    Back
                </button>

                {/* ==================================
                    PRODUCT CARD
                ================================== */}

                <div
                    className="
                        bg-white
                        rounded-3xl
                        shadow-sm
                        border
                        border-gray-100
                        overflow-hidden
                        grid
                        md:grid-cols-2
                    "
                >

                    {/* ==================================
                        IMAGE SECTION
                    ================================== */}

                    <div
                        className="
                            relative
                            bg-[var(--primary-light)]
                            min-h-[320px]
                            sm:min-h-[460px]
                            flex
                            items-center
                            justify-center
                            overflow-hidden
                        "
                    >
                        {/* Decorative background */}

                        <div
                            className="
                                absolute
                                -top-20
                                -right-20
                                w-56
                                h-56
                                rounded-full
                                bg-white/40
                            "
                        />

                        <div
                            className="
                                absolute
                                -bottom-24
                                -left-20
                                w-64
                                h-64
                                rounded-full
                                bg-white/30
                            "
                        />

                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="
                                    relative
                                    z-10
                                    w-full
                                    h-full
                                    max-h-[500px]
                                    object-contain
                                    p-6
                                    sm:p-10
                                    drop-shadow-xl
                                "
                            />
                        ) : (
                            <div
                                className="
                                    relative
                                    z-10
                                    text-center
                                "
                            >
                                <div className="text-7xl">
                                    🛒
                                </div>

                                <p className="text-sm text-gray-500 mt-3">
                                    No Image Available
                                </p>
                            </div>
                        )}

                        {/* DISCOUNT BADGE */}

                        {discount > 0 && (
                            <div
                                className="
                                    absolute
                                    z-20
                                    top-4
                                    left-4
                                    bg-[var(--primary)]
                                    text-white
                                    px-3
                                    py-2
                                    rounded-xl
                                    shadow-lg
                                "
                            >
                                <span
                                    className="
                                        text-sm
                                        font-extrabold
                                    "
                                >
                                    {discount}% OFF
                                </span>
                            </div>
                        )}

                        {/* STOCK BADGE */}

                        <div
                            className="
                                absolute
                                z-20
                                bottom-4
                                left-4
                            "
                        >
                            {stock > 0 ? (
                                <span
                                    className="
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        bg-white
                                        text-green-600
                                        px-3
                                        py-2
                                        rounded-xl
                                        text-xs
                                        font-bold
                                        shadow-md
                                    "
                                >
                                    <Check size={15} />
                                    In Stock
                                </span>
                            ) : (
                                <span
                                    className="
                                        inline-flex
                                        items-center
                                        bg-white
                                        text-red-500
                                        px-3
                                        py-2
                                        rounded-xl
                                        text-xs
                                        font-bold
                                        shadow-md
                                    "
                                >
                                    Out of Stock
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ==================================
                        PRODUCT INFORMATION
                    ================================== */}

                    <div
                        className="
                            p-5
                            sm:p-7
                            lg:p-9
                            flex
                            flex-col
                        "
                    >

                        {/* CATEGORY */}

                        {product.category && (
                            <span
                                className="
                                    w-fit
                                    text-xs
                                    font-bold
                                    text-[var(--primary)]
                                    bg-[var(--primary-light)]
                                    px-3
                                    py-1.5
                                    rounded-full
                                    uppercase
                                    tracking-wide
                                "
                            >
                                {product.category}
                            </span>
                        )}

                        {/* PRODUCT NAME */}

                        <h1
                            className="
                                text-2xl
                                sm:text-3xl
                                lg:text-4xl
                                font-extrabold
                                leading-tight
                                text-[var(--text-main)]
                                mt-4
                            "
                        >
                            {product.name}
                        </h1>

                        {/* WEIGHT */}

                        {product.weight && (
                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    mt-3
                                    text-sm
                                    font-semibold
                                    text-gray-500
                                "
                            >
                                <Package size={17} />

                                <span>
                                    {product.weight}
                                </span>
                            </div>
                        )}

                        {/* PRICE */}

                        <div className="mt-6">

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                    flex-wrap
                                "
                            >
                                <span
                                    className="
                                        text-3xl
                                        sm:text-4xl
                                        font-extrabold
                                        text-[var(--primary)]
                                    "
                                >
                                    ₹{finalPrice}
                                </span>

                                {hasOffer && (
                                    <span
                                        className="
                                            text-base
                                            sm:text-lg
                                            text-gray-400
                                            line-through
                                        "
                                    >
                                        ₹{price}
                                    </span>
                                )}
                            </div>

                            {hasOffer && (
                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                        mt-2
                                    "
                                >
                                    <span
                                        className="
                                            text-xs
                                            font-bold
                                            text-green-600
                                            bg-green-50
                                            px-2.5
                                            py-1
                                            rounded-lg
                                        "
                                    >
                                        Save ₹{savedAmount}
                                    </span>

                                    <span
                                        className="
                                            text-xs
                                            text-gray-500
                                        "
                                    >
                                        Limited time offer
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* DIVIDER */}

                        <div className="h-px bg-gray-100 my-6" />

                        {/* DESCRIPTION */}

                        {product.description && (
                            <div>
                                <h2
                                    className="
                                        text-base
                                        sm:text-lg
                                        font-bold
                                        text-[var(--text-main)]
                                    "
                                >
                                    Product Details
                                </h2>

                                <p
                                    className="
                                        text-sm
                                        leading-6
                                        text-gray-500
                                        mt-2
                                        whitespace-pre-line
                                    "
                                >
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* BENEFITS */}

                        <div
                            className="
                                grid
                                grid-cols-2
                                gap-2
                                mt-6
                            "
                        >
                            <div
                                className="
                                    bg-[var(--primary-light)]
                                    rounded-xl
                                    p-3
                                "
                            >
                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                        text-[var(--primary)]
                                    "
                                >
                                    <Truck size={18} />

                                    <span
                                        className="
                                            text-xs
                                            font-bold
                                        "
                                    >
                                        Fast Delivery
                                    </span>
                                </div>
                            </div>

                            <div
                                className="
                                    bg-[var(--primary-light)]
                                    rounded-xl
                                    p-3
                                "
                            >
                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                        text-[var(--primary)]
                                    "
                                >
                                    <ShieldCheck size={18} />

                                    <span
                                        className="
                                            text-xs
                                            font-bold
                                        "
                                    >
                                        Quality Assured
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ==================================
                            CART SECTION
                        ================================== */}

                        <div className="mt-7">

                            {stock > 0 && quantity > 0 ? (
                                <div>

                                    <div
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            h-14
                                            border-2
                                            border-[var(--primary)]
                                            rounded-2xl
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
                                                w-16
                                                h-full
                                                bg-[var(--primary-light)]
                                                hover:bg-gray-100
                                                flex
                                                items-center
                                                justify-center
                                                text-[var(--primary)]
                                                transition
                                            "
                                        >
                                            <Minus size={20} />
                                        </button>

                                        <div className="text-center">
                                            <span
                                                className="
                                                    block
                                                    text-lg
                                                    font-extrabold
                                                    text-[var(--text-main)]
                                                "
                                            >
                                                {quantity}
                                            </span>

                                            <span
                                                className="
                                                    block
                                                    text-[10px]
                                                    text-gray-400
                                                    font-medium
                                                "
                                            >
                                                In Cart
                                            </span>
                                        </div>

                                        <button
                                            onClick={() =>
                                                increaseQuantity(
                                                    product.id
                                                )
                                            }
                                            disabled={
                                                quantity >= stock
                                            }
                                            className="
                                                w-16
                                                h-full
                                                bg-[var(--primary)]
                                                hover:bg-[var(--primary-dark)]
                                                disabled:bg-gray-300
                                                text-white
                                                flex
                                                items-center
                                                justify-center
                                                transition
                                            "
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    {quantity >= stock && (
                                        <p
                                            className="
                                                text-center
                                                text-xs
                                                text-gray-400
                                                mt-2
                                            "
                                        >
                                            Maximum available quantity
                                            reached
                                        </p>
                                    )}
                                </div>
                            ) : stock > 0 ? (
                                <button
                                    onClick={handleAddToCart}
                                    className="
                                        w-full
                                        h-14
                                        bg-[var(--primary)]
                                        hover:bg-[var(--primary-dark)]
                                        text-white
                                        rounded-2xl
                                        font-bold
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        shadow-lg
                                        shadow-black/10
                                        active:scale-[0.98]
                                        transition
                                    "
                                >
                                    <ShoppingCart size={21} />

                                    Add to Cart

                                    <span className="opacity-70">
                                        •
                                    </span>

                                    <span>
                                        ₹{finalPrice}
                                    </span>
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="
                                        w-full
                                        h-14
                                        bg-gray-200
                                        text-gray-500
                                        rounded-2xl
                                        font-bold
                                        cursor-not-allowed
                                    "
                                >
                                    Out of Stock
                                </button>
                            )}
                        </div>

                        {/* CART LINK */}

                        {quantity > 0 && (
                            <button
                                onClick={() =>
                                    navigate("/cart")
                                }
                                className="
                                    w-full
                                    mt-3
                                    h-11
                                    rounded-xl
                                    border
                                    border-gray-200
                                    text-[var(--primary)]
                                    text-sm
                                    font-semibold
                                    hover:bg-[var(--primary-light)]
                                    transition
                                "
                            >
                                View Cart →
                            </button>
                        )}
                    </div>
                </div>
                <OfferStrip />
                <DealsSection />
                <Banner />
            </div>
        </main>
    );
}

export default ProductDetails;