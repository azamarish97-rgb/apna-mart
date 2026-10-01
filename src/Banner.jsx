import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { supabase } from "./supabase";

function Banner() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const getBanners = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from("banners")
                .select("*")
                .eq("is_active", true)
                .order("sort_order", { ascending: true });

            if (error) {
                console.error("SUPABASE ERROR:", error);
                setLoading(false);
                return;
            }

            setBanners(data || []);
            setLoading(false);
        };

        getBanners();
    }, []);

    const handleClick = (link) => {
        if (link) {
            navigate(link);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-40 sm:h-56 md:h-72 bg-gray-100 rounded-2xl animate-pulse mx-auto max-w-7xl"></div>
        );
    }

    if (banners.length === 0) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-5 pt-4 sm:pt-6">

            <Swiper
                modules={[Autoplay, Pagination]}
                slidesPerView={1}
                loop={true}
                autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                }}
                pagination={{ clickable: true }}
                speed={700}
                className="rounded-2xl overflow-hidden shadow-sm"
            >
                {banners.map((banner) => (
                    <SwiperSlide key={banner.id}>
                        <div
                            onClick={() => handleClick(banner.link_url)}
                            className={`w-full h-40 sm:h-56 md:h-72 ${banner.link_url ? "cursor-pointer" : ""
                                }`}
                        >
                            <img
                                src={banner.image_url}
                                alt="Banner"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

        </div>
    );
}

export default Banner;