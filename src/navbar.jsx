import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useCart } from "./cartcontext";

function Navbar() {

    const navigate = useNavigate();
    const { cart } = useCart();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const cartCount = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const loadProfile = async (currentUser) => {
        if (!currentUser) {
            setProfile(null);
            return;
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("full_name, mobile, email, role")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (error) {
            console.error("PROFILE ERROR:", error);
        }

        setProfile(data);
    };

    useEffect(() => {
        const loadUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            setUser(user);

            if (user) {
                await loadProfile(user);
            }
        };

        loadUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const currentUser = session?.user ?? null;

                setUser(currentUser);

                if (currentUser) {
                    await loadProfile(currentUser);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            alert("Logout failed ❌");
            return;
        }

        setUser(null);
        setProfile(null);
        setMenuOpen(false);

        alert("Logged out successfully 👋");
    };

    const userName =
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        "User";

    const closeMenu = () => {
        setMenuOpen(false);
    };

    return (
        <nav className="sticky top-0 z-50 bg-blue-600 text-white shadow-lg">

            {/* Navbar */}
            <div className="max-w-7xl mx-auto px-3 sm:px-5">

                {/* Top Row */}
                <div className="min-h-[60px] flex items-center gap-2">

                    {/* Logo */}
                    <Link
                        to="/"
                        onClick={closeMenu}
                        className="font-bold text-lg sm:text-2xl whitespace-nowrap"
                    >
                        Apna Mart 🛒
                    </Link>

                    {/* Desktop Search */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-4">
                        <div className="w-full h-10 bg-white rounded-sm flex items-center">
                            <span className="px-3 text-gray-400">
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Search for products..."
                                onFocus={() => navigate("/search")}
                                className="w-full h-full text-gray-700 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:flex items-center gap-5 ml-auto">

                        <Link
                            to="/"
                            className="font-medium hover:text-yellow-300"
                        >
                            Home
                        </Link>

                        <Link
                            to="/products"
                            className="font-medium hover:text-yellow-300"
                        >
                            Products
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    to="/my-orders"
                                    className="font-medium hover:text-yellow-300"
                                >
                                    My Orders
                                </Link>

                                <span className="font-semibold">
                                    👋 {userName}
                                </span>

                                <button
                                    onClick={handleLogout}
                                    className="bg-white text-blue-600 px-5 py-2 rounded-sm font-bold"
                                >
                                    Logout
                                </button>

                                {profile?.role === "admin" && (
                                    <Link
                                        to="/admin/orders"
                                        className="font-medium hover:text-yellow-300"
                                    >
                                        Admin Panel
                                    </Link>
                                )}
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="bg-white text-blue-600 px-6 py-2 rounded-sm font-bold"
                                >
                                    Login
                                </Link>

                                <Link
                                    to="/signup"
                                    className="font-medium hover:text-yellow-300"
                                >
                                    Signup
                                </Link>
                            </>
                        )}

                        {/* Cart */}
                        <Link
                            to="/cart"
                            className="relative text-xl"
                        >
                            🛒

                            {cartCount > 0 && (
                                <span className="absolute -top-3 -right-3 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Mobile Right */}
                    <div className="md:hidden ml-auto flex items-center gap-1">

                        {/* Cart */}
                        <Link
                            to="/cart"
                            onClick={closeMenu}
                            className="relative w-10 h-10 flex items-center justify-center text-xl"
                        >
                            🛒

                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Menu */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="w-10 h-10 text-2xl flex items-center justify-center"
                        >
                            {menuOpen ? "✕" : "☰"}
                        </button>
                    </div>
                </div>

                {/* Mobile Search */}
                <div className="md:hidden pb-3">
                    <div className="bg-white rounded-sm h-11 flex items-center">

                        <span className="px-3 text-gray-400">
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder="Search for products..."
                            onFocus={() => navigate("/search")}
                            className="w-full h-full text-gray-700 text-sm outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <>
                    {/* Background Overlay */}
                    <div
                        onClick={closeMenu}
                        className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    ></div>

                    {/* Side Drawer */}
                    <div
                        className={`fixed top-0 right-0 h-full w-[82%] max-w-sm bg-white text-gray-800 z-50 shadow-2xl md:hidden
            transform transition-transform duration-300 ease-in-out
            ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
                    >

                        {/* Drawer Header */}
                        <div className="bg-blue-600 text-white px-4 py-4 flex items-center justify-between">

                            <Link
                                to="/"
                                onClick={closeMenu}
                                className="font-bold text-xl"
                            >
                                Apna Mart 🛒
                            </Link>

                            <button
                                onClick={closeMenu}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-blue-700"
                            >
                                ✕
                            </button>

                        </div>


                        {/* User Profile */}
                        {user && (
                            <div className="m-4 p-4 bg-blue-50 rounded-xl border border-blue-100">

                                <p className="text-xs text-gray-500">
                                    Welcome back
                                </p>

                                <h3 className="font-bold text-blue-700 mt-1">
                                    👋 {userName}
                                </h3>

                                {profile?.email && (
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                        {profile.email}
                                    </p>
                                )}

                            </div>
                        )}


                        {/* Menu Items */}
                        <div className="p-3 space-y-1">

                            <Link
                                to="/"
                                onClick={closeMenu}
                                className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-blue-50 active:bg-blue-100 transition font-medium"
                            >
                                <span className="text-xl">🏠</span>
                                <span>Home</span>
                            </Link>


                            <Link
                                to="/products"
                                onClick={closeMenu}
                                className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-blue-50 active:bg-blue-100 transition font-medium"
                            >
                                <span className="text-xl">🛍️</span>
                                <span>Products</span>
                            </Link>


                            <Link
                                to="/cart"
                                onClick={closeMenu}
                                className="flex items-center justify-between px-4 py-4 rounded-xl hover:bg-blue-50 active:bg-blue-100 transition font-medium"
                            >

                                <span className="flex items-center gap-4">
                                    <span className="text-xl">🛒</span>
                                    <span>Cart</span>
                                </span>

                                {cartCount > 0 && (
                                    <span className="bg-blue-600 text-white min-w-6 h-6 px-2 rounded-full flex items-center justify-center text-xs font-bold">
                                        {cartCount}
                                    </span>
                                )}

                            </Link>


                            {user ? (
                                <>
                                    <Link
                                        to="/my-orders"
                                        onClick={closeMenu}
                                        className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-blue-50 active:bg-blue-100 transition font-medium"
                                    >
                                        <span className="text-xl">📦</span>
                                        <span>My Orders</span>
                                    </Link>

                                    {profile?.role === "admin" && (
                                        <Link
                                            to="/admin/orders"
                                            onClick={closeMenu}
                                            className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-blue-50 active:bg-blue-100 transition font-medium"
                                        >
                                            <span className="text-xl">🛠️</span>
                                            <span>Admin Panel</span>
                                        </Link>
                                    )}

                                    


                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-4 px-4 py-4 mt-3 rounded-xl bg-red-50 text-red-600 font-semibold text-left hover:bg-red-100 transition"
                                    >
                                        <span className="text-xl">🚪</span>
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={closeMenu}
                                        className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-blue-50 active:bg-blue-100 transition font-medium"
                                    >
                                        <span className="text-xl">🔐</span>
                                        <span>Login</span>
                                    </Link>


                                    <Link
                                        to="/signup"
                                        onClick={closeMenu}
                                        className="block mt-3 bg-blue-600 text-white px-4 py-4 rounded-xl font-bold text-center hover:bg-blue-700 transition"
                                    >
                                        Create Account
                                    </Link>

                                       
                                </>
                            )}

                        </div>

                    </div>
                </>
            )}
        </nav>
    );
}

export default Navbar;