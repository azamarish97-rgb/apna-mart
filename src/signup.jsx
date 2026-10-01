import { useState } from "react";
import { supabase } from "./supabase";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();

        if (loading) return;

        const cleanName = name.trim();
        const cleanMobile = mobile.trim();
        const cleanEmail = email.trim();

        if (!cleanName || !cleanMobile || !cleanEmail || !password || !confirmPassword) {
            alert("Please fill all fields.");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
            alert("Please enter a valid 10 digit mobile number.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            alert("Please enter a valid email address.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email: cleanEmail,
                password: password,

                options: {
                    data: {
                        full_name: cleanName,
                        mobile: cleanMobile,
                    },
                },
            });

            if (error) {
                console.error("SIGNUP ERROR:", error);

                if (
                    error.message.toLowerCase().includes("rate limit") ||
                    error.message.toLowerCase().includes("too many")
                ) {
                    alert("Too many attempts. Please try again later.");
                    return;
                }

                if (
                    error.message.toLowerCase().includes("already registered")
                ) {
                    alert("This email is already registered. Please login.");
                    navigate("/login");
                    return;
                }

                alert(error.message);
                return;
            }

            alert("Account created successfully! 🎉");
            navigate("/login");

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
                    Create Account
                </h1>

                <p className="text-gray-500 text-center mt-2">
                    Join Apna Mart today 🛒
                </p>

                <form onSubmit={handleSignup} className="mt-6">

                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border px-4 py-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <input
                        type="tel"
                        placeholder="Mobile Number"
                        value={mobile}
                        maxLength={10}
                        onChange={(e) =>
                            setMobile(e.target.value.replace(/\D/g, ""))
                        }
                        className="w-full border px-4 py-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border px-4 py-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border px-4 py-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border px-4 py-3 rounded-lg mb-5 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p className="text-center mt-5 text-gray-600">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-green-600 font-semibold hover:underline"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default Signup;