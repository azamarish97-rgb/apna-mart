
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "./supabase";
import Footer from "./Footer";

function OrderDetails() {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        setLoading(true);

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                setOrder(null);
                setItems([]);
                return;
            }

            // Fetch order details
            const { data: orderData, error: orderError } =
                await supabase
                    .from("orders")
                    .select("*")
                    .eq("id", id)
                    .eq("user_id", user.id)
                    .single();

            if (orderError) {
                console.error("ORDER ERROR:", orderError);
                setOrder(null);
                setItems([]);
                return;
            }

            setOrder(orderData);

            // Fetch products in this order
            const { data: itemData, error: itemError } =
                await supabase
                    .from("order_items")
                    .select("*")
                    .eq("order_id", id)
                    .order("id", { ascending: true });

            if (itemError) {
                console.error("ORDER ITEMS ERROR:", itemError);
                setItems([]);
                return;
            }

            setItems(itemData || []);
        } catch (error) {
            console.error("FETCH ORDER ERROR:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800",
            confirmed: "bg-blue-100 text-blue-800",
            shipped: "bg-purple-100 text-purple-800",
            delivered: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
        };

        return (
            styles[(status || "").toLowerCase()] ||
            "bg-gray-100 text-gray-700"
        );
    };

    const getStatusStep = (status) => {
        const steps = {
            pending: 1,
            confirmed: 2,
            shipped: 3,
            delivered: 4,
        };

        return steps[(status || "").toLowerCase()] || 0;
    };

    const formatPrice = (amount) =>
        `₹${Number(amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">
                        Loading your order...
                    </p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4">
                <div className="text-5xl mb-4">📦</div>

                <h2 className="text-2xl font-bold text-gray-800">
                    Order not found
                </h2>

                <p className="text-gray-500 mt-2 text-center">
                    Please log in with the account used to place this order.
                </p>

                <Link
                    to="/my-orders"
                    className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
                >
                    My Orders
                </Link>
            </div>
        );
    }

    const status = (order.status || "pending").toLowerCase();
    const currentStep = getStatusStep(status);

    const itemsSubtotal = items.reduce(
        (sum, item) =>
            sum +
            Number(item.price || 0) * Number(item.quantity || 0),
        0
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">

                {/* Back Button */}
                <Link
                    to="/my-orders"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mb-6"
                >
                    ← Back to My Orders
                </Link>

                {/* Order Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm text-gray-500">
                                Order ID
                            </p>

                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-all">
                                #{order.id}
                            </h1>

                            <p className="text-sm text-gray-500 mt-2">
                                Placed on{" "}
                                {order.created_at
                                    ? new Date(
                                        order.created_at
                                    ).toLocaleString("en-IN", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })
                                    : "N/A"}
                            </p>
                        </div>

                        <span
                            className={`self-start px-4 py-2 rounded-full text-sm font-bold capitalize ${getStatusStyle(
                                status
                            )}`}
                        >
                            {status}
                        </span>
                    </div>

                    {/* Order Progress */}
                    {status !== "cancelled" && (
                        <div className="mt-8">
                            <div className="flex items-center justify-between gap-1">
                                {[
                                    "Pending",
                                    "Confirmed",
                                    "Shipped",
                                    "Delivered",
                                ].map((step, index) => {
                                    const stepNumber = index + 1;
                                    const completed =
                                        currentStep >= stepNumber;

                                    return (
                                        <div
                                            key={step}
                                            className="flex-1 text-center"
                                        >
                                            <div
                                                className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${completed
                                                        ? "bg-green-500 text-white"
                                                        : "bg-gray-200 text-gray-500"
                                                    }`}
                                            >
                                                {completed
                                                    ? "✓"
                                                    : stepNumber}
                                            </div>

                                            <p className="text-[10px] sm:text-xs mt-2 text-gray-600">
                                                {step}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.max(
                                            0,
                                            ((currentStep - 1) / 3) * 100
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Ordered Products */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7 mb-6 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-5">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                            🛒 Ordered Products
                        </h2>

                        <span className="shrink-0 bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold px-3 py-1 rounded-full">
                            {items.length}{" "}
                            {items.length === 1 ? "item" : "items"}
                        </span>
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-3">🛒</div>

                            <p className="font-semibold text-gray-700">
                                No products found for this order
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                                Check the order_items table and its
                                access policies.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Scrollable Products List */}
                            <div className="max-h-64 overflow-y-auto overscroll-contain pr-2">
                                <div className="divide-y divide-gray-100">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="py-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"
                                        >
                                            {/* Product Information */}
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base whitespace-normal break-words">
                                                    {item.product_name ||
                                                        "Unnamed Product"}
                                                </h3>

                                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                                    Price:{" "}
                                                    {formatPrice(item.price)}
                                                </p>

                                                <p className="text-xs sm:text-sm text-gray-500">
                                                    Quantity: {item.quantity}
                                                </p>
                                            </div>

                                            {/* Product Subtotal */}
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-gray-900 text-sm sm:text-base whitespace-nowrap">
                                                    {formatPrice(
                                                        Number(item.price || 0) *
                                                        Number(
                                                            item.quantity || 0
                                                        )
                                                    )}
                                                </p>

                                                <p className="text-xs text-gray-400 mt-1">
                                                    Subtotal
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Products Subtotal - Always Visible */}
                            <div className="border-t border-gray-200 pt-4 mt-3 flex justify-between items-center gap-4">
                                <span className="text-sm sm:text-base text-gray-600 font-medium">
                                    Products subtotal
                                </span>

                                <span className="font-bold text-gray-900 whitespace-nowrap">
                                    {formatPrice(itemsSubtotal)}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Delivery and Payment Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">

                    {/* Delivery Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            📍 Delivery Details
                        </h2>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Name
                                </p>

                                <p className="font-semibold text-gray-800 break-words">
                                    {order.customer_name || "N/A"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Mobile
                                </p>

                                <p className="font-semibold text-gray-800">
                                    {order.mobile || "N/A"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Delivery Address
                                </p>

                                <p className="font-semibold text-gray-800 whitespace-pre-line break-words">
                                    {order.address || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            💳 Payment Summary
                        </h2>

                        <div className="flex justify-between gap-3 mb-4">
                            <span className="text-gray-600">
                                Payment method
                            </span>

                            <span className="font-semibold text-gray-800 text-right">
                                {order.payment_method ||
                                    "Cash on Delivery"}
                            </span>
                        </div>

                        <div className="flex justify-between gap-3 border-t border-gray-100 pt-4">
                            <span className="font-bold text-gray-900">
                                Order Total
                            </span>

                            <span className="text-xl font-extrabold text-green-700 whitespace-nowrap">
                                {formatPrice(order.total_amount)}
                            </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-3">
                            The order total is taken from your saved
                            order record.
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default OrderDetails;
