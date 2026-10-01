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

    // =====================================================
    // BANNER CLICK
    // =====================================================

    const handleClick = (link) => {
        if (!link) return;

        // External URL
        if (
            link.startsWith("http://") ||
            link.startsWith("https://")
        ) {
            window.open(
                link,
                "_blank",
                "noopener,noreferrer"
            );

            return;
        }

        // Internal React route
        navigate(link);
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div
                className="
                    w-full
                    h-40
                    sm:h-56
                    md:h-72
                    rounded-2xl
                    animate-pulse
                    mx-auto
                    max-w-7xl
                    bg-[var(--primary-light)]
                "
            />
        );
    }

    // =====================================================
    // NO BANNERS
    // =====================================================

    if (banners.length === 0) {
        return null;
    }

    // =====================================================
    // BANNER
    // =====================================================

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-5 pt-4 sm:pt-6">

            <Swiper
                modules={[Autoplay, Pagination]}
                slidesPerView={1}
                loop={banners.length > 1}
                autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                }}
                pagination={{
                    clickable: true,
                }}
                speed={700}
                className="rounded-2xl overflow-hidden shadow-sm"
            >
                {banners.map((banner) => (
                    <SwiperSlide key={banner.id}>

                        <div
                            onClick={() =>
                                handleClick(
                                    banner.link_url
                                )
                            }
                            className={`
                                w-full
                                h-40
                                sm:h-56
                                md:h-72
                                overflow-hidden
                                ${banner.link_url
                                    ? "cursor-pointer"
                                    : ""
                                }
                            `}
                        >

                            <img
                                src={banner.image_url}
                                alt="Apna Mart Banner"
                                className="
                                    w-full
                                    h-full
                                    object-cover
                                    block
                                "
                                loading="lazy"
                            />

                        </div>

                    </SwiperSlide>
                ))}
            </Swiper>

        </div>
    );
}

export default Banner;