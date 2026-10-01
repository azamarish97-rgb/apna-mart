import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";


function AdminOrders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [openOrder, setOpenOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    // =========================
    // FETCH ORDERS
    // =========================

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("ADMIN ORDERS ERROR:", error);
                alert("Orders load failed ❌");
                return;
            }

            setOrders(data || []);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // UPDATE STATUS
    // =========================

    const updateStatus = async (orderId, newStatus) => {
        setUpdating(orderId);

        const { error } = await supabase
            .from("orders")
            .update({
                status: newStatus,
            })
            .eq("id", orderId);

        console.log("ORDER ID:", orderId);
        console.log("NEW STATUS:", newStatus);
        console.log("UPDATE ERROR:", error);

        if (error) {
            console.error("STATUS UPDATE ERROR:", error);
            alert("Status update failed ❌");
            setUpdating(null);
            return;
        }

        setOrders((currentOrders) =>
            currentOrders.map((order) =>
                order.id === orderId
                    ? {
                        ...order,
                        status: newStatus,
                    }
                    : order
            )
        );

        alert("Order status updated ✅");

        setUpdating(null);
    };

    // =========================
    // LOGOUT
    // =========================

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("ADMIN LOGOUT ERROR:", error);
            alert("Logout failed ❌");
            return;
        }

        navigate("/admin-login");
    };

    // =========================
    // STATUS STYLE
    // =========================

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

    // =========================
    // FILTER ORDERS
    // =========================

    const filteredOrders = orders.filter((order) => {
        const searchText = search.toLowerCase().trim();

        const matchesSearch =
            String(order.id).toLowerCase().includes(searchText) ||
            String(order.customer_name || "")
                .toLowerCase()
                .includes(searchText) ||
            String(order.mobile || "")
                .toLowerCase()
                .includes(searchText);

        const matchesStatus =
            statusFilter === "all" ||
            order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>

                    <p className="mt-4 font-semibold text-gray-600">
                        Loading orders...
                    </p>
                </div>
            </main>
        );
    }

    // =========================
    // MAIN
    // =========================

    return (
        <main className="min-h-screen bg-gray-50 px-3 sm:px-5 py-5 sm:py-8">
            <div className="max-w-6xl mx-auto">

                {/* ================= HEADER ================= */}

                <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                        <div>
                            <p className="text-sm text-blue-600 font-semibold">
                                APNAMART ADMIN
                            </p>

                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                                Orders Dashboard 📦
                            </h1>

                            <p className="text-gray-500 text-sm mt-1">
                                Manage all customer orders
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-3 rounded-xl transition"
                        >
                            Logout 🚪
                        </button>

                        <button
                            onClick={() => navigate("/admin/dashboard")}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold transition"
                        >
                            🛠️ Product Dashboard
                        </button>

                    </div>
                </div>

                {/* ================= STATS ================= */}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">

                    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
                        <p className="text-gray-500 text-sm">
                            Total Orders
                        </p>

                        <p className="text-2xl font-bold mt-1">
                            {orders.length}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
                        <p className="text-gray-500 text-sm">
                            Pending
                        </p>

                        <p className="text-2xl font-bold text-yellow-600 mt-1">
                            {
                                orders.filter(
                                    (order) =>
                                        order.status === "pending"
                                ).length
                            }
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
                        <p className="text-gray-500 text-sm">
                            Shipped
                        </p>

                        <p className="text-2xl font-bold text-purple-600 mt-1">
                            {
                                orders.filter(
                                    (order) =>
                                        order.status === "shipped"
                                ).length
                            }
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
                        <p className="text-gray-500 text-sm">
                            Delivered
                        </p>

                        <p className="text-2xl font-bold text-green-600 mt-1">
                            {
                                orders.filter(
                                    (order) =>
                                        order.status === "delivered"
                                ).length
                            }
                        </p>
                    </div>

                </div>

                {/* ================= SEARCH + FILTER ================= */}

                <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">

                    <div className="flex flex-col sm:flex-row gap-3">

                        <div className="flex-1 relative">

                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                🔎
                            </span>

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Search order ID, name or mobile..."
                                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            />

                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                            className="sm:w-52 border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
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

                    <p className="text-sm text-gray-500 mt-3">
                        Showing {filteredOrders.length} of {orders.length} orders
                    </p>

                </div>

                {/* ================= ORDERS ================= */}

                {filteredOrders.length === 0 ? (

                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm">

                        <div className="text-6xl">
                            📦
                        </div>

                        <h2 className="text-xl font-bold mt-4">
                            No Orders Found
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Try changing your search or filter.
                        </p>

                    </div>

                ) : (

                    <div className="space-y-5">

                        {filteredOrders.map((order) => (

                            <div
                                key={order.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                            >

                                {/* ================= TOP ================= */}

                                <div className="p-5 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">

                                    <div>

                                        <p className="text-xs text-gray-500 font-semibold">
                                            ORDER ID
                                        </p>

                                        <h2 className="text-xl font-bold">
                                            #{order.id}
                                        </h2>

                                        <p className="text-sm text-gray-500 mt-1">
                                            {new Date(
                                                order.created_at
                                            ).toLocaleString("en-IN")}
                                        </p>

                                    </div>

                                    <span
                                        className={`w-fit px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${getStatusStyle(
                                            order.status
                                        )}`}
                                    >
                                        {order.status}
                                    </span>

                                </div>

                                {/* ================= CUSTOMER ================= */}

                                <div className="border-t p-5">

                                    <h3 className="font-bold text-lg mb-4">
                                        👤 Customer
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Name
                                            </p>

                                            <p className="font-semibold">
                                                {order.customer_name}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Mobile
                                            </p>

                                            <p className="font-semibold">
                                                {order.mobile}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Address
                                            </p>

                                            <p className="font-semibold">
                                                {order.address}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Total
                                            </p>

                                            <p className="font-bold text-green-600">
                                                ₹{order.total_amount}
                                            </p>
                                        </div>

                                    </div>

                                    {/* ADDRESS */}

                                    <div className="mt-4 bg-gray-50 rounded-xl p-4">
                                        <div className="space-y-3 text-sm">

                                            {/* Customer */}
                                            ...

                                            {/* Mobile */}
                                            ...

                                            {/* Payment */}
                                            ...

                                            {/* Status */}
                                            ...

                                            {/* Total */}
                                            <div className="border-t pt-3 flex justify-between gap-4">
                                                <span className="font-semibold">
                                                    Total
                                                </span>
                                                <span className="font-bold text-green-600">
                                                    ₹{order.total_amount}
                                                </span>
                                            </div>

                                            {/* Delivery Location */}
                                            <div className="border-t pt-3 mt-3">
                                                <p className="text-sm text-gray-500 mb-2">
                                                    Delivery Location
                                                </p>

                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                        order.location
                                                    )}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition"
                                                >
                                                    📍 View Live Location
                                                </a>
                                            </div>

                                        </div>
                                    </div>

                                </div>

                                {/* ================= DETAILS ================= */}

                                <div className="border-t p-5">

                                    <button
                                        onClick={() =>
                                            setOpenOrder(
                                                openOrder === order.id
                                                    ? null
                                                    : order.id
                                            )
                                        }
                                        className="text-blue-600 font-semibold hover:underline"
                                    >
                                        {openOrder === order.id
                                            ? "Hide Details ↑"
                                            : "View Details ↓"}
                                    </button>

                                    {openOrder === order.id && (
                                        <div className="mt-4 bg-gray-50 rounded-xl p-4">

                                            <div className="space-y-3 text-sm">

                                                <div className="flex justify-between gap-4">
                                                    <span className="text-gray-500">
                                                        Customer
                                                    </span>

                                                    <span className="font-semibold text-right">
                                                        {order.customer_name}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between gap-4">
                                                    <span className="text-gray-500">
                                                        Mobile
                                                    </span>

                                                    <span className="font-semibold text-right">
                                                        {order.mobile}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between gap-4">
                                                    <span className="text-gray-500">
                                                        Payment
                                                    </span>

                                                    <span className="font-semibold">
                                                        Cash on Delivery
                                                    </span>
                                                </div>

                                                <div className="flex justify-between gap-4">
                                                    <span className="text-gray-500">
                                                        Status
                                                    </span>

                                                    <span className="font-semibold capitalize">
                                                        {order.status}
                                                    </span>
                                                </div>

                                                {order.status === "cancelled" && (
                                                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                                                        <p className="text-sm text-red-500 font-semibold">
                                                            Cancellation Reason
                                                        </p>

                                                        <p className="text-red-700 font-medium">
                                                            {order.cancellation_reason}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="border-t pt-3 flex justify-between gap-4">
                                                    <span className="font-semibold">
                                                        Total
                                                    </span>

                                                    <span className="font-bold text-green-600">
                                                        ₹{order.total_amount}
                                                    </span>
                                                </div>

                                                

                                            </div>

                                        </div>
                                    )}

                                </div>

                                {/* ================= STATUS ================= */}

                                <div className="border-t bg-gray-50 p-5">

                                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                                        Update Order Status
                                    </label>

                                    <select
                                        value={order.status || "pending"}
                                        disabled={updating === order.id}
                                        onChange={(e) =>
                                            updateStatus(
                                                order.id,
                                                e.target.value
                                            )
                                        }
                                        className="w-full sm:w-64 border border-gray-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
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

                                    {updating === order.id && (
                                        <p className="text-sm text-blue-600 mt-2">
                                            Updating...
                                        </p>
                                    )}

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>
        </main>
    );
}

export default AdminOrders;