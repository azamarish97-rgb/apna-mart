import { useState, useEffect } from "react";
import { useCart } from "./cartcontext";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";




function Cart() {
    const [showCheckout, setShowCheckout] = useState(false);

    const [customer, setCustomer] = useState({
        name: "",
        mobile: "",
        address: "",
        location: "",
    });

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [location, setLocation] = useState(null);

    const {
        cart,
        decreaseQuantity,
        increaseQuantity,
        removeFromCart,
        clearCart,
    } = useCart();

    const navigate = useNavigate();

    // ================= CHECK LOGIN + LOAD PROFILE =================
    useEffect(() => {

        // LocalStorage se saved address nikalo
        const savedAddress = localStorage.getItem("apnaMartAddress");

        const checkUser = async () => {

            const {
                data: { user },
            } = await supabase.auth.getUser();

            setUser(user);

            if (!user) {
                // Login nahi hai, phir bhi saved address load ho
                if (savedAddress) {
                    setCustomer((current) => ({
                        ...current,
                        address: savedAddress,
                    }));
                }

                return;
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("full_name, mobile, email")
                .eq("id", user.id)
                .maybeSingle();

            if (error) {
                console.error("PROFILE ERROR:", error);
                return;
            }

            setProfile(data);

            // Profile + LocalStorage address ek saath load
            setCustomer((current) => ({
                ...current,
                name: data?.full_name || "",
                mobile: data?.mobile || "",
                address: savedAddress || "",
            }));
        };

        checkUser();

    }, []);

    // ================= TOTAL =================
    const total = cart.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
    );

    const totalItems = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    // ================= LIVE LOCATION =================
    // ================= LIVE LOCATION =================

    const getLiveLocation = () => {
        if (!navigator.geolocation) {
            alert("Your browser does not support live location.");
            return;
        }

        setLocationLoading(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const accuracy = position.coords.accuracy;

                console.log("LATITUDE:", latitude);
                console.log("LONGITUDE:", longitude);
                console.log("ACCURACY:", accuracy, "meters");

                setLocation({
                    latitude,
                    longitude,
                });

                setCustomer((current) => ({
                    ...current,
                    location: `${latitude},${longitude}`,
                }));

                setLocationLoading(false);
            },

            (error) => {
                console.error("LOCATION ERROR:", error);
                setLocationLoading(false);

                switch (error.code) {
                    case 1:
                        alert(
                            "Location permission denied. Browser settings me location Allow karo."
                        );
                        break;

                    case 2:
                        alert(
                            "Location unavailable. GPS/Location ON karo aur dobara try karo."
                        );
                        break;

                    case 3:
                        alert(
                            "Location request timeout. Thodi der baad dobara try karo."
                        );
                        break;

                    default:
                        alert("Unable to get your location.");
                }
            },

            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0,
            }
        );
    };

    // ================= EMPTY CART =================
    if (cart.length === 0) {
        return (
            <main className="min-h-screen bg-gray-100 px-4 py-12">
                <div className="max-w-xl mx-auto bg-white rounded-xl p-8 text-center shadow-sm">

                    <div className="text-7xl mb-5">
                        🛒
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        Your Cart is Empty
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Looks like you haven't added anything yet.
                    </p>

                    <button
                        onClick={() => navigate("/products")}
                        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        Continue Shopping 🛍️
                    </button>

                </div>
            </main>
        );
    }

    // ================= CHECKOUT =================
    const handleCheckout = () => {
        if (!user) {
            alert("Please login before checkout 🔐");
            navigate("/login");
            return;
        }

        setShowCheckout(true);
    };

    const loadProfile = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            alert("Please login first");
            navigate("/login");
            return null;
        }

        console.log("AUTH USER ID:", user.id);

        const { data, error } = await supabase
            .from("profiles")
            .select("full_name, mobile, email")
            .eq("id", user.id)
            .single();

        console.log("PROFILE:", data);
        console.log("PROFILE ERROR:", error);

        if (error) {
            alert("Profile load failed ❌");
            return null;
        }

        setUser(user);
        setProfile(data);

        setCustomer((current) => ({
            ...current,
            name: data.full_name || "",
            mobile: data.mobile || "",
        }));

        return {
            user,
            profile: data,
        };
    };

    // ================= PLACE ORDER =================
    const placeOrder = async () => {
        console.log("PLACE ORDER CLICKED");

        const result = await loadProfile();

        if (!result) return;

        const { user, profile } = result;

        if (!customer.address.trim()) {
            alert("Please provide delivery address.");
            return;
        }

        const { error } = await supabase
            .from("orders")
            .insert([
                {
                    user_id: user.id,
                    customer_name: profile.full_name,
                    mobile: profile.mobile,
                    address: customer.address.trim(),
                    location: customer.location,
                    total_amount: total,
                    status: "pending",
                },
            ]);

        if (error) {
            console.error("ORDER ERROR:", error);
            alert("Order failed ❌");
            return;
        }

        alert("Order placed successfully 🎉");

        clearCart();
        navigate("/order-success");
    };
    return (
        <main className="min-h-screen bg-gray-100">

            {/* ================= PAGE ================= */}
            <div className="max-w-7xl mx-auto px-3 sm:px-5 py-5 sm:py-8">

                {/* Heading */}
                <div className="mb-5">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        My Cart 🛒
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        {totalItems} items in your cart
                    </p>
                </div>


                <div className="grid lg:grid-cols-3 gap-5">

                    {/* ================================================= */}
                    {/* CART PRODUCTS */}
                    {/* ================================================= */}

                    <div className="lg:col-span-2 space-y-3">

                        {cart.map((item) => (

                            <div
                                key={item.id}
                                className="bg-white rounded-xl shadow-sm p-3 sm:p-5"
                            >

                                <div className="flex gap-3 sm:gap-5">

                                    {/* Image */}
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center bg-gray-50 rounded-lg">

                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-full h-full object-contain rounded-lg"
                                        />

                                    </div>


                                    {/* Details */}
                                    <div className="flex-1 min-w-0">

                                        <p className="text-xs text-gray-500 mb-1">
                                            {item.category}
                                        </p>

                                        <h2 className="font-semibold text-base sm:text-lg text-gray-800 line-clamp-2">
                                            {item.name}
                                        </h2>

                                        <p className="text-green-600 font-bold mt-2">
                                            ₹{item.price}
                                        </p>


                                        {/* Quantity */}
                                        <div className="flex items-center gap-2 mt-3">

                                            <button
                                                onClick={() =>
                                                    decreaseQuantity(item.id)
                                                }
                                                className="w-8 h-8 sm:w-9 sm:h-9 border rounded-md flex items-center justify-center text-lg font-bold hover:bg-gray-100"
                                            >
                                                −
                                            </button>

                                            <span className="w-8 text-center font-semibold">
                                                {item.quantity}
                                            </span>

                                            <button
                                                onClick={() =>
                                                    increaseQuantity(item.id)
                                                }
                                                className="w-8 h-8 sm:w-9 sm:h-9 border rounded-md flex items-center justify-center text-lg font-bold hover:bg-gray-100"
                                            >
                                                +
                                            </button>

                                        </div>

                                    </div>


                                    {/* Item Total */}
                                    <div className="hidden sm:block text-right">

                                        <p className="font-bold text-gray-800">
                                            ₹
                                            {Number(item.price) *
                                                item.quantity}
                                        </p>

                                        <button
                                            onClick={() =>
                                                removeFromCart(item.id)
                                            }
                                            className="text-red-500 text-sm mt-5 hover:text-red-700"
                                        >
                                            Remove
                                        </button>

                                    </div>

                                </div>


                                {/* Mobile Bottom */}
                                <div className="sm:hidden flex items-center justify-between border-t mt-3 pt-3">

                                    <span className="font-bold">
                                        ₹
                                        {Number(item.price) *
                                            item.quantity}
                                    </span>

                                    <button
                                        onClick={() =>
                                            removeFromCart(item.id)
                                        }
                                        className="text-red-500 text-sm font-semibold"
                                    >
                                        🗑️ Remove
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>


                    {/* ================================================= */}
                    {/* ORDER SUMMARY */}
                    {/* ================================================= */}

                    <div className="lg:col-span-1">

                        <div className="bg-white rounded-xl shadow-sm p-5 lg:sticky lg:top-24">

                            <h2 className="text-lg font-bold text-gray-800 border-b pb-4">
                                Price Details
                            </h2>


                            <div className="space-y-4 py-4">

                                <div className="flex justify-between text-sm">
                                    <span>
                                        Price ({totalItems} items)
                                    </span>

                                    <span>
                                        ₹{total}
                                    </span>
                                </div>


                                <div className="flex justify-between text-sm">
                                    <span>
                                        Delivery
                                    </span>

                                    <span className="text-green-600 font-semibold">
                                        FREE
                                    </span>
                                </div>

                            </div>


                            <div className="border-t border-dashed pt-4 flex justify-between text-lg font-bold">

                                <span>
                                    Total Amount
                                </span>

                                <span className="text-green-600">
                                    ₹{total}
                                </span>

                            </div>


                            <button
                                onClick={handleCheckout}
                                className="w-full mt-5 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition"
                            >
                                Proceed to Checkout
                            </button>


                            {/* ================= CHECKOUT ================= */}

                            {showCheckout && (

                                <div className="mt-6 border-t pt-5">

                                    <div className="flex items-center justify-between mb-4">

                                        <h2 className="text-lg font-bold">
                                            Delivery Details
                                        </h2>

                                        <button
                                            onClick={() =>
                                                setShowCheckout(false)
                                            }
                                            className="text-gray-400 hover:text-gray-700"
                                        >
                                            ✕
                                        </button>

                                    </div>


                                    {/* Saved Name */}
                                    <div className="mb-4">

                                        <label className="block text-sm font-semibold text-gray-600 mb-1">
                                            Name
                                        </label>

                                        <div className="w-full bg-gray-100 border rounded-lg px-4 py-3 text-gray-700">
                                            {profile?.full_name ||
                                                customer.name ||
                                                "User"}
                                        </div>

                                    </div>


                                    {/* Saved Mobile */}
                                    <div className="mb-4">

                                        <label className="block text-sm font-semibold text-gray-600 mb-1">
                                            Mobile
                                        </label>

                                        <div className="w-full bg-gray-100 border rounded-lg px-4 py-3 text-gray-700">
                                            {profile?.mobile ||
                                                customer.mobile ||
                                                "Not available"}
                                        </div>

                                    </div>


                                    {/* Address */}
                                    <div className="mb-3">

                                        <label className="block text-sm font-semibold text-gray-600 mb-1">
                                            Delivery Address
                                        </label>

                                        <textarea
                                            placeholder="Enter delivery address"
                                            value={customer.address}
                                            onChange={(e) => {
                                                const address = e.target.value;

                                                setCustomer({
                                                    ...customer,
                                                    address: address,
                                                });

                                                // Sirf user ka typed address LocalStorage me save
                                                localStorage.setItem("apnaMartAddress", address);
                                            }}
                                            rows="3"
                                            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />

                                    </div>


                                    {/* Live Location */}
                                    <button
                                        type="button"
                                        onClick={getLiveLocation}
                                        disabled={locationLoading}
                                        className="w-full border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
                                    >
                                        {locationLoading
                                            ? "Getting Location..."
                                            : location
                                                ? "📍 Location Added"
                                                : "📍 Use My Live Location"}
                                    </button>


                                    {location && (
                                        <p className="text-xs text-green-600 mt-2">
                                            ✓ Delivery location added successfully
                                        </p>
                                    )}


                                    {/* Place Order */}
                                    <button
                                        onClick={placeOrder}
                                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition"
                                    >
                                        Place Order 🚚
                                    </button>

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            </div>

        </main>
    );
}

export default Cart;