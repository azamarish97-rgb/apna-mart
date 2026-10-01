import Banner from "./Banner";
import Categories from "./Categories";
import OfferStrip from "./OfferStrip";
import DealsSection from "./DealsSection";
import NewArrivals from "./NewArrivals";
import AllProducts from "./AllProducts";
import WhyChooseUs from "./WhyChooseUs";
import Footer from "./Footer";

function Home() {
    return (
        <main className="bg-gray-50 min-h-screen">
            <Banner />

            <Categories />

            <OfferStrip />

            <DealsSection />

            <NewArrivals />

            {/* ALL PRODUCTS */}
            <AllProducts />

            <WhyChooseUs />

            <Footer />
        </main>
    );
}

export default Home;