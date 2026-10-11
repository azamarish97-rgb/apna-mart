
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { supabase } from "./supabase";
import { useCart } from "./cartcontext";
import { useSearchParams, useNavigate } from "react-router-dom";

function AllProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const selectedCategory = searchParams.get("category");

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
    const requestIdRef = useRef(0);

    // Change this to 5 products per request
    const BATCH_SIZE = 5;

    // Fetch only the columns needed by the product cards
    const PRODUCT_COLUMNS =
        "id, name, price, offer_price, stock, category, weight, description, image_url, created_at";

    // =====================================================
    // DISCOUNT
    // =====================================================

    const getDiscount = (price, offerPrice) => {
        if (
            price == null ||
            offerPrice == null ||
            Number(price) <= 0 ||
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
            // Ignore duplicate requests
            if (!reset && loadingRef.current) {
                return;
            }

            if (!reset && !hasMoreRef.current) {
                return;
            }

            // A new category/load cancels older results
            if (reset) {
                requestIdRef.current += 1;
                loadingRef.current = false;

                pageRef.current = 0;
                hasMoreRef.current = true;

                setProducts([]);
                setHasMore(true);
                setFetchError(false);
                setLoading(true);
                setLoadingMore(false);
            }

            loadingRef.current = true;

            const requestId = requestIdRef.current;

            if (!reset) {
                setLoadingMore(true);
            }

            const from = pageRef.current * BATCH_SIZE;
            const to = from + BATCH_SIZE - 1;

            console.log(
                "Loading products:",
                from,
                "to",
                to
            );

            try {
                let query = supabase
                    .from("products")
                    .select(PRODUCT_COLUMNS)
                    .eq("is_active", true)
                    .order("created_at", {
                        ascending: false,
                    })
                    .range(from, to);

                if (selectedCategory) {
                    query = query.eq(
                        "category",
                        selectedCategory
                    );
                }

                const { data, error } = await query;

                // Ignore outdated category requests
                if (requestId !== requestIdRef.current) {
                    return;
                }

                if (error) {
                    console.error(
                        "SUPABASE PRODUCTS ERROR:",
                        error
                    );

                    setFetchError(true);
                    setHasMore(false);
                    hasMoreRef.current = false;
                    return;
                }

                const newProducts = data || [];

                console.log(
                    "Products received:",
                    newProducts.length
                );

                if (reset) {
                    setProducts(newProducts);
                } else {
                    setProducts((previous) => [
                        ...previous,
                        ...newProducts,
                    ]);
                }

                // Advance the page after a successful request
                pageRef.current += 1;

                const moreAvailable =
                    newProducts.length === BATCH_SIZE;

                hasMoreRef.current = moreAvailable;
                setHasMore(moreAvailable);

                if (!moreAvailable) {
                    console.log("All products loaded");
                }
            } catch (error) {
                if (requestId === requestIdRef.current) {
                    console.error(
                        "PRODUCT FETCH ERROR:",
                        error
                    );
                    setFetchError(true);
                }
            } finally {
                // Old requests must not reset new request state
                if (requestId === requestIdRef.current) {
                    loadingRef.current = false;
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        },
        [selectedCategory]
    );

    // =====================================================
    // FIRST LOAD / CATEGORY CHANGE
    // =====================================================

    useEffect(() => {
        loadProducts(true);

        return () => {
            // Invalidate any outstanding request
            requestIdRef.current += 1;
            loadingRef.current = false;
        };
    }, [loadProducts]);

    // =====================================================
    // INFINITE SCROLL
    // =====================================================

    useEffect(() => {
        const handleScroll = () => {
            if (loadingRef.current) return;
            if (!hasMoreRef.current) return;

            const scrollTop = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight =
                document.documentElement.scrollHeight;

            const distanceFromBottom =
                documentHeight - (scrollTop + windowHeight);

            // Fetch the next batch near the bottom
            if (distanceFromBottom <= 500) {
                loadProducts(false);
            }
        };

        window.addEventListener(
            "scroll",
            handleScroll,
            { passive: true }
        );

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll
            );
        };
    }, [loadProducts]);

    // =====================================================
    // PRODUCT NAVIGATION
    // =====================================================

    const openProduct = (productId) => {
        navigate(`/product/${productId}`);
    };

    // =====================================================
    // INITIAL LOADING
    // =====================================================

    if (loading) {
        return (
            <main className="min-h-screen bg-[var(--page-bg)] px-5 py-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-gray-300 border-t-[var(--primary)] rounded-full animate-spin mx-auto" />

                            <h2 className="text-lg font-semibold text-[var(--text-main)] mt-4">
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
        <main className="bg-[var(--page-bg)] min-h-screen px-4 sm:px-5 py-8 sm:py-10">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}

                <div className="mb-7 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)]">
                        {selectedCategory
                            ? `${selectedCategory} 🛒`
                            : "All Products 🛒"}
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Fresh products at the best prices
                    </p>
                </div>

                {/* ERROR */}

                {fetchError ? (
                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                        <div className="text-5xl mb-4">⚠️</div>

                        <h2 className="text-xl font-bold text-[var(--text-main)]">
                            Unable to load products
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Please check your connection and try again.
                        </p>

                        <button
                            onClick={() => loadProducts(true)}
                            className="mt-5 bg-[var(--primary)] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[var(--primary-dark)]"
                        >
                            Try Again
                        </button>
                    </div>
                ) : products.length === 0 ? (
                    /* NO PRODUCTS */

                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                        <div className="text-6xl mb-4">📦</div>

                        <h2 className="text-xl font-bold text-[var(--text-main)]">
                            No products available
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Please check again later.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* PRODUCT GRID */}

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                            {products.map((product) => {
                                const discount = getDiscount(
                                    product.price,
                                    product.offer_price
                                );

                                const hasOffer =
                                    product.offer_price != null &&
                                    Number(product.offer_price) <
                                    Number(product.price);

                                const stock = Math.max(
                                    0,
                                    Number(product.stock) || 0
                                );

                                const cartItem = cart.find(
                                    (item) => item.id === product.id
                                );

                                return (
                                    <div
                                        key={product.id}
                                        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300 border border-gray-100"
                                    >
                                        {/* CLICKABLE PRODUCT AREA */}

                                        <div
                                            onClick={() =>
                                                openProduct(product.id)
                                            }
                                            className="cursor-pointer"
                                        >
                                            {/* IMAGE */}

                                            <div className="relative h-40 sm:h-48 bg-[var(--primary-light)] flex items-center justify-center overflow-hidden">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name || "Product"}
                                                        loading="lazy"
                                                        decoding="async"
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

                                                {/* DISCOUNT */}

                                                {hasOffer && discount > 0 && (
                                                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs sm:text-sm font-bold px-2 py-1 rounded-lg">
                                                        {discount}% OFF
                                                    </span>
                                                )}
                                            </div>

                                            {/* CONTENT */}

                                            <div className="p-3 sm:p-4">
                                                <p className="text-xs sm:text-sm text-gray-500 truncate">
                                                    {product.category || "Grocery"}
                                                </p>

                                                <h2 className="font-semibold text-base sm:text-lg text-[var(--text-main)] mt-1 line-clamp-2 min-h-[40px]">
                                                    {product.name}
                                                </h2>

                                                {product.weight && (
                                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                                        {product.weight}
                                                    </p>
                                                )}

                                                {product.description && (
                                                    <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-2">
                                                        {product.description}
                                                    </p>
                                                )}

                                                {/* PRICE */}

                                                <div className="mt-3">
                                                    {hasOffer ? (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-lg sm:text-xl font-bold text-[var(--primary)]">
                                                                ₹{product.offer_price}
                                                            </span>

                                                            <span className="text-xs sm:text-sm text-gray-400 line-through">
                                                                ₹{product.price}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-lg sm:text-xl font-bold text-[var(--primary)]">
                                                            ₹{product.price}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* STOCK */}

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
                                            </div>
                                        </div>

                                        {/* CART CONTROLS */}

                                        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                                            {stock > 0 && cartItem ? (
                                                <div className="flex items-center justify-between border border-gray-200 rounded-xl overflow-hidden">
                                                    <button
                                                        onClick={() =>
                                                            decreaseQuantity(product.id)
                                                        }
                                                        className="w-10 sm:w-12 py-2.5 bg-gray-100 text-xl font-bold text-gray-700 hover:bg-gray-200 transition"
                                                    >
                                                        −
                                                    </button>

                                                    <span className="font-bold text-[var(--text-main)]">
                                                        {cartItem.quantity}
                                                    </span>

                                                    <button
                                                        onClick={() =>
                                                            increaseQuantity(product.id)
                                                        }
                                                        disabled={
                                                            cartItem.quantity >= stock
                                                        }
                                                        className="w-10 sm:w-12 py-2.5 bg-[var(--primary)] text-white text-xl font-bold hover:bg-[var(--primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            ) : stock > 0 ? (
                                                <button
                                                    onClick={() =>
                                                        addToCart(product)
                                                    }
                                                    className="w-full bg-[var(--primary)] text-white py-2.5 rounded-xl font-semibold hover:bg-[var(--primary-dark)] active:scale-95 transition"
                                                >
                                                    🛒 Add to Cart
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="w-full bg-gray-200 text-gray-500 py-2.5 rounded-xl font-semibold cursor-not-allowed"
                                                >
                                                    Out of Stock
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* LOADING MORE */}

                        {loadingMore && (
                            <div className="w-full py-10 flex flex-col items-center justify-center">
                                <div className="w-8 h-8 border-4 border-gray-300 border-t-[var(--primary)] rounded-full animate-spin" />

                                <p className="text-sm text-gray-500 mt-3">
                                    Loading more products...
                                </p>
                            </div>
                        )}

                        {/* RETRY LOAD MORE */}

                        {!loadingMore && hasMore && (
                            <div className="text-center py-5">
                                <button
                                    onClick={() => loadProducts(false)}
                                    className="text-[var(--primary)] font-semibold hover:underline"
                                >
                                    Load more products
                                </button>
                            </div>
                        )}

                        {/* ALL LOADED */}

                        {!loadingMore && !hasMore && (
                            <div className="w-full py-10 text-center">
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
