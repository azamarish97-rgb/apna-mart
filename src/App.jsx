import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Home from "./home";
import Products from "./products";
import ProductDetails from "./ProductDetails";
import Cart from "./cart";
import Login from "./login";
import Signup from "./signup";
import Navbar from "./navbar";
import OrderSuccess from "./ordersuccess";
import { CartProvider } from "./cartcontext";
import MyOrders from "./myorders";
import OrderDetails from "./OrderDetails";
import AdminOrders from "./AdminOrders";
import AdminLogin from "./AdminLogin";
import ResetPassword from "./ResetPassword";
import AdminDashboard from "./AdminDashboard";
import Search from "./Search";
import BottomNav from "./BottomNav";
import WelcomeScreen from "./WelcomeScreen";

function AppLayout() {
  const location = useLocation();

  const hideNavRoutes = ["/search"];

  const hideNav =
    hideNavRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/product/");

  return (
    <>
      {!hideNav && <Navbar />}

      <main className={!hideNav ? "pt-[250px] md:pt-[390px]" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/order/:id" element={<OrderDetails />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </main>

      {!hideNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppLayout />
        <WelcomeScreen />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;