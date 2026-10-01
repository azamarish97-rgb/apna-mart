import { Link } from "react-router-dom";

function OrderSuccess() {
    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8 text-center">

                <div className="text-7xl mb-5">
                    ✅
                </div>

                <h1 className="text-3xl font-bold text-gray-900">
                    Order Placed!
                </h1>

                <p className="text-gray-500 mt-3">
                    Thank you for shopping with Apna Mart.
                </p>

                <div className="bg-green-50 rounded-lg p-4 mt-6">
                    <p className="font-semibold text-green-700">
                        Order Status
                    </p>

                    <p className="text-gray-600 mt-1">
                        Pending
                    </p>
                </div>

                <Link
                    to="/products"
                    className="block mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                >
                    Continue Shopping 🛒
                </Link>

                <Link
                    to="/"
                    className="block mt-3 text-gray-500 hover:text-green-600"
                >
                    Go to Home
                </Link>

            </div>
        </main>
    );
}

export default OrderSuccess;