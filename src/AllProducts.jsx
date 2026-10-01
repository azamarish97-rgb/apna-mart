import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { supabase } from "./supabase";
import { useCart } from "./cartcontext";

import { useSearchParams } from "react-router-dom";

function AllProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const [searchParams] = useSearchParams();

    const selectedCategory =
        searchParams.get("category");

    const {
        cart,
        addToCart,
        decreaseQuantity,
        increaseQuantity,
    } = useCart();

    // =====================================================
    // REFS
    // =====================================================

    const pageRef = useRef(0);
    const loadingRef = useRef(false);
    const hasMoreRef = useRef(true);

    const BATCH_SIZE = 20;

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
    // LOAD PRODUCTS
    // =====================================================

    const loadProducts = useCallback(
        async (reset = false) => {
            if (loadingRef.current) {
                return;
            }

            if (
                !reset &&
                !hasMoreRef.current
            ) {
                return;
            }

            loadingRef.current = true;

            if (reset) {
                pageRef.current = 0;
                hasMoreRef.current = true;
                setHasMore(true);
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const from =
                pageRef.current *
                BATCH_SIZE;

            const to =
                from +
                BATCH_SIZE -
                1;

            console.log(
                "🔥 Loading products:",
                from,
                "to",
                to
            );

            let query = supabase
                .from("products")
                .select("*")
                .eq("is_active", true)
                .order("created_at", {
                    ascending: false,
                })
                .range(from, to);

            // =================================================
            // CATEGORY FILTER
            // =================================================

            if (selectedCategory) {
                query = query.eq(
                    "category",
                    selectedCategory
                );
            }

            const {
                data,
                error,
            } = await query;

            // =================================================
            // ERROR
            // =================================================

            if (error) {
                console.error(
                    "❌ SUPABASE PRODUCTS ERROR:",
                    error
                );

                setLoading(false);
                setLoadingMore(false);
                loadingRef.current = false;

                return;
            }

            const newProducts =
                data || [];

            console.log(
                "✅ Products received:",
                newProducts.length
            );

            // =================================================
            // ADD PRODUCTS
            // =================================================

            if (reset) {
                setProducts(
                    newProducts
                );
            } else {
                setProducts(
                    (previous) => [
                        ...previous,
                        ...newProducts,
                    ]
                );
            }

            // =================================================
            // CHECK MORE
            // =================================================

            if (
                newProducts.length <
                BATCH_SIZE
            ) {
                hasMoreRef.current = false;
                setHasMore(false);

                console.log(
                    "🎉 ALL PRODUCTS LOADED"
                );
            } else {
                pageRef.current += 1;

                hasMoreRef.current = true;
                setHasMore(true);

                console.log(
                    "➡️ Next page:",
                    pageRef.current
                );
            }

            setLoading(false);
            setLoadingMore(false);
            loadingRef.current = false;
        },
        [selectedCategory]
    );

    // =====================================================
    // FIRST LOAD
    // =====================================================

    useEffect(() => {
        setProducts([]);

        pageRef.current = 0;
        hasMoreRef.current = true;

        setHasMore(true);

        loadProducts(true);
    }, [
        selectedCategory,
        loadProducts,
    ]);

    // =====================================================
    // INFINITE SCROLL
    // =====================================================

    useEffect(() => {
        const handleScroll = () => {
            if (loadingRef.current) {
                return;
            }

            if (!hasMoreRef.current) {
                return;
            }

            const scrollTop =
                window.scrollY;

            const windowHeight =
                window.innerHeight;

            const documentHeight =
                document.documentElement
                    .scrollHeight;

            const distanceFromBottom =
                documentHeight -
                (scrollTop +
                    windowHeight);

            // 800px before bottom
            if (
                distanceFromBottom <=
                800
            ) {
                console.log(
                    "🚀 SCROLL TRIGGERED"
                );

                loadProducts(false);
            }
        };

        window.addEventListener(
            "scroll",
            handleScroll,
            {
                passive: true,
            }
        );

        // Initial check
        handleScroll();

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll
            );
        };
    }, [loadProducts]);

    // =====================================================
    // INITIAL LOADING
    // =====================================================

    if (loading) {
        return (
            <main
                className="
                    min-h-screen
                    bg-[var(--page-bg)]
                    px-5
                    py-10
                "
            >
                <div className="max-w-7xl mx-auto">

                    <div className="
                        flex
                        justify-center
                        items-center
                        py-20
                    ">

                        <div className="text-center">

                            <div
                                className="
                                    w-10
                                    h-10
                                    border-4
                                    border-gray-300
                                    border-t-[var(--primary)]
                                    rounded-full
                                    animate-spin
                                    mx-auto
                                "
                            />

                            <h2
                                className="
                                    text-lg
                                    font-semibold
                                    text-[var(--text-main)]
                                    mt-4
                                "
                            >
                                Loading products...
                            </h2>

                        </div>

                    </div>

                </div>
            </main>
        );
    }

    // =====================================================
    // MAIN UI
    // =====================================================

    return (
        <main
            className="
                bg-[var(--page-bg)]
                min-h-screen
                px-4
                sm:px-5
                py-8
                sm:py-10
            "
        >

            <div className="max-w-7xl mx-auto">

                {/* HEADER */}

                <div className="mb-7 sm:mb-8">

                    <h1
                        className="
                            text-2xl
                            sm:text-3xl
                            font-bold
                            text-[var(--text-main)]
                        "
                    >
                        {selectedCategory
                            ? `${selectedCategory} 🛒`
                            : "All Products 🛒"}
                    </h1>

                    <p
                        className="
                            text-gray-500
                            mt-1
                        "
                    >
                        Fresh products at the best prices
                    </p>

                </div>

                {/* NO PRODUCTS */}

                {products.length === 0 ? (

                    <div
                        className="
                            bg-white
                            rounded-2xl
                            p-10
                            text-center
                            shadow-sm
                        "
                    >

                        <div className="text-6xl mb-4">
                            📦
                        </div>

                        <h2
                            className="
                                text-xl
                                font-bold
                                text-[var(--text-main)]
                            "
                        >
                            No products available
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Please check again later.
                        </p>

                    </div>

                ) : (

                    <>

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

                            {products.map(
                                (product) => {

                                    const discount =
                                        getDiscount(
                                            product.price,
                                            product.offer_price
                                        );

                                    const hasOffer =
                                        product.offer_price !== null &&
                                        Number(
                                            product.offer_price
                                        ) <
                                        Number(
                                            product.price
                                        );

                                    const stock =
                                        Number(
                                            product.stock
                                        );

                                    const cartItem =
                                        cart.find(
                                            (item) =>
                                                item.id ===
                                                product.id
                                        );

                                    return (

                                        <div
                                            key={
                                                product.id
                                            }
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
                                                    h-40
                                                    sm:h-48
                                                    bg-[var(--primary-light)]
                                                    flex
                                                    items-center
                                                    justify-center
                                                    overflow-hidden
                                                "
                                            >

                                                {product.image_url ? (

                                                    <img
                                                        src={
                                                            product.image_url
                                                        }
                                                        alt={
                                                            product.name
                                                        }
                                                        loading="lazy"
                                                        className="
                                                            w-full
                                                            h-full
                                                            object-cover
                                                            hover:scale-105
                                                            transition
                                                            duration-300
                                                        "
                                                        onError={(
                                                            e
                                                        ) => {
                                                            e.currentTarget.style.display =
                                                                "none";
                                                        }}
                                                    />

                                                ) : (

                                                    <span className="text-5xl">
                                                        🛒
                                                    </span>

                                                )}

                                                {/* DISCOUNT */}

                                                {hasOffer &&
                                                    discount >
                                                    0 && (

                                                        <span
                                                            className="
                                                                absolute
                                                                top-2
                                                                left-2
                                                                bg-red-500
                                                                text-white
                                                                text-xs
                                                                sm:text-sm
                                                                font-bold
                                                                px-2
                                                                py-1
                                                                rounded-lg
                                                            "
                                                        >
                                                            {
                                                                discount
                                                            }%
                                                            OFF
                                                        </span>

                                                    )}

                                            </div>

                                            {/* CONTENT */}

                                            <div className="p-3 sm:p-4">

                                                {/* CATEGORY */}

                                                <p
                                                    className="
                                                        text-xs
                                                        sm:text-sm
                                                        text-gray-500
                                                        truncate
                                                    "
                                                >
                                                    {product.category ||
                                                        "Grocery"}
                                                </p>

                                                {/* NAME */}

                                                <h2
                                                    className="
                                                        font-semibold
                                                        text-base
                                                        sm:text-lg
                                                        text-[var(--text-main)]
                                                        mt-1
                                                        line-clamp-2
                                                        min-h-[40px]
                                                    "
                                                >
                                                    {
                                                        product.name
                                                    }
                                                </h2>

                                                {/* WEIGHT */}

                                                {product.weight && (

                                                    <p
                                                        className="
                                                            text-xs
                                                            sm:text-sm
                                                            text-gray-500
                                                            mt-1
                                                        "
                                                    >
                                                        {
                                                            product.weight
                                                        }
                                                    </p>

                                                )}

                                                {/* DESCRIPTION */}

                                                {product.description && (

                                                    <p
                                                        className="
                                                            text-xs
                                                            sm:text-sm
                                                            text-gray-500
                                                            mt-2
                                                            line-clamp-2
                                                        "
                                                    >
                                                        {
                                                            product.description
                                                        }
                                                    </p>

                                                )}

                                                {/* PRICE */}

                                                <div className="mt-3">

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
                                                                    text-lg
                                                                    sm:text-xl
                                                                    font-bold
                                                                    text-[var(--primary)]
                                                                "
                                                            >
                                                                ₹
                                                                {
                                                                    product.offer_price
                                                                }
                                                            </span>

                                                            <span
                                                                className="
                                                                    text-xs
                                                                    sm:text-sm
                                                                    text-gray-400
                                                                    line-through
                                                                "
                                                            >
                                                                ₹
                                                                {
                                                                    product.price
                                                                }
                                                            </span>

                                                        </div>

                                                    ) : (

                                                        <span
                                                            className="
                                                                text-lg
                                                                sm:text-xl
                                                                font-bold
                                                                text-[var(--primary)]
                                                            "
                                                        >
                                                            ₹
                                                            {
                                                                product.price
                                                            }
                                                        </span>

                                                    )}

                                                </div>

                                                {/* STOCK */}

                                                <div className="mt-2">

                                                    {stock > 0 ? (

                                                        <p
                                                            className="
                                                                text-xs
                                                                sm:text-sm
                                                                text-gray-600
                                                            "
                                                        >
                                                            📦 Stock:{" "}
                                                            {
                                                                stock
                                                            }
                                                        </p>

                                                    ) : (

                                                        <p
                                                            className="
                                                                text-xs
                                                                sm:text-sm
                                                                font-semibold
                                                                text-red-600
                                                            "
                                                        >
                                                            ❌ Out of Stock
                                                        </p>

                                                    )}

                                                </div>

                                                {/* CART */}

                                                {stock > 0 &&
                                                    cartItem ? (

                                                    <div
                                                        className="
                                                            flex
                                                            items-center
                                                            justify-between
                                                            mt-4
                                                            border
                                                            border-gray-200
                                                            rounded-xl
                                                            overflow-hidden
                                                        "
                                                    >

                                                        {/* MINUS */}

                                                        <button
                                                            onClick={() =>
                                                                decreaseQuantity(
                                                                    product.id
                                                                )
                                                            }
                                                            className="
                                                                w-10
                                                                sm:w-12
                                                                py-2.5
                                                                bg-gray-100
                                                                text-xl
                                                                font-bold
                                                                text-gray-700
                                                                hover:bg-gray-200
                                                                transition
                                                            "
                                                        >
                                                            −
                                                        </button>

                                                        {/* QUANTITY */}

                                                        <span
                                                            className="
                                                                font-bold
                                                                text-[var(--text-main)]
                                                            "
                                                        >
                                                            {
                                                                cartItem.quantity
                                                            }
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
                                                            className="
                                                                w-10
                                                                sm:w-12
                                                                py-2.5
                                                                bg-[var(--primary)]
                                                                text-white
                                                                text-xl
                                                                font-bold
                                                                hover:bg-[var(--primary-dark)]
                                                                disabled:bg-gray-300
                                                                disabled:cursor-not-allowed
                                                                transition
                                                            "
                                                        >
                                                            +
                                                        </button>

                                                    </div>

                                                ) : stock > 0 ? (

                                                    <button
                                                        onClick={() =>
                                                            addToCart(
                                                                product
                                                            )
                                                        }
                                                        className="
                                                            w-full
                                                            mt-4
                                                            bg-[var(--primary)]
                                                            text-white
                                                            py-2.5
                                                            rounded-xl
                                                            font-semibold
                                                            hover:bg-[var(--primary-dark)]
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
                                                            mt-4
                                                            bg-gray-200
                                                            text-gray-500
                                                            py-2.5
                                                            rounded-xl
                                                            font-semibold
                                                            cursor-not-allowed
                                                        "
                                                    >
                                                        Out of Stock
                                                    </button>

                                                )}

                                            </div>

                                        </div>

                                    );
                                }
                            )}

                        </div>

                        {/* LOADING MORE */}

                        {loadingMore && (

                            <div
                                className="
                                    w-full
                                    py-10
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                "
                            >

                                <div
                                    className="
                                        w-8
                                        h-8
                                        border-4
                                        border-gray-300
                                        border-t-[var(--primary)]
                                        rounded-full
                                        animate-spin
                                    "
                                />

                                <p
                                    className="
                                        text-sm
                                        text-gray-500
                                        mt-3
                                    "
                                >
                                    Loading more products...
                                </p>

                            </div>

                        )}

                        {/* ALL LOADED */}

                        {!loadingMore &&
                            !hasMore && (

                                <div
                                    className="
                                        w-full
                                        py-10
                                        text-center
                                    "
                                >

                                    <p className="text-sm text-gray-500">
                                        🎉 All products loaded
                                    </p>

                                </div>

                            )}

                    </>

                )}

            </div>

        </main>
    );
}

export default AllProducts;