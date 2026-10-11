import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const SETTING_KEY = "welcome_screen";

export default function WelcomeScreen() {
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let active = true;
        let timer;

        const loadWelcomeScreen = async () => {
            try {
                const { data, error } = await supabase
                    .from("site_settings")
                    .select("setting_value")
                    .eq("setting_key", SETTING_KEY)
                    .maybeSingle();

                if (error) throw error;

                const url = data?.setting_value?.image_url || "";

                if (!active) return;

                if (url) {
                    setImageUrl(url);
                    setVisible(true);

                    timer = setTimeout(() => {
                        if (active) setVisible(false);
                    }, 3500);
                }
            } catch (error) {
                console.error("WELCOME SCREEN LOAD ERROR:", error);
            } finally {
                if (active) setLoading(false);
            }
        };

        loadWelcomeScreen();

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, []);

    if (loading && !visible) return null;
    if (!visible || !imageUrl) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black">
            <img
                src={imageUrl}
                alt="Welcome to Apna Mart"
                onError={() => setVisible(false)}
                className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/20" />

            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-5 pb-10 pt-16 text-white">
                <h1 className="text-3xl font-black tracking-wide">
                    Apna Mart
                </h1>
                <p className="text-sm font-medium">
                    Aapki apni shopping destination
                </p>

                <button
                    onClick={() => setVisible(false)}
                    className="rounded-full bg-white px-7 py-3 text-sm font-black text-gray-900 shadow-lg transition hover:scale-105"
                >
                    Continue to Store →
                </button>
            </div>
        </div>
    );
}