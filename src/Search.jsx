import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useCart } from "./cartcontext";

function Search() {
    const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();

    const [search, setSearch] = useState("");
    const [products, setProducts] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listening, setListening] = useState(false);

    // ==============================
    // FETCH PRODUCTS
    // ==============================
    useEffect(() => {
        fetchProducts();

        const savedSearches = JSON.parse(
            localStorage.getItem("apnaMartRecentSearches") || "[]"
        );

        setRecentSearches(savedSearches);
    }, []);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("is_active", true);

        if (error) {
            console.error("SEARCH PRODUCTS ERROR:", error);
            setLoading(false);
            return;
        }

        setProducts(data || []);
        setLoading(false);
    };

    // ==============================
    // SAVE RECENT SEARCH
    // ==============================
    const saveRecentSearch = (value) => {
        const text = value.trim();

        if (!text) return;

        const oldSearches = JSON.parse(
            localStorage.getItem("apnaMartRecentSearches") || "[]"
        );

        const updatedSearches = [
            text,
            ...oldSearches.filter(
                (item) => item.toLowerCase() !== text.toLowerCase()
            ),
        ].slice(0, 5);

        localStorage.setItem(
            "apnaMartRecentSearches",
            JSON.stringify(updatedSearches)
        );

        setRecentSearches(updatedSearches);
    };

    // ==============================
    // SEARCH CHANGE
    // ==============================
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    // ==============================
    // SEARCH ENTER
    // ==============================
    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            saveRecentSearch(search);
        }
    };

    // ==============================
    // CLEAR SEARCH
    // ==============================
    const clearSearch = () => {
        setSearch("");
    };

    // ==============================
    // RECENT SEARCH CLICK
    // ==============================
    const selectRecentSearch = (item) => {
        setSearch(item);
        saveRecentSearch(item);
    };

    // ==============================
    // CLEAR RECENT SEARCHES
    // ==============================
    const clearRecentSearches = () => {
        localStorage.removeItem("apnaMartRecentSearches");
        setRecentSearches([]);
    };

    // ==============================
    // VOICE SEARCH
    // ==============================
    const startVoiceSearch = () => {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Voice search is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();

        recognition.lang = "en-IN";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setListening(true);
        };

        recognition.onresult = (event) => {
            const voiceText =
                event.results[0][0].transcript
                    .trim()
                    .replace(/[.,!?;:]+$/g, "");

            setSearch(voiceText);
            saveRecentSearch(voiceText);
        };

        recognition.onerror = (event) => {
            console.error("VOICE SEARCH ERROR:", event.error);
            setListening(false);
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognition.start();
    };

    // ==============================
    // INTELLIGENT SEARCH
    // ==============================
    const filteredProducts = products
        .map((product) => {
            const name = product.name?.toLowerCase() || "";
            const category =
                product.category?.toLowerCase() || "";
            const description =
                product.description?.toLowerCase() || "";

            const text = search.toLowerCase().trim();

            let score = 0;

            if (!text) {
                return {
                    ...product,
                    searchScore: 0,
                };
            }

            // Exact product name
            if (name === text) {
                score += 100;
            }

            // Name starts with search
            if (name.startsWith(text)) {
                score += 60;
            }

            // Name contains search
            if (name.includes(text)) {
                score += 40;
            }

            // Category match
            if (category.includes(text)) {
                score += 25;
            }

            // Description match
            if (description.includes(text)) {
                score += 15;
            }

            // Word-by-word matching
            const words = text.split(/\s+/);

            words.forEach((word) => {
                if (name.includes(word)) {
                    score += 10;
                }

                if (category.includes(word)) {
                    score += 5;
                }

                if (description.includes(word)) {
                    score += 3;
                }
            });

            return {
                ...product,
                searchScore: score,
            };
        })
        .filter((product) => product.searchScore > 0)
        .sort((a, b) => b.searchScore - a.searchScore);

    // ==============================
    // SUGGESTIONS
    // ==============================
    const suggestions =
        search.trim().length > 0
            ? products
                .filter((product) => {
                    const text = search.toLowerCase();

                    return (
                        product.name
                            ?.toLowerCase()
                            .includes(text) ||
                        product.category
                            ?.toLowerCase()
                            .includes(text)
                    );
                })
                .slice(0, 5)
            : [];

    // ==============================
    // GET CART QUANTITY
    // ==============================
    const getQuantity = (productId) => {
        const item = cart.find(
            (item) => item.id === productId
        );

        return item?.quantity || 0;
    };

    // ==============================
    // DISCOUNT
    // ==============================
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

    return (
        <div className="min-h-screen bg-gray-100 px-3 py-4 sm:px-5">

            {/* =================================
                SEARCH HEADER
            ================================= */}
            <div className="max-w-5xl mx-auto">

                <div className="bg-white rounded-2xl shadow-sm p-3">

                    <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 h-12">

                        {/* Search Icon */}
                        <span className="text-gray-400 text-lg">
                            🔍
                        </span>

                        {/* Input */}
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search for products..."
                            autoFocus
                            className="flex-1 h-full outline-none text-gray-700 text-sm sm:text-base"
                        />

                        {/* Clear Button */}
                        {search && (
                            <button
                                onClick={clearSearch}
                                className="text-gray-400 hover:text-gray-700 text-lg px-1"
                            >
                                ✕
                            </button>
                        )}

                        {/* Voice Button */}
                        <button
                            onClick={startVoiceSearch}
                            className={`text-lg px-1 transition ${listening
                                    ? "text-red-500 scale-110"
                                    : "text-gray-500 hover:text-blue-600"
                                }`}
                            title="Voice Search"
                        >
                            🎤
                        </button>
                    </div>

                    {/* Voice Status */}
                    {listening && (
                        <p className="text-center text-red-500 text-sm mt-2">
                            🎤 Listening...
                        </p>
                    )}

                </div>

                {/* =================================
                    SUGGESTIONS
                ================================= */}
                {search.trim() &&
                    suggestions.length > 0 && (
                        <div className="bg-white mt-2 rounded-xl shadow-md overflow-hidden">

                            {suggestions.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() =>
                                        setSearch(product.name)
                                    }
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 border-b last:border-b-0"
                                >
                                    <span>🔍</span>

                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {product.name}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            {product.category}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                {/* =================================
                    RECENT SEARCHES
                ================================= */}
                {!search &&
                    recentSearches.length > 0 && (
                        <div className="bg-white mt-3 rounded-xl shadow-sm p-4">

                            <div className="flex justify-between items-center mb-3">

                                <h3 className="font-semibold text-gray-800">
                                    Recent Searches
                                </h3>

                                <button
                                    onClick={clearRecentSearches}
                                    className="text-sm text-red-500 hover:text-red-600"
                                >
                                    Clear All
                                </button>

                            </div>

                            <div className="flex flex-wrap gap-2">

                                {recentSearches.map(
                                    (item, index) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                selectRecentSearch(
                                                    item
                                                )
                                            }
                                            className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full text-sm text-gray-700"
                                        >
                                            🕘 {item}
                                        </button>
                                    )
                                )}

                            </div>
                        </div>
                    )}

                {/* =================================
                    LOADING
                ================================= */}
                {loading && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">
                            Loading products...
                        </p>
                    </div>
                )}

                {/* =================================
                    EMPTY SEARCH
                ================================= */}
                {!loading && !search && (
                    <div className="text-center py-12">

                        <div className="text-5xl mb-4">
                            🔍
                        </div>

                        <h2 className="text-xl font-semibold text-gray-700">
                            Search for products
                        </h2>

                        <p className="text-gray-500 text-sm mt-2">
                            Find groceries, fruits, vegetables
                            and more
                        </p>

                    </div>
                )}

                {/* =================================
                    NO RESULT
                ================================= */}
                {!loading &&
                    search &&
                    filteredProducts.length === 0 && (
                        <div className="text-center py-12">

                            <div className="text-5xl mb-4">
                                😕
                            </div>

                            <h2 className="text-xl font-semibold text-gray-700">
                                No products found
                            </h2>

                            <p className="text-gray-500 text-sm mt-2">
                                Try searching with another word
                            </p>

                        </div>
                    )}

                {/* =================================
                    RESULT COUNT
                ================================= */}
                {!loading &&
                    search &&
                    filteredProducts.length > 0 && (
                        <div className="mt-5 mb-3">

                            <h2 className="font-semibold text-gray-800">
                                Search Results
                            </h2>

                            <p className="text-sm text-gray-500">
                                {filteredProducts.length}{" "}
                                products found
                            </p>

                        </div>
                    )}

                {/* =================================
                    PRODUCT GRID
                ================================= */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">

                    {filteredProducts.map((product) => {

                        const quantity = getQuantity(
                            product.id
                        );

                        const discount = getDiscount(
                            product.price,
                            product.offer_price
                        );

                        const finalPrice =
                            product.offer_price &&
                                Number(product.offer_price) <
                                Number(product.price)
                                ? product.offer_price
                                : product.price;

                        return (
                            <div
                                key={product.id}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                            >

                                {/* Image */}
                                <div className="relative">

                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-36 sm:h-44 object-cover"
                                    />

                                    {discount > 0 && (
                                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                                            {discount}% OFF
                                        </span>
                                    )}

                                </div>

                                {/* Product Info */}
                                <div className="p-3">

                                    <h2 className="font-semibold text-gray-800 line-clamp-2 min-h-[40px]">
                                        {product.name}
                                    </h2>

                                    <p className="text-xs text-gray-500 mt-1">
                                        {product.category}
                                    </p>

                                    {/* Price */}
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">

                                        <span className="font-bold text-lg text-gray-900">
                                            ₹{finalPrice}
                                        </span>

                                        {discount > 0 && (
                                            <span className="text-xs text-gray-400 line-through">
                                                ₹{product.price}
                                            </span>
                                        )}

                                    </div>

                                    {/* Stock */}
                                    {product.stock > 0 ? (
                                        <p className="text-green-600 text-xs mt-1">
                                            {product.stock} available
                                        </p>
                                    ) : (
                                        <p className="text-red-500 text-xs mt-1">
                                            Out of Stock
                                        </p>
                                    )}

                                    {/* Description */}
                                    {product.description && (
                                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                            {product.description}
                                        </p>
                                    )}

                                    {/* Cart Controls */}
                                    {product.stock > 0 && (
                                        <div className="mt-3">

                                            {quantity === 0 ? (
                                                <button
                                                    onClick={() =>
                                                        addToCart(
                                                            product
                                                        )
                                                    }
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition"
                                                >
                                                    🛒 Add to Cart
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl overflow-hidden">

                                                    <button
                                                        onClick={() =>
                                                            decreaseQuantity(
                                                                product.id
                                                            )
                                                        }
                                                        className="w-10 h-10 text-xl font-bold text-blue-600 hover:bg-blue-100"
                                                    >
                                                        −
                                                    </button>

                                                    <span className="font-bold text-blue-700">
                                                        {quantity}
                                                    </span>

                                                    <button
                                                        onClick={() => {
                                                            if (
                                                                quantity <
                                                                product.stock
                                                            ) {
                                                                increaseQuantity(
                                                                    product.id
                                                                );
                                                            }
                                                        }}
                                                        disabled={
                                                            quantity >=
                                                            product.stock
                                                        }
                                                        className={`w-10 h-10 text-xl font-bold ${quantity >=
                                                                product.stock
                                                                ? "text-gray-300 cursor-not-allowed"
                                                                : "text-blue-600 hover:bg-blue-100"
                                                            }`}
                                                    >
                                                        +
                                                    </button>

                                                </div>
                                            )}

                                        </div>
                                    )}

                                </div>

                            </div>
                        );
                    })}

                </div>

            </div>
        </div>
    );
}

export default Search;