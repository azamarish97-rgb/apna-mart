import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "./supabase";

function OrderDetails() {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("id", id)
                .eq("user_id", user.id)
                .single();

            if (error) {
                console.error("ORDER DETAILS ERROR:", error);
                setOrder(null);
                return;
            }

            setOrder(data);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-700";

            case "confirmed":
                return "bg-blue-100 text-blue-700";

            case "shipped":
                return "bg-purple-100 text-purple-700";

            case "delivered":
                return "bg-green-100 text-green-700";

            case "cancelled":
                return "bg-red-100 text-red-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>

                    <p className="mt-4 font-semibold text-gray-600">
                        Loading order...
                    </p>
                </div>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-md w-full">

                    <div className="text-6xl mb-4">
                        😕
                    </div>

                    <h1 className="text-2xl font-bold">
                        Order Not Found
                    </h1>

                    <p className="text-gray-500 mt-2">
                        This order doesn't exist or you don't have access to it.
                    </p>

                    <Link
                        to="/my-orders"
                        className="inline-block mt-6 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
                    >
                        ← My Orders
                    </Link>

                </div>
            </main>
        );
    }


    const getStatusStep = (status) => {
        switch (status) {
            case "pending":
                return 1;

            case "confirmed":
                return 2;

            case "shipped":
                return 3;

            case "delivered":
                return 4;

            default:
                return 1;
        }
    };

    const currentStep = getStatusStep(order.status);

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8">

            <div className="max-w-3xl mx-auto">

                {/* Back */}
                <Link
                    to="/my-orders"
                    className="inline-flex items-center text-gray-600 hover:text-green-600 font-medium mb-6"
                >
                    ← Back to My Orders
                </Link>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6">

                        <p className="text-green-100 text-sm">
                            ORDER ID
                        </p>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-1">

                            <h1 className="text-3xl font-bold">
                                #{order.id}
                            </h1>

                            <span
                                className={`px-4 py-2 rounded-full text-sm font-bold capitalize ${getStatusStyle(
                                    order.status
                                )}`}
                            >
                                {order.status}
                            </span>

                        </div>

                        <p className="text-green-100 mt-3">
                            🕒{" "}
                            {new Date(
                                order.created_at
                            ).toLocaleString("en-IN")}
                        </p>

                    </div>

                    {/* Order Status */}
                    {/* Order Status */}
                    <div className="p-6 border-b">

                        <h2 className="text-xl font-bold mb-5">
                            Order Status
                        </h2>

                        {order.status === "cancelled" ? (

                            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">

                                <div className="text-4xl mb-2">
                                    ❌
                                </div>

                                <h3 className="font-bold text-red-600 text-lg">
                                    Order Cancelled
                                </h3>

                                {order.cancel_reason && (
                                    <p className="text-sm text-red-500 mt-2">
                                        Reason: {order.cancel_reason}
                                    </p>
                                )}

                            </div>

                        ) : (

                            <div className="flex items-center justify-between text-xs sm:text-sm">

                                {/* Placed */}
                                <div className="text-center">
                                    <div
                                        className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold ${currentStep >= 1
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-200 text-gray-500"
                                            }`}
                                    >
                                        ✓
                                    </div>

                                    <p
                                        className={`mt-2 ${currentStep >= 1
                                                ? "font-semibold text-green-600"
                                                : "text-gray-500"
                                            }`}
                                    >
                                        Placed
                                    </p>
                                </div>

                                {/* Line */}
                                <div
                                    className={`h-1 flex-1 mx-2 ${currentStep >= 2
                                            ? "bg-green-600"
                                            : "bg-gray-200"
                                        }`}
                                ></div>

                                {/* Confirmed */}
                                <div className="text-center">
                                    <div
                                        className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold ${currentStep >= 2
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-200 text-gray-500"
                                            }`}
                                    >
                                        {currentStep >= 2 ? "✓" : "2"}
                                    </div>

                                    <p
                                        className={`mt-2 ${currentStep >= 2
                                                ? "font-semibold text-green-600"
                                                : "text-gray-500"
                                            }`}
                                    >
                                        Confirmed
                                    </p>
                                </div>

                                {/* Line */}
                                <div
                                    className={`h-1 flex-1 mx-2 ${currentStep >= 3
                                            ? "bg-green-600"
                                            : "bg-gray-200"
                                        }`}
                                ></div>

                                {/* Shipped */}
                                <div className="text-center">
                                    <div
                                        className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold ${currentStep >= 3
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-200 text-gray-500"
                                            }`}
                                    >
                                        {currentStep >= 3 ? "✓" : "3"}
                                    </div>

                                    <p
                                        className={`mt-2 ${currentStep >= 3
                                                ? "font-semibold text-green-600"
                                                : "text-gray-500"
                                            }`}
                                    >
                                        Shipped
                                    </p>
                                </div>

                                {/* Line */}
                                <div
                                    className={`h-1 flex-1 mx-2 ${currentStep >= 4
                                            ? "bg-green-600"
                                            : "bg-gray-200"
                                        }`}
                                ></div>

                                {/* Delivered */}
                                <div className="text-center">
                                    <div
                                        className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold ${currentStep >= 4
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-200 text-gray-500"
                                            }`}
                                    >
                                        {currentStep >= 4 ? "✓" : "4"}
                                    </div>

                                    <p
                                        className={`mt-2 ${currentStep >= 4
                                                ? "font-semibold text-green-600"
                                                : "text-gray-500"
                                            }`}
                                    >
                                        Delivered
                                    </p>
                                </div>

                            </div>
                        )}

                    </div>

                    {/* Customer */}
                    <div className="p-6 border-b">

                        <h2 className="text-xl font-bold mb-4">
                            👤 Customer Details
                        </h2>

                        <div className="space-y-3">

                            <p>
                                <span className="font-semibold">
                                    Name:
                                </span>{" "}
                                {order.customer_name}
                            </p>

                            <p>
                                <span className="font-semibold">
                                    Mobile:
                                </span>{" "}
                                {order.mobile}
                            </p>

                        </div>

                    </div>

                    {/* Address */}
                    <div className="p-6 border-b">

                        <h2 className="text-xl font-bold mb-4">
                            📍 Delivery Address
                        </h2>

                        <p className="text-gray-700 leading-relaxed">
                            {order.address}
                        </p>

                    </div>

                    {/* Payment */}
                    <div className="p-6">

                        <div className="flex justify-between items-center">

                            <div>
                                <p className="text-sm text-gray-500">
                                    Payment
                                </p>

                                <p className="font-semibold mt-1">
                                    💵 Cash on Delivery
                                </p>
                            </div>

                            <div className="text-right">

                                <p className="text-sm text-gray-500">
                                    Total Amount
                                </p>

                                <p className="text-2xl font-bold text-green-600">
                                    ₹{order.total_amount}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-500">
                    Thank you for shopping with{" "}
                    <span className="font-bold text-green-600">
                        ApnaMart
                    </span>{" "}
                    🛒
                </div>

            </div>

        </main>
    );
}

export default OrderDetails;