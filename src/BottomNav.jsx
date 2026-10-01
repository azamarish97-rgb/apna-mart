import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Grid3x3, ShoppingCart, Package, User } from "lucide-react";
import { supabase } from "./supabase";
import { useCart } from "./cartcontext";

function BottomNav() {
    const navigate = useNavigate();
    const { cart } = useCart();

    const [user, setUser] = useState(null);

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    // ================= AUTH STATE =================

    useEffect(() => {
        const loadUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUser(user);
        };

        loadUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // ================= ACCOUNT CLICK =================

    const handleAccountClick = () => {
        if (user) {
            navigate("/my-orders"); // logged in -> account/orders area
        } else {
            navigate("/login");
        }
    };

    const navItems = [
        { to: "/", icon: Home, label: "Home" },
        { to: "/products", icon: Grid3x3, label: "Products" },
        { to: "/my-orders", icon: Package, label: "Orders" },
        { to: "/login", icon: User, label: "Account" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">

            {/* ================= BAR ================= */}

            <div className="relative bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">

                <div className="max-w-7xl mx-auto flex items-center justify-around px-1">

                    {/* LEFT 2 ITEMS */}

                    {navItems.slice(0, 2).map((item) => (
                        <TabLink key={item.to} item={item} />
                    ))}

                    {/* CENTER SPACER for floating cart button */}

                    <div className="w-16 flex-shrink-0"></div>

                    {/* RIGHT 2 ITEMS */}

                    {navItems.slice(2).map((item) =>
                        item.label === "Account" ? (
                            <button
                                key={item.to}
                                onClick={handleAccountClick}
                                className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 text-gray-500 hover:text-gray-700 transition"
                            >
                                <User size={22} />
                                <span className="text-[10px] font-medium">
                                    {user ? "Account" : "Login"}
                                </span>
                            </button>
                        ) : (
                            <TabLink key={item.to} item={item} />
                        )
                    )}

                </div>

            </div>

            {/* ================= FLOATING CART BUTTON ================= */}

            <NavLink
                to="/cart"
                className="absolute left-1/2 -translate-x-1/2 -top-6"
            >
                {({ isActive }) => (
                    <div
                        className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-transform active:scale-90 ${isActive
                                ? "bg-green-600"
                                : "bg-blue-600"
                            }`}
                    >
                        <ShoppingCart size={24} className="text-white" strokeWidth={2.2} />

                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                {cartCount > 9 ? "9+" : cartCount}
                            </span>
                        )}
                    </div>
                )}
            </NavLink>

        </nav>
    );
}

// ================= TAB LINK COMPONENT =================

function TabLink({ item }) {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.to}
            end={item.to === "/"}
            className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-2.5"
        >
            {({ isActive }) => (
                <>
                    <Icon
                        size={22}
                        className={isActive ? "text-green-600" : "text-gray-500"}
                        strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span
                        className={`text-[10px] font-medium ${isActive ? "text-green-600" : "text-gray-500"
                            }`}
                    >
                        {item.label}
                    </span>

                    {isActive && (
                        <span className="absolute -top-0.5 w-1 h-1 rounded-full bg-green-600"></span>
                    )}
                </>
            )}
        </NavLink>
    );
}

export default BottomNav;