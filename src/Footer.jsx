import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 mt-10 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-5 py-8 sm:py-10">

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">

                    {/* BRAND */}

                    <div className="col-span-2 sm:col-span-1">
                        <h3 className="text-white font-bold text-lg">
                            Apna Mart 🛒
                        </h3>
                        <p className="text-xs text-gray-400 mt-2">
                            Fresh groceries delivered to your doorstep, fast and reliable.
                        </p>

                        <div className="flex gap-3 mt-4">
                            <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </a>
                            <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* QUICK LINKS */}

                    <div>
                        <h4 className="text-white font-semibold text-sm mb-3">
                            Quick Links
                        </h4>
                        <div className="flex flex-col gap-2 text-xs">
                            <Link to="/" className="hover:text-green-500 transition">Home</Link>
                            <Link to="/products" className="hover:text-green-500 transition">Products</Link>
                            <Link to="/cart" className="hover:text-green-500 transition">Cart</Link>
                            <Link to="/my-orders" className="hover:text-green-500 transition">My Orders</Link>
                        </div>
                    </div>

                    {/* ACCOUNT */}

                    <div>
                        <h4 className="text-white font-semibold text-sm mb-3">
                            Account
                        </h4>
                        <div className="flex flex-col gap-2 text-xs">
                            <Link to="/login" className="hover:text-green-500 transition">Login</Link>
                            <Link to="/signup" className="hover:text-green-500 transition">Sign Up</Link>
                        </div>
                    </div>

                    {/* CONTACT */}

                    <div className="col-span-2 sm:col-span-1">
                        <h4 className="text-white font-semibold text-sm mb-3">
                            Contact Us
                        </h4>
                        <div className="flex flex-col gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                <span>+91 98765 43210</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                <span>support@apnamart.com</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span>Jamui, Bihar, India</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* BOTTOM BAR */}

                <div className="border-t border-gray-800 mt-8 pt-4 text-center">
                    <p className="text-xs text-gray-500">
                        © {new Date().getFullYear()} Apna Mart. All rights reserved.
                    </p>
                </div>

            </div>
        </footer>
    );
}

export default Footer;