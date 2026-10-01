import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";
import { enablePushNotifications } from "./enablePushNotifications";

function AdminOrders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [openOrder, setOpenOrder] = useState(null);

    // ==========================================
    // PUSH NOTIFICATION STATE
    // ==========================================

    const [pushLoading, setPushLoading] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);

    // ==========================================
    // FETCH ORDERS
    // ==========================================

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", {
                    ascending: false,
                });

            if (error) {
                console.error(
                    "ADMIN ORDERS ERROR:",
                    error
                );

                alert("Orders load failed ❌");
                return;
            }

            setOrders(data || []);
        } catch (error) {
            console.error(
                "FETCH ORDERS ERROR:",
                error
            );

            alert("Orders load failed ❌");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // ENABLE PUSH NOTIFICATIONS
    // ==========================================

    const handleEnableNotifications = async () => {
        try {
            setPushLoading(true);

            await enablePushNotifications();

            setPushEnabled(true);

            alert(
                "🔔 Notifications enabled successfully!"
            );
        } catch (error) {
            console.error(
                "NOTIFICATION ERROR:",
                error
            );

            alert(
                `Notification enable nahi hua ❌\n\n${error?.message ||
                "Unknown error"
                }`
            );
        } finally {
            setPushLoading(false);
        }
    };

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    const updateStatus = async (
        orderId,
        newStatus
    ) => {
        setUpdating(orderId);

        try {
            const { error } = await supabase
                .from("orders")
                .update({
                    status: newStatus,
                })
                .eq("id", orderId);

            console.log(
                "ORDER ID:",
                orderId
            );

            console.log(
                "NEW STATUS:",
                newStatus
            );

            console.log(
                "UPDATE ERROR:",
                error
            );

            if (error) {
                console.error(
                    "STATUS UPDATE ERROR:",
                    error
                );

                alert(
                    `Status update failed ❌\n\n${error.message}`
                );

                return;
            }

            setOrders(
                (currentOrders) =>
                    currentOrders.map(
                        (order) =>
                            order.id === orderId
                                ? {
                                    ...order,
                                    status: newStatus,
                                }
                                : order
                    )
            );

            alert(
                "Order status updated ✅"
            );
        } catch (error) {
            console.error(
                "STATUS UPDATE ERROR:",
                error
            );

            alert(
                `Something went wrong ❌\n\n${error.message}`
            );
        } finally {
            setUpdating(null);
        }
    };

    // ==========================================
    // DELETE ORDER
    // ==========================================

    const deleteOrder = async (orderId) => {
        const confirmed = window.confirm(
            `Order #${orderId} permanently delete karna hai?\n\nYe action undo nahi kiya ja sakta.`
        );

        if (!confirmed) {
            return;
        }

        setUpdating(orderId);

        try {
            const { error } = await supabase
                .from("orders")
                .delete()
                .eq("id", orderId);

            if (error) {
                console.error(
                    "DELETE ORDER ERROR:",
                    error
                );

                alert(
                    `Order delete failed ❌\n\n${error.message}`
                );

                return;
            }

            setOrders(
                (currentOrders) =>
                    currentOrders.filter(
                        (order) =>
                            order.id !== orderId
                    )
            );

            if (openOrder === orderId) {
                setOpenOrder(null);
            }

            alert(
                "Order deleted successfully 🗑️"
            );
        } catch (error) {
            console.error(
                "DELETE ORDER ERROR:",
                error
            );

            alert(
                `Something went wrong ❌\n\n${error.message}`
            );
        } finally {
            setUpdating(null);
        }
    };

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = async () => {
        const { error } =
            await supabase.auth.signOut();

        if (error) {
            console.error(
                "ADMIN LOGOUT ERROR:",
                error
            );

            alert("Logout failed ❌");
            return;
        }

        navigate("/admin-login");
    };

    // ==========================================
    // STATUS STYLE
    // ==========================================

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

    // ==========================================
    // FILTER ORDERS
    // ==========================================

    const filteredOrders = orders.filter(
        (order) => {
            const searchText =
                search.toLowerCase().trim();

            const matchesSearch =
                String(order.id)
                    .toLowerCase()
                    .includes(searchText) ||
                String(
                    order.customer_name || ""
                )
                    .toLowerCase()
                    .includes(searchText) ||
                String(order.mobile || "")
                    .toLowerCase()
                    .includes(searchText);

            const matchesStatus =
                statusFilter === "all" ||
                order.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        }
    );

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>

                    <p className="mt-4 font-semibold text-gray-600">
                        Loading orders...
                    </p>
                </div>
            </main>
        );
    }

    // ==========================================
    // MAIN
    // ==========================================

    return (
        <main className="min-h-screen bg-gray-50 px-2 sm:px-4 lg:px-5 py-3 sm:py-5">

            <div className="max-w-[1600px] mx-auto">

                {/* ==========================================
                    HEADER
                ========================================== */}

                <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

                        <div>
                            <p className="text-xs text-blue-600 font-semibold">
                                APNAMART ADMIN
                            </p>

                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
                                Orders Dashboard 📦
                            </h1>

                            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                                Manage all customer orders
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">

                            {/* NOTIFICATION BUTTON */}

                            <button
                                onClick={
                                    handleEnableNotifications
                                }
                                disabled={
                                    pushLoading
                                }
                                className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition ${pushEnabled
                                        ? "bg-green-600 text-white"
                                        : "bg-orange-500 hover:bg-orange-600 text-white"
                                    }`}
                            >
                                {pushLoading
                                    ? "Enabling..."
                                    : pushEnabled
                                        ? "🔔 Notifications ON"
                                        : "🔔 Enable Notifications"}
                            </button>

                            {/* PRODUCT DASHBOARD */}

                            <button
                                onClick={() =>
                                    navigate(
                                        "/admin/dashboard"
                                    )
                                }
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition"
                            >
                                🛠️ Product Dashboard
                            </button>

                            {/* LOGOUT */}

                            <button
                                onClick={
                                    handleLogout
                                }
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition"
                            >
                                Logout 🚪
                            </button>

                        </div>
                    </div>
                </div>

                {/* ==========================================
                    STATS
                ========================================== */}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-4">

                    {/* TOTAL */}

                    <div className="bg-white rounded-xl p-3 shadow-sm">
                        <p className="text-gray-500 text-xs">
                            Total Orders
                        </p>

                        <p className="text-xl sm:text-2xl font-bold mt-1">
                            {orders.length}
                        </p>
                    </div>

                    {/* PENDING */}

                    <div className="bg-white rounded-xl p-3 shadow-sm">
                        <p className="text-gray-500 text-xs">
                            Pending
                        </p>

                        <p className="text-xl sm:text-2xl font-bold text-yellow-600 mt-1">
                            {
                                orders.filter(
                                    (order) =>
                                        order.status ===
                                        "pending"
                                ).length
                            }
                        </p>
                    </div>

                    {/* SHIPPED */}

                    <div className="bg-white rounded-xl p-3 shadow-sm">
                        <p className="text-gray-500 text-xs">
                            Shipped
                        </p>

                        <p className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">
                            {
                                orders.filter(
                                    (order) =>
                                        order.status ===
                                        "shipped"
                                ).length
                            }
                        </p>
                    </div>

                    {/* DELIVERED */}

                    <div className="bg-white rounded-xl p-3 shadow-sm">
                        <p className="text-gray-500 text-xs">
                            Delivered
                        </p>

                        <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                            {
                                orders.filter(
                                    (order) =>
                                        order.status ===
                                        "delivered"
                                ).length
                            }
                        </p>
                    </div>

                </div>

                {/* ==========================================
                    SEARCH + FILTER
                ========================================== */}

                <div className="bg-white rounded-xl shadow-sm p-3 mb-4">

                    <div className="flex flex-col sm:flex-row gap-2">

                        <div className="flex-1 relative">

                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                🔎
                            </span>

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search order ID, name or mobile..."
                                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />

                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                            className="sm:w-48 border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">
                                All Status
                            </option>

                            <option value="pending">
                                Pending
                            </option>

                            <option value="confirmed">
                                Confirmed
                            </option>

                            <option value="shipped">
                                Shipped
                            </option>

                            <option value="delivered">
                                Delivered
                            </option>

                            <option value="cancelled">
                                Cancelled
                            </option>
                        </select>

                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                        Showing{" "}
                        {filteredOrders.length} of{" "}
                        {orders.length} orders
                    </p>

                </div>

                {/* ==========================================
                    ORDERS
                ========================================== */}

                {filteredOrders.length === 0 ? (

                    <div className="bg-white rounded-xl p-8 text-center shadow-sm">

                        <div className="text-5xl">
                            📦
                        </div>

                        <h2 className="text-lg font-bold mt-3">
                            No Orders Found
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                            Try changing your search or filter.
                        </p>

                    </div>

                ) : (

                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">

                        {filteredOrders.map(
                            (order) => (

                                <div
                                    key={order.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                                >

                                    {/* ==========================================
                                        ORDER HEADER
                                    ========================================== */}

                                    <div className="p-3 border-b">

                                        <div className="flex items-start justify-between gap-2">

                                            <div className="min-w-0">

                                                <p className="text-[10px] text-gray-500 font-semibold">
                                                    ORDER ID
                                                </p>

                                                <h2 className="text-base font-bold truncate">
                                                    #
                                                    {
                                                        order.id
                                                    }
                                                </h2>

                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    {order.created_at
                                                        ? new Date(
                                                            order.created_at
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )
                                                        : "Date unavailable"}
                                                </p>

                                            </div>

                                            <span
                                                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${getStatusStyle(
                                                    order.status
                                                )}`}
                                            >
                                                {
                                                    order.status ||
                                                    "pending"
                                                }
                                            </span>

                                        </div>

                                    </div>

                                    {/* ==========================================
                                        CUSTOMER
                                    ========================================== */}

                                    <div className="p-3">

                                        <h3 className="font-bold text-sm mb-2.5">
                                            👤 Customer
                                        </h3>

                                        <div className="grid grid-cols-2 gap-x-3 gap-y-2">

                                            {/* NAME */}

                                            <div className="min-w-0">

                                                <p className="text-[10px] text-gray-500">
                                                    Name
                                                </p>

                                                <p className="font-semibold text-sm truncate">
                                                    {
                                                        order.customer_name ||
                                                        "N/A"
                                                    }
                                                </p>

                                            </div>

                                            {/* MOBILE */}

                                            <div className="min-w-0">

                                                <p className="text-[10px] text-gray-500">
                                                    Mobile
                                                </p>

                                                <p className="font-semibold text-sm truncate">
                                                    {
                                                        order.mobile ||
                                                        "N/A"
                                                    }
                                                </p>

                                            </div>

                                            {/* ADDRESS */}

                                            <div className="col-span-2">

                                                <p className="text-[10px] text-gray-500">
                                                    Address
                                                </p>

                                                <p className="font-semibold text-sm line-clamp-2">
                                                    {
                                                        order.address ||
                                                        "N/A"
                                                    }
                                                </p>

                                            </div>

                                            {/* TOTAL */}

                                            <div>

                                                <p className="text-[10px] text-gray-500">
                                                    Total
                                                </p>

                                                <p className="font-bold text-green-600 text-sm">
                                                    ₹
                                                    {
                                                        order.total_amount ??
                                                        0
                                                    }
                                                </p>

                                            </div>

                                        </div>

                                        {/* ==========================================
                                            EXTRA INFO
                                        ========================================== */}

                                        <div className="mt-3 bg-gray-50 rounded-lg p-2.5">

                                            <div className="space-y-2 text-xs">

                                                {/* PAYMENT */}

                                                <div className="flex justify-between gap-3">

                                                    <span className="text-gray-500">
                                                        Payment
                                                    </span>

                                                    <span className="font-semibold text-right">
                                                        Cash on Delivery
                                                    </span>

                                                </div>

                                                {/* STATUS */}

                                                <div className="flex justify-between gap-3">

                                                    <span className="text-gray-500">
                                                        Status
                                                    </span>

                                                    <span className="font-semibold capitalize">
                                                        {
                                                            order.status ||
                                                            "pending"
                                                        }
                                                    </span>

                                                </div>

                                                {/* CANCELLATION */}

                                                {order.status ===
                                                    "cancelled" && (
                                                        <div className="bg-red-50 border border-red-200 rounded-lg p-2">

                                                            <p className="text-[10px] text-red-500 font-semibold">
                                                                Cancellation Reason
                                                            </p>

                                                            <p className="text-red-700 font-medium text-xs mt-0.5">
                                                                {
                                                                    order.cancellation_reason ||
                                                                    "No reason provided"
                                                                }
                                                            </p>

                                                        </div>
                                                    )}

                                                {/* TOTAL */}

                                                <div className="border-t pt-2 flex justify-between gap-3">

                                                    <span className="font-semibold">
                                                        Total
                                                    </span>

                                                    <span className="font-bold text-green-600">
                                                        ₹
                                                        {
                                                            order.total_amount ??
                                                            0
                                                        }
                                                    </span>

                                                </div>

                                                {/* LOCATION */}

                                                {order.location && (
                                                    <div className="border-t pt-2 mt-2">

                                                        <p className="text-[10px] text-gray-500 mb-1.5">
                                                            Delivery Location
                                                        </p>

                                                        <a
                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                                order.location
                                                            )}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold text-xs transition"
                                                        >
                                                            📍 View Live Location
                                                        </a>

                                                    </div>
                                                )}

                                            </div>

                                        </div>

                                    </div>

                                    {/* ==========================================
                                        DETAILS
                                    ========================================== */}

                                    <div className="border-t px-3 py-2.5">

                                        <button
                                            onClick={() =>
                                                setOpenOrder(
                                                    openOrder ===
                                                        order.id
                                                        ? null
                                                        : order.id
                                                )
                                            }
                                            className="text-blue-600 font-semibold text-xs hover:underline"
                                        >
                                            {openOrder ===
                                                order.id
                                                ? "Hide Details ↑"
                                                : "View Details ↓"}
                                        </button>

                                        {openOrder ===
                                            order.id && (

                                                <div className="mt-2.5 bg-gray-50 rounded-lg p-2.5">

                                                    <div className="space-y-2 text-xs">

                                                        {/* CUSTOMER */}

                                                        <div className="flex justify-between gap-3">

                                                            <span className="text-gray-500">
                                                                Customer
                                                            </span>

                                                            <span className="font-semibold text-right">
                                                                {
                                                                    order.customer_name ||
                                                                    "N/A"
                                                                }
                                                            </span>

                                                        </div>

                                                        {/* MOBILE */}

                                                        <div className="flex justify-between gap-3">

                                                            <span className="text-gray-500">
                                                                Mobile
                                                            </span>

                                                            <span className="font-semibold text-right">
                                                                {
                                                                    order.mobile ||
                                                                    "N/A"
                                                                }
                                                            </span>

                                                        </div>

                                                        {/* PAYMENT */}

                                                        <div className="flex justify-between gap-3">

                                                            <span className="text-gray-500">
                                                                Payment
                                                            </span>

                                                            <span className="font-semibold">
                                                                Cash on Delivery
                                                            </span>

                                                        </div>

                                                        {/* STATUS */}

                                                        <div className="flex justify-between gap-3">

                                                            <span className="text-gray-500">
                                                                Status
                                                            </span>

                                                            <span className="font-semibold capitalize">
                                                                {
                                                                    order.status ||
                                                                    "pending"
                                                                }
                                                            </span>

                                                        </div>

                                                        {/* CANCELLATION */}

                                                        {order.status ===
                                                            "cancelled" && (

                                                                <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">

                                                                    <p className="text-[10px] text-red-500 font-semibold">
                                                                        Cancellation Reason
                                                                    </p>

                                                                    <p className="text-red-700 font-medium text-xs">
                                                                        {
                                                                            order.cancellation_reason ||
                                                                            "No reason provided"
                                                                        }
                                                                    </p>

                                                                </div>

                                                            )}

                                                        {/* TOTAL */}

                                                        <div className="border-t pt-2 flex justify-between gap-3">

                                                            <span className="font-semibold">
                                                                Total
                                                            </span>

                                                            <span className="font-bold text-green-600">
                                                                ₹
                                                                {
                                                                    order.total_amount ??
                                                                    0
                                                                }
                                                            </span>

                                                        </div>

                                                        {/* ADDRESS */}

                                                        <div className="border-t pt-2">

                                                            <p className="text-gray-500 mb-1">
                                                                Address
                                                            </p>

                                                            <p className="font-semibold">
                                                                {
                                                                    order.address ||
                                                                    "N/A"
                                                                }
                                                            </p>

                                                        </div>

                                                    </div>

                                                </div>

                                            )}

                                    </div>

                                    {/* ==========================================
                                        STATUS + DELETE
                                    ========================================== */}

                                    <div className="border-t bg-gray-50 p-3">

                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                                            Update Order Status
                                        </label>

                                        <select
                                            value={
                                                order.status ||
                                                "pending"
                                            }
                                            disabled={
                                                updating ===
                                                order.id
                                            }
                                            onChange={(e) =>
                                                updateStatus(
                                                    order.id,
                                                    e.target.value
                                                )
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                        >

                                            <option value="pending">
                                                Pending
                                            </option>

                                            <option value="confirmed">
                                                Confirmed
                                            </option>

                                            <option value="shipped">
                                                Shipped
                                            </option>

                                            <option value="delivered">
                                                Delivered
                                            </option>

                                            <option value="cancelled">
                                                Cancelled
                                            </option>

                                        </select>

                                        {updating ===
                                            order.id && (

                                                <p className="text-xs text-blue-600 mt-1.5">
                                                    Updating...
                                                </p>

                                            )}

                                        {/* DELETE */}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                deleteOrder(
                                                    order.id
                                                )
                                            }
                                            disabled={
                                                updating ===
                                                order.id
                                            }
                                            className="w-full mt-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-2.5 rounded-lg font-semibold text-sm transition"
                                        >
                                            🗑️ Delete Order
                                        </button>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>

        </main>
    );
}

export default AdminOrders;