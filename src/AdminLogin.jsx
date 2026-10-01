import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

function AdminLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("ADMIN LOGIN ERROR:", error);
            alert("Invalid admin email or password ❌");
            setLoading(false);
            return;
        }

        const user = data.user;

        // Check admin role
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, email, role")
            .eq("id", user.id)
            .single();

        console.log("ADMIN USER:", user);
        console.log("ADMIN PROFILE:", profile);

        if (profileError || profile?.role !== "admin") {
            await supabase.auth.signOut();

            alert("Access denied ❌\nAdmin account required.");
            setLoading(false);
            return;
        }

        alert("Admin login successful ✅");

        navigate("/admin/orders");

        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8">

                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🔐</div>

                    <h1 className="text-3xl font-bold text-gray-900">
                        Admin Login
                    </h1>

                    <p className="text-gray-500 mt-2">
                        ApnaMart Admin Panel
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">

                    <div>
                        <label className="block font-semibold mb-2">
                            Admin Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold mb-2">
                            Password
                        </label>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                required
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
                    >
                        {loading ? "Logging in..." : "Login as Admin"}
                    </button>

                </form>

                <div className="text-center mt-6">
                    <button
                        onClick={() => navigate("/login")}
                        className="text-blue-600 font-semibold"
                    >
                        ← Customer Login
                    </button>
                </div>

            </div>

        </main>
    );
}

export default AdminLogin;