
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
    const [isScrolled, setIsScrolled] = useState(false);

    const [navbarMedia, setNavbarMedia] = useState({
        media_type: "none",
        media_url: "",
    });

    const [currentTheme, setCurrentTheme] = useState(
        localStorage.getItem("apna-mart-theme") || "blue"
    );

    const themes = [
        { id: "blue", name: "Classic Blue", color: "#2563eb" },
        { id: "green", name: "Fresh Green", color: "#16a34a" },
        { id: "purple", name: "Royal Purple", color: "#7c3aed" },
        { id: "orange", name: "Sunset Orange", color: "#ea580c" },
        { id: "dark", name: "Dark Mode", color: "#1f2937" },
    ];

    const cartCount = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    /* THEME */

    const applyTheme = (theme) => {
        if (theme === "blue") {
            document.documentElement.removeAttribute("data-theme");
        } else {
            document.documentElement.setAttribute("data-theme", theme);
        }

        localStorage.setItem("apna-mart-theme", theme);
        setCurrentTheme(theme);
    };

    useEffect(() => {
        const savedTheme =
            localStorage.getItem("apna-mart-theme") || "blue";

        applyTheme(savedTheme);
    }, []);

    const changeTheme = (theme) => {
        applyTheme(theme);
        setThemeOpen(false);
    };

    /* SCROLL: EXPANDED HEADER TO COMPACT HEADER */

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (ticking) return;

            ticking = true;

            window.requestAnimationFrame(() => {
                setIsScrolled(window.scrollY > 70);
                ticking = false;
            });
        };

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    /* LOAD NAVBAR MEDIA FROM SUPABASE */

    useEffect(() => {
        let active = true;

        const loadNavbarMedia = async () => {
            const { data, error } = await supabase
                .from("site_settings")
                .select("setting_value")
                .eq("setting_key", "navbar_background")
                .maybeSingle();

            if (error) {
                console.error("NAVBAR MEDIA ERROR:", error);
                return;
            }

            if (active && data?.setting_value) {
                setNavbarMedia({
                    media_type:
                        data.setting_value.media_type || "none",
                    media_url:
                        data.setting_value.media_url || "",
                });
            }
        };

        loadNavbarMedia();

        return () => {
            active = false;
        };
    }, []);

    /* PROFILE */

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

    /* AUTH */

    useEffect(() => {
        let active = true;

        const loadUser = async () => {
            const {
                data: { user: currentUser },
            } = await supabase.auth.getUser();

            if (!active) return;

            setUser(currentUser);

            if (currentUser) {
                await loadProfile(currentUser);
            }
        };

        loadUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                const currentUser = session?.user ?? null;

                setUser(currentUser);

                if (currentUser) {
                    setTimeout(() => {
                        loadProfile(currentUser);
                    }, 0);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    /* LOGOUT */

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            alert("Logout failed ❌");
            return;
        }

        setUser(null);
        setProfile(null);
        setMenuOpen(false);
        setThemeOpen(false);

        alert("Logged out successfully 👋");
    };

    const userName =
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        "User";

    const closeMenu = () => {
        setMenuOpen(false);
        setThemeOpen(false);
    };

    const hasMedia =
        navbarMedia.media_type !== "none" &&
        Boolean(navbarMedia.media_url);

    /* ORIGINAL IMAGE COLORS: NO GRADIENT OR DARK OVERLAY */

    const mediaStyle = hasMedia
        ? {
            backgroundImage:
                navbarMedia.media_type === "video"
                    ? "none"
                    : `url("${navbarMedia.media_url}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
        }
        : {};

    /* SEARCH */

    const searchButton = (mobile = false) => (
        <button
            type="button"
            onClick={() => {
                closeMenu();
                navigate("/search");
            }}
            className={`flex items-center text-left bg-white text-gray-500 rounded-xl shadow-sm hover:shadow-md transition-all ${mobile ? "w-full h-11" : "w-full h-12"
                }`}
        >
            <Search
                size={19}
                className="ml-4 shrink-0 text-gray-400"
            />

            <span className="ml-3 text-sm truncate pr-3">
                {mobile
                    ? "Search products..."
                    : "Search for products, brands and more..."}
            </span>
        </button>
    );

    /* CART */

    const cartButton = (mobile = false) => (
        <Link
            to="/cart"
            onClick={mobile ? closeMenu : undefined}
            className={`relative flex items-center justify-center rounded-xl transition ${mobile
                    ? "w-10 h-10"
                    : "w-11 h-11 bg-white/15 hover:bg-white/25"
                }`}
            aria-label={`Shopping cart, ${cartCount} items`}
        >
            <ShoppingCart size={22} />

            {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-300 text-gray-900 min-w-5 h-5 px-1 rounded-full text-[10px] flex items-center justify-center font-extrabold border-2 border-red-800">
                    {cartCount}
                </span>
            )}
        </Link>
    );

    /* THEME MENU */

    const themeMenu = (mobile = false) => (
        <div className="relative">
            <button
                type="button"
                onClick={() => setThemeOpen(!themeOpen)}
                className={
                    mobile
                        ? "w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-[var(--primary-light)] transition font-medium"
                        : "w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
                }
                title="Change Theme"
            >
                <span
                    className={
                        mobile ? "flex items-center gap-4" : ""
                    }
                >
                    <Palette
                        size={mobile ? 20 : 21}
                        className={
                            mobile ? "text-[var(--primary)]" : ""
                        }
                    />

                    {mobile && "Theme"}
                </span>

                {mobile && <ChevronRight size={17} />}
            </button>

            {themeOpen && (
                <div
                    className={
                        mobile
                            ? "mt-2 p-2 bg-gray-50 rounded-xl"
                            : "absolute right-0 top-14 w-56 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 p-2 z-[70]"
                    }
                >
                    {!mobile && (
                        <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">
                            Choose Theme
                        </p>
                    )}

                    {themes.map((theme) => (
                        <button
                            key={theme.id}
                            type="button"
                            onClick={() => changeTheme(theme.id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition"
                        >
                            <span
                                className="w-6 h-6 rounded-full border-2 border-white shadow shrink-0"
                                style={{
                                    backgroundColor: theme.color,
                                }}
                            />

                            <span className="flex-1 text-left text-sm font-medium">
                                {theme.name}
                            </span>

                            {currentTheme === theme.id && (
                                <Check
                                    size={18}
                                    className="text-green-600"
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 w-full text-white transition-shadow duration-300 ${isScrolled ? "shadow-xl" : "shadow-lg"
                }`}
            style={{
                isolation: "isolate",
            }}
        >
            {/* HEADER BACKGROUND */}

            <div
                className={`relative overflow-hidden bg-red-800 transition-all duration-300 ease-in-out ${isScrolled ? "shadow-md" : "shadow-lg"
                    }`}
                style={mediaStyle}
            >
                {/* VIDEO BACKGROUND */}

                {hasMedia && navbarMedia.media_type === "video" && (
                    <video
                        key={navbarMedia.media_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    >
                        <source src={navbarMedia.media_url} />
                    </video>
                )}

                {/* No black overlay: original media colors remain visible */}

                <div className="relative z-10 max-w-[1600px] mx-auto px-3 sm:px-5">
                    {/* TOP ROW */}

                    <div
                        className={`flex items-center gap-3 transition-all duration-300 ease-in-out ${isScrolled
                                ? "min-h-[62px] sm:min-h-[68px]"
                                : "min-h-[200px] sm:min-h-[230px]"
                            }`}
                    >
                        {/* LOGO */}

                        <Link
                            to="/"
                            onClick={closeMenu}
                            className="flex items-center gap-2 sm:gap-3 shrink-0 group"
                        >
                            <div
                                className={`rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-all duration-300 shrink-0 ${isScrolled
                                        ? "w-9 h-9"
                                        : "w-11 h-11 sm:w-14 sm:h-14"
                                    }`}
                            >
                                <img
                                    src="/arish.jpeg"
                                    alt="Apna Mart"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="leading-none">
                                <div
                                    className={`font-extrabold tracking-tight transition-all duration-300 ${isScrolled
                                            ? "text-base sm:text-xl"
                                            : "text-xl sm:text-3xl"
                                        }`}
                                >
                                    Apna Mart
                                </div>

                                {!isScrolled && (
                                    <div className="hidden sm:block text-[11px] text-white/90 font-medium tracking-wide mt-2">
                                        Your Local Online Store
                                    </div>
                                )}
                            </div>
                        </Link>

                        {/* DESKTOP SEARCH: ALWAYS VISIBLE */}

                        <div
                            className={`hidden md:flex flex-1 min-w-0 max-w-3xl transition-all duration-300 ${isScrolled ? "mx-2" : "mx-5"
                                }`}
                        >
                            {searchButton()}
                        </div>

                        {/* DESKTOP NAVIGATION */}

                        <div className="hidden md:flex items-center gap-1 ml-auto">
                            <Link
                                to="/"
                                className="px-3 py-2 rounded-lg font-semibold hover:bg-white/15 transition"
                            >
                                Home
                            </Link>

                            <Link
                                to="/products"
                                className="px-3 py-2 rounded-lg font-semibold hover:bg-white/15 transition"
                            >
                                Products
                            </Link>

                            {user ? (
                                <>
                                    <Link
                                        to="/my-orders"
                                        className="px-3 py-2 rounded-lg font-semibold hover:bg-white/15 transition whitespace-nowrap"
                                    >
                                        My Orders
                                    </Link>

                                    {!isScrolled && (
                                        <div className="flex items-center gap-2 px-2 py-2 max-w-36">
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                                <UserPlus size={16} />
                                            </div>

                                            <span className="font-semibold truncate">
                                                {userName}
                                            </span>
                                        </div>
                                    )}

                                    {profile?.role === "admin" && (
                                        <Link
                                            to="/admin/orders"
                                            className="px-3 py-2 rounded-lg font-semibold hover:bg-white/15 transition"
                                        >
                                            Admin
                                        </Link>
                                    )}

                                    {!isScrolled && (
                                        <button
                                            onClick={handleLogout}
                                            className="bg-white text-[var(--primary)] px-4 py-2 rounded-xl font-bold hover:bg-gray-100 active:scale-95 transition"
                                        >
                                            Logout
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="px-3 py-2 font-semibold hover:text-white/80 transition"
                                    >
                                        Login
                                    </Link>

                                    {!isScrolled && (
                                        <Link
                                            to="/signup"
                                            className="bg-white text-[var(--primary)] px-4 py-2 rounded-xl font-bold hover:bg-gray-100 active:scale-95 transition"
                                        >
                                            Signup
                                        </Link>
                                    )}
                                </>
                            )}

                            {themeMenu()}
                            {cartButton()}
                        </div>

                        {/* MOBILE ACTIONS */}

                        <div className="md:hidden ml-auto flex items-center gap-1">
                            {cartButton(true)}

                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(!menuOpen);
                                    setThemeOpen(false);
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/15 transition"
                                aria-label={
                                    menuOpen ? "Close menu" : "Open menu"
                                }
                            >
                                {menuOpen ? (
                                    <X size={24} />
                                ) : (
                                    <Menu size={24} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* MOBILE SEARCH: VISIBLE EVEN AFTER SCROLL */}

                    <div className="md:hidden pb-3">
                        {searchButton(true)}
                    </div>

                    {/* LARGE DESKTOP HERO AREA */}

                    <div
                        className={`hidden md:flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out ${isScrolled
                                ? "max-h-0 opacity-0"
                                : "max-h-28 pb-5 opacity-100"
                            }`}
                    >
                        {!hasMedia && (
                            <div className="w-full rounded-2xl bg-white/10 border border-white/15 px-6 py-5 flex items-center justify-between gap-5">
                                <div>
                                    <p className="text-2xl font-extrabold">
                                        Ghar ka samaan, ab online!
                                    </p>

                                    <p className="mt-1 text-sm text-white/85">
                                        Discover daily essentials at Apna Mart.
                                    </p>
                                </div>

                                <Link
                                    to="/products"
                                    className="shrink-0 rounded-xl bg-white text-red-800 font-bold px-5 py-3 hover:bg-gray-100 transition"
                                >
                                    Shop Now →
                                </Link>
                            </div>
                        )}

                        {hasMedia && (
                            <div className="w-full min-h-[74px] flex items-center justify-start py-3">
                                <div className="max-w-xl px-5 py-3">
                                    <p className="text-xl sm:text-2xl font-extrabold drop-shadow">
                                        Welcome to Apna Mart
                                    </p>

                                    <p className="text-sm text-white/90 mt-1">
                                        Your Local Online Store 🛒
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MOBILE DRAWER */}

            {menuOpen && (
                <>
                    <div
                        onClick={closeMenu}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-[2px]"
                    />

                    <div className="fixed top-0 right-0 h-full w-[86%] max-w-sm bg-white text-gray-800 z-[60] shadow-2xl md:hidden overflow-y-auto">
                        {/* DRAWER HEADER */}

                        <div className="bg-[var(--primary)] text-white px-4 py-4 flex items-center justify-between">
                            <Link
                                to="/"
                                onClick={closeMenu}
                                className="flex items-center gap-2"
                            >
                                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                                    <img
                                        src="/arish.jpeg"
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
                                aria-label="Close menu"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        {/* USER CARD */}

                        {user && (
                            <div className="m-4 p-4 bg-[var(--primary-light)] rounded-2xl border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-sm">
                                        <UserPlus size={20} />
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
                                                {profile.email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DRAWER LINKS */}

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

                                <ChevronRight size={17} />
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

                                <ChevronRight size={17} />
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

                                {cartCount > 0 && (
                                    <span className="bg-[var(--primary)] text-white min-w-6 h-6 px-2 rounded-full flex items-center justify-center text-xs font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* MOBILE THEME */}

                            <div className="pt-3 mt-2 border-t border-gray-100">
                                {themeMenu(true)}
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

                                        <ChevronRight size={17} />
                                    </Link>

                                    {profile?.role === "admin" && (
                                        <Link
                                            to="/admin/orders"
                                            onClick={closeMenu}
                                            className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] font-semibold"
                                        >
                                            <span className="flex items-center gap-4">
                                                <Settings size={20} />
                                                Admin Panel
                                            </span>

                                            <ChevronRight size={17} />
                                        </Link>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-4 px-4 py-3.5 mt-4 rounded-xl bg-red-50 text-red-600 font-semibold text-left hover:bg-red-100 transition"
                                    >
                                        <LogOut size={20} />
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
                                        <UserPlus size={18} />
                                        Create Account
                                    </Link>
                                </>
                            )}
                        </div>

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
