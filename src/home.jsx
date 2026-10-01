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
        <main className="bg-[var(--page-bg)] min-h-screen text-[var(--text-main)]">

            <Banner />

            <Categories />

            <OfferStrip />

            <DealsSection />

            <Banner />

            <NewArrivals />

            <Banner />

            {/* ALL PRODUCTS */}

            <AllProducts />

            <Banner />

            <WhyChooseUs />

            <Footer />

        </main>
    );
}

export default Home;