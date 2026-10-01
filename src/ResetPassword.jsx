import { useState } from "react";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            alert("Please enter both passwords.");
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
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                console.error("PASSWORD UPDATE ERROR:", error);
                alert(error.message);
                return;
            }

            alert("Password updated successfully! 🎉");
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
                    Reset Password 🔐
                </h1>

                <p className="text-gray-500 text-center mt-2">
                    Create your new password
                </p>

                <form
                    onSubmit={handleResetPassword}
                    className="mt-6"
                >

                    {/* New Password */}
                    <div className="relative mb-4">
                        <input
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            placeholder="New Password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                            className="w-full border px-4 py-3 pr-12 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                        />

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

                    {/* Confirm Password */}
                    <div className="relative mb-5">
                        <input
                            type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                            }
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            required
                            className="w-full border px-4 py-3 pr-12 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword(
                                    !showConfirmPassword
                                )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xl"
                        >
                            {showConfirmPassword
                                ? "🙈"
                                : "👁️"}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading
                            ? "Updating..."
                            : "Update Password"}
                    </button>

                </form>

                <p className="text-center mt-5">
                    <button
                        onClick={() => navigate("/login")}
                        className="text-green-600 font-semibold hover:underline"
                    >
                        Back to Login
                    </button>
                </p>

            </div>
        </main>
    );
}

export default ResetPassword;