import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, []);

    // ================= FETCH ORDERS =================

    const fetchOrders = async () => {
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
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("ORDERS ERROR:", error);
                return;
            }

            setOrders(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // ================= STATUS STYLE =================

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

    // ================= CANCEL MODAL =================

    const openCancelModal = (order) => {
        setSelectedOrder(order);
        setCancelReason("");
        setShowCancelModal(true);
    };

    const closeCancelModal = () => {
        if (actionLoading) return;

        setShowCancelModal(false);
        setSelectedOrder(null);
        setCancelReason("");
    };

    // ================= CANCEL ORDER =================

    const cancelOrder = async () => {
        if (!selectedOrder) return;

        if (!cancelReason) {
            alert("Please select a cancellation reason.");
            return;
        }

        setActionLoading(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                alert("Please login first.");
                navigate("/login");
                return;
            }

            const { data, error } = await supabase
                .from("orders")
                .update({
                    status: "cancelled",
                    cancellation_reason: cancelReason,
                })
                .eq("id", selectedOrder.id)
                .eq("user_id", user.id)
                .in("status", ["pending", "confirmed", "shipped"])
                .select()
                .single();

            if (error) {
                console.error("CANCEL ORDER ERROR:", error);
                alert("Order cancel nahi hua ❌");
                return;
            }

            // UI me turant update
            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order.id === selectedOrder.id
                        ? {
                            ...order,
                            status: "cancelled",
                            cancellation_reason: cancelReason,
                        }
                        : order
                )
            );

            setShowCancelModal(false);
            setSelectedOrder(null);
            setCancelReason("");

            alert("Order cancelled successfully ✅");
        } catch (error) {
            console.error("CANCEL ERROR:", error);
            alert("Something went wrong ❌");
        } finally {
            setActionLoading(false);
        }
    };

    // ================= DELETE DELIVERED ORDER =================

    const deleteOrder = async (orderId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this order?"
        );

        if (!confirmDelete) return;

        setActionLoading(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                alert("Please login first.");
                navigate("/login");
                return;
            }

            const { error } = await supabase
                .from("orders")
                .delete()
                .eq("id", orderId)
                .eq("user_id", user.id)
                .in("status", ["delivered", "cancelled"]);

            if (error) {
                console.error("DELETE ORDER ERROR:", error);
                alert("Order delete nahi hua ❌");
                return;
            }

            setOrders((currentOrders) =>
                currentOrders.filter((order) => order.id !== orderId)
            );

            alert("Order deleted successfully 🗑️");
        } catch (error) {
            console.error("DELETE ERROR:", error);
            alert("Something went wrong ❌");
        } finally {
            setActionLoading(false);
        }
    };

    // ================= LOADING =================

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>

                    <p className="mt-4 font-semibold text-gray-600">
                        Loading orders...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8">

            <div className="max-w-4xl mx-auto">

                {/* ================= HEADER ================= */}

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        My Orders 📦
                    </h1>

                    <p className="text-gray-500 mt-1">
                        {orders.length} order
                        {orders.length !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* ================= EMPTY ================= */}

                {orders.length === 0 ? (

                    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">

                        <div className="text-6xl mb-4">
                            📦
                        </div>

                        <h2 className="text-2xl font-bold">
                            No Orders Yet
                        </h2>

                        <p className="text-gray-500 mt-2">
                            You haven't placed any orders yet.
                        </p>

                        <Link
                            to="/products"
                            className="inline-block mt-6 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700"
                        >
                            Start Shopping 🛒
                        </Link>

                    </div>

                ) : (

                    <div className="space-y-5">

                        {orders.map((order) => (

                            <div
                                key={order.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                            >

                                {/* ================= TOP ================= */}

                                <div className="p-5 flex justify-between items-start gap-4">

                                    <div>

                                        <p className="text-sm text-gray-500">
                                            ORDER ID
                                        </p>

                                        <h2 className="text-xl font-bold mt-1">
                                            #{order.id}
                                        </h2>

                                        <p className="text-sm text-gray-500 mt-2">
                                            🕒{" "}
                                            {new Date(
                                                order.created_at
                                            ).toLocaleString("en-IN")}
                                        </p>

                                    </div>

                                    <span
                                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold capitalize ${getStatusStyle(
                                            order.status
                                        )}`}
                                    >
                                        {order.status}
                                    </span>

                                </div>

                                {/* ================= ORDER INFO ================= */}

                                <div className="border-t px-5 py-5">

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Customer
                                            </p>

                                            <p className="font-semibold mt-1">
                                                {order.customer_name}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Mobile
                                            </p>

                                            <p className="font-semibold mt-1">
                                                {order.mobile}
                                            </p>
                                        </div>

                                    </div>

                                    {/* ADDRESS */}

                                    <div className="mt-5">

                                        <p className="text-sm text-gray-500">
                                            Delivery Address
                                        </p>

                                        <p className="font-medium mt-1 text-gray-800">
                                            {order.address}
                                        </p>

                                    </div>

                                    {/* CANCELLATION REASON */}

                                    {order.status === "cancelled" &&
                                        order.cancellation_reason && (
                                            <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-4">

                                                <p className="text-sm text-red-500 font-semibold">
                                                    Cancellation Reason
                                                </p>

                                                <p className="font-medium text-red-700 mt-1">
                                                    {order.cancellation_reason}
                                                </p>

                                            </div>
                                        )}

                                </div>

                                {/* ================= BOTTOM ================= */}

                                <div className="border-t bg-gray-50 px-5 py-4">

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                        <div>

                                            <p className="text-sm text-gray-500">
                                                Total Amount
                                            </p>

                                            <p className="text-xl font-bold text-green-600">
                                                ₹{order.total_amount}
                                            </p>

                                        </div>

                                        <div className="flex flex-wrap gap-2">

                                            {/* VIEW DETAILS */}

                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/order/${order.id}`
                                                    )
                                                }
                                                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold transition"
                                            >
                                                View Details →
                                            </button>

                                            {/* CANCEL */}

                                            {["pending", "confirmed", "shipped"].includes(
                                                order.status
                                            ) && (
                                                    <button
                                                        onClick={() =>
                                                            openCancelModal(order)
                                                        }
                                                        disabled={actionLoading}
                                                        className="bg-red-100 hover:bg-red-200 text-red-600 px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-50"
                                                    >
                                                        ❌ Cancel Order
                                                    </button>
                                                )}

                                            {/* DELETE DELIVERED */}

                                            {["delivered", "cancelled"].includes(order.status) && (
                                                <button
                                                    onClick={() => deleteOrder(order.id)}
                                                    disabled={actionLoading}
                                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-50"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            )}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>
                )}

            </div>

            {/* ================================================= */}
            {/* CANCEL MODAL */}
            {/* ================================================= */}

            {showCancelModal && selectedOrder && (

                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">

                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 sm:p-6">

                        <div className="flex items-center justify-between mb-5">

                            <h2 className="text-xl font-bold text-gray-900">
                                Cancel Order
                            </h2>

                            <button
                                onClick={closeCancelModal}
                                disabled={actionLoading}
                                className="text-gray-400 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>

                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            Please select a reason for cancellation.
                        </p>

                        <div className="space-y-2">

                            {[
                                "Changed my mind",
                                "Ordered by mistake",
                                "Found better price",
                                "Ordered wrong item",
                                "Delivery taking too long",
                                "Other",
                            ].map((reason) => (

                                <label
                                    key={reason}
                                    className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition ${cancelReason === reason
                                            ? "border-red-500 bg-red-50"
                                            : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                >

                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value={reason}
                                        checked={cancelReason === reason}
                                        onChange={(e) =>
                                            setCancelReason(e.target.value)
                                        }
                                        className="w-4 h-4 accent-red-600"
                                    />

                                    <span className="font-medium text-gray-700">
                                        {reason}
                                    </span>

                                </label>

                            ))}

                        </div>

                        <div className="flex gap-3 mt-6">

                            <button
                                onClick={closeCancelModal}
                                disabled={actionLoading}
                                className="flex-1 border border-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50"
                            >
                                Keep Order
                            </button>

                            <button
                                onClick={cancelOrder}
                                disabled={!cancelReason || actionLoading}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
                            >
                                {actionLoading
                                    ? "Cancelling..."
                                    : "Confirm Cancel"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </main>
    );
}

export default MyOrders;