import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import {
    Search,
    ShoppingCart,
    Menu,
    X,
    Home,
    ShoppingBag,
    Package,
    Settings,
    LogIn,
    UserPlus,
    LogOut,
    ChevronRight,
    Palette,
    Check,
} from "lucide-react";

import { supabase } from "./supabase";
import { useCart } from "./cartcontext";

function Navbar() {
    const navigate = useNavigate();
    const { cart } = useCart();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [themeOpen, setThemeOpen] = useState(false);

    const [currentTheme, setCurrentTheme] = useState(
        localStorage.getItem("apna-mart-theme") || "blue"
    );

    const themes = [
        {
            id: "blue",
            name: "Classic Blue",
            color: "#2563eb",
        },
        {
            id: "green",
            name: "Fresh Green",
            color: "#16a34a",
        },
        {
            id: "purple",
            name: "Royal Purple",
            color: "#7c3aed",
        },
        {
            id: "orange",
            name: "Sunset Orange",
            color: "#ea580c",
        },
        {
            id: "dark",
            name: "Dark Mode",
            color: "#1f2937",
        },
    ];

    const cartCount = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    /* =====================================================
       THEME
    ====================================================== */

    const applyTheme = (theme) => {
        if (theme === "blue") {
            document.documentElement.removeAttribute(
                "data-theme"
            );
        } else {
            document.documentElement.setAttribute(
                "data-theme",
                theme
            );
        }

        localStorage.setItem(
            "apna-mart-theme",
            theme
        );

        setCurrentTheme(theme);
    };

    useEffect(() => {
        const savedTheme =
            localStorage.getItem("apna-mart-theme") ||
            "blue";

        applyTheme(savedTheme);
    }, []);

    const changeTheme = (theme) => {
        applyTheme(theme);
        setThemeOpen(false);
    };

    /* =====================================================
       PROFILE
    ====================================================== */

    const loadProfile = async (currentUser) => {
        if (!currentUser) {
            setProfile(null);
            return;
        }

        const { data, error } = await supabase
            .from("profiles")
            .select(
                "full_name, mobile, email, role"
            )
            .eq("id", currentUser.id)
            .maybeSingle();

        if (error) {
            console.error(
                "PROFILE ERROR:",
                error
            );
        }

        setProfile(data);
    };

    /* =====================================================
       AUTH
    ====================================================== */

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
                const currentUser =
                    session?.user ?? null;

                setUser(currentUser);

                if (currentUser) {
                    await loadProfile(
                        currentUser
                    );
                } else {
                    setProfile(null);
                }
            }
        );

        return () =>
            subscription.unsubscribe();
    }, []);

    /* =====================================================
       LOGOUT
    ====================================================== */

    const handleLogout = async () => {
        const { error } =
            await supabase.auth.signOut();

        if (error) {
            alert("Logout failed ❌");
            return;
        }

        setUser(null);
        setProfile(null);
        setMenuOpen(false);

        alert(
            "Logged out successfully 👋"
        );
    };

    const userName =
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        "User";

    const closeMenu = () => {
        setMenuOpen(false);
        setThemeOpen(false);
    };

    return (
        <nav className="sticky top-0 z-50">

            {/* =====================================================
                MAIN NAVBAR
            ====================================================== */}

            <div className="bg-[var(--primary)] text-white shadow-lg">

                <div className="max-w-7xl mx-auto px-3 sm:px-5">

                    {/* TOP ROW */}

                    <div className="min-h-[64px] flex items-center gap-3">

                        {/* LOGO */}

                        <Link
                            to="/"
                            onClick={closeMenu}
                            className="flex items-center gap-2 shrink-0 group"
                        >

                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0">

                                <img
                                    src="arish.jpeg"
                                    alt="Apna Mart"
                                    className="w-full h-full object-cover"
                                />

                            </div>

                            <div className="leading-none">

                                <div className="font-extrabold text-lg sm:text-2xl tracking-tight">
                                    Apna Mart
                                </div>

                                <div className="hidden sm:block text-[10px] text-white/80 font-medium tracking-wide mt-1">
                                    Your Local Online Store
                                </div>

                            </div>

                        </Link>


                        {/* DESKTOP SEARCH */}

                        <div className="hidden md:flex flex-1 max-w-2xl mx-4">

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/search"
                                    )
                                }
                                className="w-full h-11 bg-white rounded-xl flex items-center text-left shadow-sm hover:shadow-md transition"
                            >

                                <Search
                                    size={19}
                                    className="ml-4 text-gray-400"
                                />

                                <span className="ml-3 text-sm text-gray-400">
                                    Search for products, brands and more...
                                </span>

                            </button>

                        </div>


                        {/* DESKTOP NAV */}

                        <div className="hidden md:flex items-center gap-1 ml-auto">

                            <Link
                                to="/"
                                className="px-3 py-2 rounded-lg font-medium hover:bg-[var(--primary-dark)] transition"
                            >
                                Home
                            </Link>

                            <Link
                                to="/products"
                                className="px-3 py-2 rounded-lg font-medium hover:bg-[var(--primary-dark)] transition"
                            >
                                Products
                            </Link>


                            {user ? (
                                <>

                                    <Link
                                        to="/my-orders"
                                        className="px-3 py-2 rounded-lg font-medium hover:bg-[var(--primary-dark)] transition"
                                    >
                                        My Orders
                                    </Link>


                                    {/* USER */}

                                    <div className="flex items-center gap-2 px-3 py-2">

                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                            <UserPlus size={16} />
                                        </div>

                                        <span className="font-semibold max-w-[110px] truncate">
                                            {userName}
                                        </span>

                                    </div>


                                    {/* ADMIN */}

                                    {profile?.role ===
                                        "admin" && (
                                            <Link
                                                to="/admin/orders"
                                                className="px-3 py-2 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition"
                                            >
                                                Admin
                                            </Link>
                                        )}


                                    {/* LOGOUT */}

                                    <button
                                        onClick={
                                            handleLogout
                                        }
                                        className="bg-white text-[var(--primary)] px-4 py-2 rounded-xl font-bold hover:bg-gray-100 active:scale-95 transition"
                                    >
                                        Logout
                                    </button>

                                </>
                            ) : (
                                <>

                                    <Link
                                        to="/login"
                                        className="px-3 py-2 font-medium hover:text-white/80 transition"
                                    >
                                        Login
                                    </Link>

                                    <Link
                                        to="/signup"
                                        className="bg-white text-[var(--primary)] px-4 py-2 rounded-xl font-bold hover:bg-gray-100 active:scale-95 transition"
                                    >
                                        Signup
                                    </Link>

                                </>
                            )}


                            {/* THEME */}

                            <div className="relative">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setThemeOpen(
                                            !themeOpen
                                        )
                                    }
                                    className="w-11 h-11 rounded-xl bg-[var(--primary-dark)] hover:brightness-95 flex items-center justify-center transition"
                                    title="Change Theme"
                                >
                                    <Palette
                                        size={21}
                                    />
                                </button>


                                {themeOpen && (
                                    <div className="absolute right-0 top-14 w-56 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 p-2">

                                        <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">
                                            Choose Theme
                                        </p>

                                        {themes.map(
                                            (theme) => (
                                                <button
                                                    key={
                                                        theme.id
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        changeTheme(
                                                            theme.id
                                                        )
                                                    }
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition"
                                                >

                                                    <span
                                                        className="w-7 h-7 rounded-full border-2 border-white shadow"
                                                        style={{
                                                            backgroundColor:
                                                                theme.color,
                                                        }}
                                                    />

                                                    <span className="flex-1 text-left text-sm font-medium">
                                                        {
                                                            theme.name
                                                        }
                                                    </span>

                                                    {currentTheme ===
                                                        theme.id && (
                                                            <Check
                                                                size={
                                                                    18
                                                                }
                                                                className="text-green-600"
                                                            />
                                                        )}

                                                </button>
                                            )
                                        )}

                                    </div>
                                )}

                            </div>


                            {/* CART */}

                            <Link
                                to="/cart"
                                className="relative w-11 h-11 rounded-xl bg-[var(--primary-dark)] hover:brightness-95 flex items-center justify-center transition ml-1"
                            >

                                <ShoppingCart
                                    size={22}
                                />

                                {cartCount >
                                    0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white min-w-5 h-5 px-1 rounded-full text-[10px] flex items-center justify-center font-extrabold border-2 border-[var(--primary)]">
                                            {
                                                cartCount
                                            }
                                        </span>
                                    )}

                            </Link>

                        </div>


                        {/* MOBILE RIGHT */}

                        <div className="md:hidden ml-auto flex items-center gap-1">

                            {/* CART */}

                            <Link
                                to="/cart"
                                onClick={closeMenu}
                                className="relative w-11 h-11 flex items-center justify-center rounded-xl hover:bg-[var(--primary-dark)] transition"
                            >

                                <ShoppingCart
                                    size={22}
                                />

                                {cartCount >
                                    0 && (
                                        <span className="absolute top-0 right-0 bg-red-500 text-white min-w-5 h-5 px-1 rounded-full text-[10px] flex items-center justify-center font-bold border-2 border-[var(--primary)]">
                                            {
                                                cartCount
                                            }
                                        </span>
                                    )}

                            </Link>


                            {/* MENU */}

                            <button
                                onClick={() =>
                                    setMenuOpen(
                                        !menuOpen
                                    )
                                }
                                className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-[var(--primary-dark)] transition"
                            >

                                {menuOpen ? (
                                    <X size={25} />
                                ) : (
                                    <Menu size={25} />
                                )}

                            </button>

                        </div>

                    </div>


                    {/* MOBILE SEARCH */}

                    <div className="md:hidden pb-3">

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/search"
                                )
                            }
                            className="w-full bg-white rounded-xl h-11 flex items-center text-left shadow-sm"
                        >

                            <Search
                                size={18}
                                className="ml-3 text-gray-400"
                            />

                            <span className="ml-3 text-sm text-gray-400">
                                Search products...
                            </span>

                        </button>

                    </div>

                </div>

            </div>


            {/* =====================================================
                MOBILE DRAWER
            ====================================================== */}

            {menuOpen && (
                <>

                    {/* OVERLAY */}

                    <div
                        onClick={closeMenu}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-[2px]"
                    />


                    {/* DRAWER */}

                    <div className="fixed top-0 right-0 h-full w-[86%] max-w-sm bg-white text-gray-800 z-50 shadow-2xl md:hidden overflow-y-auto">

                        {/* HEADER */}

                        <div className="bg-[var(--primary)] text-white px-4 py-4 flex items-center justify-between">

                            <Link
                                to="/"
                                onClick={closeMenu}
                                className="flex items-center gap-2"
                            >

                                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">

                                    <img
                                        src="arish.jpeg"
                                        alt="Apna Mart"
                                        className="w-full h-full object-cover"
                                    />

                                </div>

                                <div>

                                    <div className="font-extrabold text-lg">
                                        Apna Mart
                                    </div>

                                    <div className="text-[10px] text-white/80">
                                        Your Local Online Store
                                    </div>

                                </div>

                            </Link>


                            <button
                                onClick={closeMenu}
                                className="w-10 h-10 rounded-full bg-[var(--primary-dark)] flex items-center justify-center hover:brightness-95"
                            >
                                <X size={21} />
                            </button>

                        </div>


                        {/* USER CARD */}

                        {user && (
                            <div className="m-4 p-4 bg-[var(--primary-light)] rounded-2xl border border-gray-200">

                                <div className="flex items-center gap-3">

                                    <div className="w-11 h-11 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-sm">
                                        <UserPlus
                                            size={20}
                                        />
                                    </div>

                                    <div className="min-w-0">

                                        <p className="text-xs text-gray-500">
                                            Welcome back 👋
                                        </p>

                                        <h3 className="font-bold text-[var(--primary)] truncate">
                                            {userName}
                                        </h3>

                                        {profile?.email && (
                                            <p className="text-xs text-gray-500 truncate">
                                                {
                                                    profile.email
                                                }
                                            </p>
                                        )}

                                    </div>

                                </div>

                            </div>
                        )}


                        {/* MENU */}

                        <div className="p-3 space-y-1">

                            <Link
                                to="/"
                                onClick={closeMenu}
                                className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-[var(--primary-light)] transition font-medium"
                            >

                                <span className="flex items-center gap-4">

                                    <Home
                                        size={20}
                                        className="text-[var(--primary)]"
                                    />

                                    Home

                                </span>

                                <ChevronRight
                                    size={17}
                                />

                            </Link>


                            <Link
                                to="/products"
                                onClick={closeMenu}
                                className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-[var(--primary-light)] transition font-medium"
                            >

                                <span className="flex items-center gap-4">

                                    <ShoppingBag
                                        size={20}
                                        className="text-[var(--primary)]"
                                    />

                                    Products

                                </span>

                                <ChevronRight
                                    size={17}
                                />

                            </Link>


                            <Link
                                to="/cart"
                                onClick={closeMenu}
                                className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-[var(--primary-light)] transition font-medium"
                            >

                                <span className="flex items-center gap-4">

                                    <ShoppingCart
                                        size={20}
                                        className="text-[var(--primary)]"
                                    />

                                    Cart

                                </span>

                                {cartCount >
                                    0 && (
                                        <span className="bg-[var(--primary)] text-white min-w-6 h-6 px-2 rounded-full flex items-center justify-center text-xs font-bold">
                                            {
                                                cartCount
                                            }
                                        </span>
                                    )}

                            </Link>


                            {/* MOBILE THEME */}

                            <div className="pt-3 mt-2 border-t border-gray-100">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setThemeOpen(
                                            !themeOpen
                                        )
                                    }
                                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-[var(--primary-light)] transition font-medium"
                                >

                                    <span className="flex items-center gap-4">

                                        <Palette
                                            size={20}
                                            className="text-[var(--primary)]"
                                        />

                                        Theme

                                    </span>

                                    <ChevronRight
                                        size={17}
                                    />

                                </button>


                                {themeOpen && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded-xl">

                                        {themes.map(
                                            (theme) => (
                                                <button
                                                    key={
                                                        theme.id
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        changeTheme(
                                                            theme.id
                                                        )
                                                    }
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white transition"
                                                >

                                                    <span
                                                        className="w-6 h-6 rounded-full shadow-sm"
                                                        style={{
                                                            backgroundColor:
                                                                theme.color,
                                                        }}
                                                    />

                                                    <span className="flex-1 text-left text-sm">
                                                        {
                                                            theme.name
                                                        }
                                                    </span>

                                                    {currentTheme ===
                                                        theme.id && (
                                                            <Check
                                                                size={
                                                                    17
                                                                }
                                                                className="text-green-600"
                                                            />
                                                        )}

                                                </button>
                                            )
                                        )}

                                    </div>
                                )}

                            </div>


                            {user ? (
                                <>

                                    <Link
                                        to="/my-orders"
                                        onClick={closeMenu}
                                        className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-[var(--primary-light)] transition font-medium"
                                    >

                                        <span className="flex items-center gap-4">

                                            <Package
                                                size={20}
                                                className="text-[var(--primary)]"
                                            />

                                            My Orders

                                        </span>

                                        <ChevronRight
                                            size={17}
                                        />

                                    </Link>


                                    {profile?.role ===
                                        "admin" && (
                                            <Link
                                                to="/admin/orders"
                                                onClick={
                                                    closeMenu
                                                }
                                                className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] font-semibold"
                                            >

                                                <span className="flex items-center gap-4">

                                                    <Settings
                                                        size={
                                                            20
                                                        }
                                                    />

                                                    Admin Panel

                                                </span>

                                                <ChevronRight
                                                    size={
                                                        17
                                                    }
                                                />

                                            </Link>
                                        )}


                                    <button
                                        onClick={
                                            handleLogout
                                        }
                                        className="w-full flex items-center gap-4 px-4 py-3.5 mt-4 rounded-xl bg-red-50 text-red-600 font-semibold text-left hover:bg-red-100 transition"
                                    >

                                        <LogOut
                                            size={20}
                                        />

                                        Logout

                                    </button>

                                </>
                            ) : (
                                <>

                                    <Link
                                        to="/login"
                                        onClick={closeMenu}
                                        className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[var(--primary-light)] transition font-medium"
                                    >

                                        <LogIn
                                            size={20}
                                            className="text-[var(--primary)]"
                                        />

                                        Login

                                    </Link>


                                    <Link
                                        to="/signup"
                                        onClick={closeMenu}
                                        className="flex items-center justify-center gap-2 mt-3 bg-[var(--primary)] text-white px-4 py-3.5 rounded-xl font-bold hover:bg-[var(--primary-dark)] transition"
                                    >

                                        <UserPlus
                                            size={18}
                                        />

                                        Create Account

                                    </Link>

                                </>
                            )}

                        </div>


                        {/* BOTTOM */}

                        <div className="px-6 py-6 mt-4 text-center">

                            <p className="text-xs text-gray-400">
                                Apna Mart
                            </p>

                            <p className="text-[11px] text-gray-300 mt-1">
                                Your Local Online Store 🛒
                            </p>

                        </div>

                    </div>

                </>
            )}

        </nav>
    );
}

export default Navbar;