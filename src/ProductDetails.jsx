import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ShoppingCart,
    Plus,
    Minus,
    Package,
    Truck,
    ShieldCheck,
    BadgePercent,
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
    const [imageFailed, setImageFailed] = useState(false);
    const [descOpen, setDescOpen] = useState(false);

    // Fetch product
    useEffect(() => {
        const getProduct = async () => {
            setLoading(true);
            setImageFailed(false);
            setDescOpen(false);

            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", id)
                .eq("is_active", true)
                .single();

            if (error) {
                console.error("PRODUCT DETAILS ERROR:", error);
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

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
                <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
                    <div className="aspect-square animate-pulse rounded-[2rem] bg-slate-200" />
                    <div className="space-y-5 rounded-[2rem] bg-white p-6 shadow-sm sm:p-8">
                        <div className="h-6 w-28 animate-pulse rounded-full bg-slate-200" />
                        <div className="h-10 w-4/5 animate-pulse rounded-xl bg-slate-200" />
                        <div className="h-7 w-1/3 animate-pulse rounded-lg bg-slate-200" />
                        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="h-14 animate-pulse rounded-2xl bg-slate-200" />
                        <div className="h-14 animate-pulse rounded-2xl bg-slate-200" />
                    </div>
                </div>
            </main>
        );
    }

    if (!product) {
        return (
            <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <Package size={30} />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        Product Not Found
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Ye product abhi available nahi hai.
                    </p>
                    <button
                        onClick={() => navigate("/products")}
                        className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                    >
                        Back to Products
                    </button>
                </div>
            </main>
        );
    }

    // Product data
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

    const finalPrice = hasOffer ? offerPrice : price;

    const discount = hasOffer
        ? Math.round(((price - offerPrice) / price) * 100)
        : 0;

    const savedAmount = hasOffer ? price - finalPrice : 0;
    const stock = Number(product.stock) || 0;

    const cartItem = cart.find(
        (item) => String(item.id) === String(product.id)
    );

    const quantity = cartItem?.quantity || 0;
    const longDescription = (product.description || "").length > 140;

    // Cart
    const handleAddToCart = () => {
        if (stock <= 0) return;
        addToCart(product);
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-10 text-slate-900">
            <div className="mx-auto max-w-6xl px-0 sm:px-5 sm:py-6 lg:px-6">
                {/* Desktop back navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-5 hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 md:inline-flex"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <div className="grid items-start gap-0 md:grid-cols-2 md:gap-7">
                    {/* Product image */}
                    <section className="relative isolate aspect-square w-full overflow-hidden bg-white sm:rounded-[2rem] md:sticky md:top-6 md:border md:border-slate-200">
                        <button
                            onClick={() => navigate(-1)}
                            aria-label="Go back"
                            className="absolute left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-800 shadow-sm backdrop-blur transition hover:bg-white active:scale-95 md:hidden"
                        >
                            <ArrowLeft size={19} />
                        </button>

                        {discount > 0 && (
                            <div className="absolute right-4 top-4 z-30 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-lg shadow-rose-600/20 sm:right-5 sm:top-5">
                                <BadgePercent size={15} />
                                {discount}% OFF
                            </div>
                        )}

                        {product.image_url && !imageFailed ? (
                            <>
                                <img
                                    src={product.image_url}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-3xl"
                                />
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    onError={() => setImageFailed(true)}
                                    className="absolute inset-0 z-10 h-full w-full object-contain  sm:p-10"
                                />
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-center">
                                <span className="text-6xl">🛒</span>
                                <p className="mt-3 text-sm font-medium text-slate-500">
                                    No Image Available
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Product information */}
                    <section className="relative z-20 -mt-5 flex min-h-full flex-col rounded-t-[1.75rem] border border-slate-100 bg-white p-5 shadow-[0_-8px_30px_rgba(15,23,42,0.04)] sm:mt-0 sm:rounded-[2rem] sm:p-7 sm:shadow-sm lg:p-9">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {product.category ? (
                                <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold capitalize tracking-wide text-slate-600">
                                    {product.category}
                                </span>
                            ) : (
                                <span />
                            )}

                            {stock > 0 ? (
                                <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    </span>
                                    {stock <= 5 ? `Only ${stock} left` : "In Stock"}
                                </span>
                            ) : (
                                <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600">
                                    Out of Stock
                                </span>
                            )}
                        </div>

                        <h1 className="mt-4 break-words text-2xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-3xl lg:text-[2.15rem]">
                            {product.name}
                        </h1>

                        {product.weight && (
                            <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                                <Package size={16} />
                                {product.weight}
                            </div>
                        )}

                        {/* Price */}
                        <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white sm:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium text-slate-400">
                                        {hasOffer ? "Special price" : "Price"}
                                    </p>
                                    <div className=" flex flex-wrap items-baseline gap-2.5">
                                        <span className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                                            ₹{finalPrice}
                                        </span>
                                        {hasOffer && (
                                            <span className="text-base font-medium text-slate-400 line-through">
                                                ₹{price}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1.5 text-xs text-slate-400">
                                        {hasOffer ? "Limited time offer" : "Best price"}
                                    </p>
                                </div>

                                {hasOffer && (
                                    <div className="shrink-0 rounded-xl bg-emerald-400/10 px-3.5 py-3 text-right ring-1 ring-inset ring-emerald-300/20">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                                            You save
                                        </p>
                                        <p className="mt-1 text-lg font-extrabold text-emerald-300">
                                            ₹{savedAmount}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cart controls */}
                        <div className=" border-t border-slate-100 pt-6">
                            {stock > 0 && quantity > 0 ? (
                                <div>
                                    <div className="flex gap-3">
                                        <div className="flex h-14 min-w-0 flex-1 items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                            <button
                                                onClick={() => decreaseQuantity(product.id)}
                                                aria-label="Decrease quantity"
                                                className="flex h-full w-14 items-center justify-center text-slate-700 transition hover:bg-slate-200 active:scale-95"
                                            >
                                                <Minus size={19} />
                                            </button>

                                            <div className="text-center">
                                                <span className="block text-lg font-extrabold leading-tight text-slate-900">
                                                    {quantity}
                                                </span>
                                                <span className="block text-[10px] font-semibold text-slate-500">
                                                    ₹{finalPrice * quantity}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => increaseQuantity(product.id)}
                                                disabled={quantity >= stock}
                                                aria-label="Increase quantity"
                                                className="flex h-full w-14 items-center justify-center bg-slate-900 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                            >
                                                <Plus size={19} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => navigate("/cart")}
                                            className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700 active:scale-[0.97] sm:px-5"
                                        >
                                            <ShoppingCart size={18} />
                                            <span className="hidden xs:inline">View Cart</span>
                                            <span className="xs:hidden">Cart</span>
                                        </button>
                                    </div>

                                    {quantity >= stock && (
                                        <p className="mt-3 text-center text-xs font-medium text-slate-400">
                                            Maximum available quantity reached
                                        </p>
                                    )}
                                </div>
                            ) : stock > 0 ? (
                                <button
                                    onClick={handleAddToCart}
                                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-base font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                                >
                                    <ShoppingCart size={20} />
                                    Add to Cart
                                    <span className="mx-0.5 text-emerald-200">·</span>
                                    ₹{finalPrice}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="h-14 w-full cursor-not-allowed rounded-2xl bg-slate-100 font-extrabold text-slate-400"
                                >
                                    Out of Stock
                                </button>
                            )}
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="mt-7">
                                <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                                    About this product
                                </h2>
                                <p
                                    className={`mt-2 whitespace-pre-line text-sm leading-7 text-slate-500 ${
                                        longDescription && !descOpen ? "line-clamp-3" : ""
                                    }`}
                                >
                                    {product.description}
                                </p>
                                {longDescription && (
                                    <button
                                        onClick={() => setDescOpen((v) => !v)}
                                        className="mt-2 text-sm font-bold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900"
                                    >
                                        {descOpen ? "Show less" : "Read more"}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Store benefits */}
                        <div className="mt-7 grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                    <Truck size={19} />
                                </span>
                                <span className="text-xs font-bold leading-snug text-slate-700">
                                    Fast Delivery
                                </span>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                    <ShieldCheck size={19} />
                                </span>
                                <span className="text-xs font-bold leading-snug text-slate-700">
                                    Quality Assured
                                </span>
                            </div>
                        </div>

                    </section>
                </div>
            </div>
        </main>
    );
}

export default ProductDetails;
