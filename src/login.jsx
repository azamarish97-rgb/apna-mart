import { useState } from "react";
import { supabase } from "./supabase";
import { Link, useNavigate } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();


    const handleForgotPassword = async () => {
        const cleanEmail = email.trim();

        if (!cleanEmail) {
            alert("Please enter your email address first.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            alert("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(
                cleanEmail,
                {
                    redirectTo: `${window.location.origin}/reset-password`,
                }
            );

            if (error) {
                console.error("RESET PASSWORD ERROR:", error);
                alert("Unable to send reset link. Please try again.");
                return;
            }

            alert("Password reset link has been sent to your email 📧");
        } catch (error) {
            console.error(error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };




    const handleLogin = async (e) => {
        e.preventDefault();

        if (loading) return;

        const cleanEmail = email.trim();

        if (!cleanEmail || !password) {
            alert("Please enter email and password.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            alert("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            const { error } =
                await supabase.auth.signInWithPassword({
                    email: cleanEmail,
                    password: password,
                });

            if (error) {
                console.error("LOGIN ERROR:", error);

                if (
                    error.message.toLowerCase().includes("rate limit") ||
                    error.message.toLowerCase().includes("too many")
                ) {
                    alert("Too many login attempts. Please try again later.");
                    return;
                }

                alert("Invalid email or password.");
                return;
            }

            alert("Login successful! 🎉");
            navigate("/");

        } catch (error) {
            console.error(error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-5 py-10">
            <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg">

                <h1 className="text-3xl font-bold text-center">
                    Welcome Back 👋
                </h1>

                <p className="text-gray-500 text-center mt-2">
                    Login to Apna Mart 🛒
                </p>

                <form onSubmit={handleLogin} className="mt-6">

                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border px-4 py-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <div className="relative mb-4">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border px-4 py-3 pr-12 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                        />


                        <div className="text-right mb-4">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                disabled={loading}
                                className="text-green-600 font-semibold hover:underline text-sm"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        

                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword(!showPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xl"
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="text-center mt-5 text-gray-600">
                    Don't have an account?{" "}
                    <Link
                        to="/signup"
                        className="text-green-600 font-semibold hover:underline"
                    >
                        Sign Up
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default Login;