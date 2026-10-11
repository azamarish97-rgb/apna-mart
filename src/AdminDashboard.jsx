import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { supabase } from "./supabase";

const MAX_BULK_DELETE = 50;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 25 * 1024 * 1024;

const emptyProduct = {
    name: "",
    price: "",
    offer_price: "",
    category: "",
    description: "",
    stock: "",
    weight: "",
    image_url: "",
    is_active: true,
};

const emptyBanner = {
    image_url: "",
    link_url: "",
    sort_order: 0,
    is_active: true,
};

function AdminDashboard() {
    const navigate = useNavigate();

    const fileInputRef = useRef(null);
    const bannerFileInputRef = useRef(null);
    const navbarFileInputRef = useRef(null);
    const welcomeFileInputRef = useRef(null);

    // PRODUCTS
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [productSearch, setProductSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [form, setForm] = useState({ ...emptyProduct });

    // BANNERS
    const [banners, setBanners] = useState([]);
    const [bannerLoading, setBannerLoading] = useState(false);
    const [bannerSaving, setBannerSaving] = useState(false);
    const [editingBannerId, setEditingBannerId] = useState(null);
    const [bannerForm, setBannerForm] = useState({ ...emptyBanner });
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState("");

    // NAVBAR BACKGROUND
    const [navbarMediaType, setNavbarMediaType] = useState("image");
    const [navbarMediaFile, setNavbarMediaFile] = useState(null);
    const [navbarMediaUrl, setNavbarMediaUrl] = useState("");
    const [navbarMediaPreview, setNavbarMediaPreview] = useState("");
    const [navbarMediaLoading, setNavbarMediaLoading] = useState(false);
    const [navbarMediaSaving, setNavbarMediaSaving] = useState(false);
    const [navbarMediaMessage, setNavbarMediaMessage] = useState("");

    // WELCOME SCREEN
    const [welcomeImageUrl, setWelcomeImageUrl] = useState("");
    const [welcomeFile, setWelcomeFile] = useState(null);
    const [welcomePreview, setWelcomePreview] = useState("");
    const [welcomeLoading, setWelcomeLoading] = useState(false);
    const [welcomeSaving, setWelcomeSaving] = useState(false);
    const [welcomeMessage, setWelcomeMessage] = useState("");

    // ADMIN CHECK
    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                navigate("/login");
                return;
            }

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (error || profile?.role !== "admin") {
                alert("Admin access required ❌");
                navigate("/");
                return;
            }

            await Promise.all([
                fetchProducts(),
                fetchBanners(),
                fetchNavbarMedia(),
                fetchWelcomeScreen(),
            ]);
        } catch (error) {
            console.error("ADMIN CHECK ERROR:", error);
            navigate("/");
        }
    };

    // =====================================================
    // PRODUCTS
    // =====================================================

    const fetchProducts = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("products")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            setProducts(data || []);

            const existingIds = new Set(
                (data || []).map((product) => String(product.id))
            );

            setSelectedProducts((previous) =>
                previous.filter((id) => existingIds.has(String(id)))
            );
        } catch (error) {
            console.error("PRODUCT FETCH ERROR:", error);
            alert(`Products load nahi hue ❌\n${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(
        () => [
            ...new Set(
                products
                    .map((product) => product.category?.trim())
                    .filter(Boolean)
            ),
        ].sort(),
        [products]
    );

    const filteredProducts = useMemo(() => {
        const search = productSearch.trim().toLowerCase();

        return products.filter((product) => {
            const matchesSearch =
                !search ||
                product.name?.toLowerCase().includes(search) ||
                product.category?.toLowerCase().includes(search) ||
                product.description?.toLowerCase().includes(search);

            const matchesCategory =
                categoryFilter === "all" ||
                product.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [products, productSearch, categoryFilter]);

    const handleProductChange = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const resetForm = () => {
        setForm({ ...emptyProduct });
        setEditingId(null);
    };

    const handleProductSubmit = async (event) => {
        event.preventDefault();

        if (!form.name.trim()) {
            alert("Product name required ❌");
            return;
        }

        if (
            form.price === "" ||
            !Number.isFinite(Number(form.price)) ||
            Number(form.price) < 0
        ) {
            alert("Valid price enter karo ❌");
            return;
        }

        if (
            form.offer_price !== "" &&
            (!Number.isFinite(Number(form.offer_price)) ||
                Number(form.offer_price) < 0)
        ) {
            alert("Valid offer price enter karo ❌");
            return;
        }

        if (
            form.stock === "" ||
            !Number.isFinite(Number(form.stock)) ||
            Number(form.stock) < 0
        ) {
            alert("Valid stock enter karo ❌");
            return;
        }

        try {
            setSaving(true);

            const productData = {
                name: form.name.trim(),
                price: Number(form.price),
                offer_price:
                    form.offer_price === ""
                        ? null
                        : Number(form.offer_price),
                category: form.category.trim() || null,
                description: form.description.trim() || null,
                stock: Number(form.stock),
                weight: form.weight.trim() || null,
                image_url: form.image_url.trim() || null,
                is_active: form.is_active,
                updated_at: new Date().toISOString(),
            };

            const result = editingId
                ? await supabase
                    .from("products")
                    .update(productData)
                    .eq("id", editingId)
                : await supabase
                    .from("products")
                    .insert([productData]);

            if (result.error) throw result.error;

            alert(
                editingId
                    ? "Product updated successfully ✅"
                    : "Product added successfully ✅"
            );

            resetForm();
            await fetchProducts();
        } catch (error) {
            console.error("PRODUCT SAVE ERROR:", error);
            alert(`Product save nahi hua ❌\n${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product) => {
        setEditingId(product.id);

        setForm({
            name: product.name || "",
            price: product.price ?? "",
            offer_price: product.offer_price ?? "",
            category: product.category || "",
            description: product.description || "",
            stock: product.stock ?? "",
            weight: product.weight || "",
            image_url: product.image_url || "",
            is_active: product.is_active ?? true,
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleToggleActive = async (product) => {
        try {
            const { error } = await supabase
                .from("products")
                .update({
                    is_active: !product.is_active,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", product.id);

            if (error) throw error;

            await fetchProducts();
        } catch (error) {
            alert(`Status change nahi hua ❌\n${error.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Ye product permanently delete karna hai?")) {
            return;
        }

        try {
            setSaving(true);

            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setSelectedProducts((previous) =>
                previous.filter((item) => String(item) !== String(id))
            );

            if (String(editingId) === String(id)) {
                resetForm();
            }

            await fetchProducts();
            alert("Product deleted successfully 🗑️");
        } catch (error) {
            alert(`Product delete nahi hua ❌\n${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSelectProduct = (id) => {
        setSelectedProducts((previous) => {
            const exists = previous.some(
                (item) => String(item) === String(id)
            );

            if (exists) {
                return previous.filter(
                    (item) => String(item) !== String(id)
                );
            }

            if (previous.length >= MAX_BULK_DELETE) {
                alert("Ek baar mein maximum 50 products select kar sakte ho.");
                return previous;
            }

            return [...previous, id];
        });
    };

    const handleSelectAllProducts = () => {
        const visibleIds = filteredProducts.map((product) => product.id);

        const allSelected =
            visibleIds.length > 0 &&
            visibleIds.every((id) =>
                selectedProducts.some(
                    (selected) => String(selected) === String(id)
                )
            );

        if (allSelected) {
            setSelectedProducts((previous) =>
                previous.filter(
                    (id) =>
                        !visibleIds.some(
                            (visible) => String(visible) === String(id)
                        )
                )
            );
            return;
        }

        const remainingSlots =
            MAX_BULK_DELETE - selectedProducts.length;

        if (remainingSlots <= 0) {
            alert("Maximum 50 products already selected.");
            return;
        }

        const unselected = visibleIds.filter(
            (id) =>
                !selectedProducts.some(
                    (selected) => String(selected) === String(id)
                )
        );

        const additions = unselected.slice(0, remainingSlots);

        setSelectedProducts((previous) => [...previous, ...additions]);

        if (additions.length < unselected.length) {
            alert("Maximum 50 products hi select ho sakte hain.");
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedProducts.length) {
            alert("Pehle products select karo.");
            return;
        }

        if (selectedProducts.length > MAX_BULK_DELETE) {
            alert("Maximum 50 products hi delete kar sakte ho.");
            return;
        }

        if (
            !window.confirm(
                `${selectedProducts.length} products permanently delete karne hain?`
            )
        ) {
            return;
        }

        try {
            setSaving(true);

            const { error } = await supabase
                .from("products")
                .delete()
                .in("id", selectedProducts);

            if (error) throw error;

            const count = selectedProducts.length;

            if (
                selectedProducts.some(
                    (id) => String(id) === String(editingId)
                )
            ) {
                resetForm();
            }

            setSelectedProducts([]);
            await fetchProducts();

            alert(`${count} products deleted successfully 🗑️`);
        } catch (error) {
            alert(`Bulk delete fail hua ❌\n${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // CSV BULK UPLOAD
    // =====================================================

    const handleCSVUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setBulkUploading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,

            complete: async (results) => {
                try {
                    const rows = (results.data || [])
                        .map((row) => {
                            const name = row.name?.trim();
                            if (!name) return null;

                            const price = Number(row.price);

                            const offerPrice =
                                row.offer_price === "" ||
                                    row.offer_price == null
                                    ? null
                                    : Number(row.offer_price);

                            const stock =
                                row.stock === "" || row.stock == null
                                    ? 0
                                    : Number(row.stock);

                            return {
                                name,
                                price:
                                    Number.isFinite(price) && price >= 0
                                        ? price
                                        : 0,
                                offer_price:
                                    offerPrice !== null &&
                                        Number.isFinite(offerPrice) &&
                                        offerPrice >= 0
                                        ? offerPrice
                                        : null,
                                category: row.category?.trim() || null,
                                description:
                                    row.description?.trim() || null,
                                stock:
                                    Number.isFinite(stock) && stock >= 0
                                        ? stock
                                        : 0,
                                weight: row.weight?.trim() || null,
                                image_url: row.image_url?.trim() || null,
                                is_active:
                                    String(row.is_active ?? "true")
                                        .toLowerCase() !== "false",
                            };
                        })
                        .filter(Boolean);

                    if (!rows.length) {
                        alert("CSV mein valid products nahi mile.");
                        return;
                    }

                    const { error } = await supabase
                        .from("products")
                        .insert(rows);

                    if (error) throw error;

                    alert(`${rows.length} products uploaded successfully ✅`);
                    await fetchProducts();
                } catch (error) {
                    alert(`CSV upload fail hua ❌\n${error.message}`);
                } finally {
                    setBulkUploading(false);

                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                }
            },

            error: (error) => {
                alert(`CSV read nahi hua ❌\n${error.message}`);
                setBulkUploading(false);

                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            },
        });
    };

    // =====================================================
    // BANNERS
    // =====================================================

    const fetchBanners = async () => {
        try {
            setBannerLoading(true);

            const { data, error } = await supabase
                .from("banners")
                .select("*")
                .order("sort_order", { ascending: true })
                .order("created_at", { ascending: false });

            if (error) throw error;

            setBanners(data || []);
        } catch (error) {
            console.error("BANNER FETCH ERROR:", error);
            alert(`Banners load nahi hue ❌\n${error.message}`);
        } finally {
            setBannerLoading(false);
        }
    };

    const handleBannerChange = (event) => {
        const { name, value, type, checked } = event.target;

        setBannerForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleBannerFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            setBannerFile(null);
            setBannerPreview("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Sirf image file select karo.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            alert("Banner image 5MB se chhoti honi chahiye.");
            event.target.value = "";
            return;
        }

        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
    };

    const uploadBannerImage = async (file) => {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const name = `banner-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 9)}.${ext}`;

        const { error } = await supabase.storage
            .from("banners")
            .upload(name, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type,
            });

        if (error) throw error;

        return supabase.storage.from("banners").getPublicUrl(name)
            .data.publicUrl;
    };

    const resetBannerForm = () => {
        setBannerForm({ ...emptyBanner });
        setBannerFile(null);
        setBannerPreview("");
        setEditingBannerId(null);

        if (bannerFileInputRef.current) {
            bannerFileInputRef.current.value = "";
        }
    };

    const handleBannerSubmit = async (event) => {
        event.preventDefault();

        if (!bannerFile && !bannerForm.image_url.trim()) {
            alert("Banner image select karo ya Image URL enter karo.");
            return;
        }

        try {
            setBannerSaving(true);

            const imageUrl = bannerFile
                ? await uploadBannerImage(bannerFile)
                : bannerForm.image_url.trim();

            const bannerData = {
                image_url: imageUrl,
                link_url: bannerForm.link_url.trim() || null,
                sort_order: Number(bannerForm.sort_order) || 0,
                is_active: bannerForm.is_active,
                updated_at: new Date().toISOString(),
            };

            const result = editingBannerId
                ? await supabase
                    .from("banners")
                    .update(bannerData)
                    .eq("id", editingBannerId)
                : await supabase
                    .from("banners")
                    .insert([bannerData]);

            if (result.error) throw result.error;

            alert(
                editingBannerId
                    ? "Banner updated successfully ✅"
                    : "Banner added successfully ✅"
            );

            resetBannerForm();
            await fetchBanners();
        } catch (error) {
            alert(`Banner save nahi hua ❌\n${error.message}`);
        } finally {
            setBannerSaving(false);
        }
    };

    const handleEditBanner = (banner) => {
        setEditingBannerId(banner.id);

        setBannerForm({
            image_url: banner.image_url || "",
            link_url: banner.link_url || "",
            sort_order: banner.sort_order ?? 0,
            is_active: banner.is_active ?? true,
        });

        setBannerFile(null);
        setBannerPreview("");

        if (bannerFileInputRef.current) {
            bannerFileInputRef.current.value = "";
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteBanner = async (id) => {
        if (!window.confirm("Ye banner permanently delete karna hai?")) {
            return;
        }

        try {
            const { error } = await supabase
                .from("banners")
                .delete()
                .eq("id", id);

            if (error) throw error;

            if (String(editingBannerId) === String(id)) {
                resetBannerForm();
            }

            await fetchBanners();
            alert("Banner deleted successfully 🗑️");
        } catch (error) {
            alert(`Banner delete nahi hua ❌\n${error.message}`);
        }
    };

    const handleToggleBanner = async (banner) => {
        try {
            const { error } = await supabase
                .from("banners")
                .update({
                    is_active: !banner.is_active,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", banner.id);

            if (error) throw error;

            await fetchBanners();
        } catch (error) {
            alert(`Banner status change nahi hua ❌\n${error.message}`);
        }
    };

    // =====================================================
    // NAVBAR BACKGROUND
    // =====================================================

    const fetchNavbarMedia = async () => {
        try {
            setNavbarMediaLoading(true);

            const { data, error } = await supabase
                .from("site_settings")
                .select("setting_value")
                .eq("setting_key", "navbar_background")
                .maybeSingle();

            if (error) throw error;

            const value = data?.setting_value || {};

            setNavbarMediaType(
                value.media_type === "video" ? "video" : "image"
            );
            setNavbarMediaUrl(value.media_url || "");
            setNavbarMediaFile(null);
            setNavbarMediaPreview("");
        } catch (error) {
            console.error("NAVBAR MEDIA FETCH ERROR:", error);
            setNavbarMediaMessage(
                `Background setting load nahi hui: ${error.message}`
            );
        } finally {
            setNavbarMediaLoading(false);
        }
    };

    const handleNavbarMediaChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if (!isImage && !isVideo) {
            alert("Image, GIF ya video file select karo.");
            event.target.value = "";
            return;
        }

        if (
            isVideo &&
            !["video/mp4", "video/webm", "video/ogg"].includes(file.type)
        ) {
            alert("Video format MP4, WEBM ya OGG hona chahiye.");
            event.target.value = "";
            return;
        }

        if (isImage && file.size > MAX_IMAGE_SIZE) {
            alert("Image/GIF maximum 5MB hona chahiye.");
            event.target.value = "";
            return;
        }

        if (isVideo && file.size > MAX_VIDEO_SIZE) {
            alert("Video maximum 25MB hona chahiye.");
            event.target.value = "";
            return;
        }

        setNavbarMediaType(isVideo ? "video" : "image");
        setNavbarMediaFile(file);
        setNavbarMediaPreview(URL.createObjectURL(file));
        setNavbarMediaMessage("");
    };

    const handleSaveNavbarMedia = async () => {
        if (!navbarMediaFile && !navbarMediaUrl.trim()) {
            alert("Pehle background image, GIF ya video select karo.");
            return;
        }

        try {
            setNavbarMediaSaving(true);
            setNavbarMediaMessage("");

            let finalUrl = navbarMediaUrl.trim();

            if (navbarMediaFile) {
                const file = navbarMediaFile;
                const extension =
                    file.name.split(".").pop()?.toLowerCase() ||
                    (navbarMediaType === "video" ? "mp4" : "jpg");

                const filePath =
                    `navbar-background/${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2, 9)}.${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from("site-images")
                    .upload(filePath, file, {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: file.type,
                    });

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage
                    .from("site-images")
                    .getPublicUrl(filePath);

                finalUrl = publicData.publicUrl;
            }

            const { error } = await supabase
                .from("site_settings")
                .upsert(
                    {
                        setting_key: "navbar_background",
                        setting_value: {
                            media_type: navbarMediaType,
                            media_url: finalUrl,
                        },
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "setting_key" }
                );

            if (error) throw error;

            setNavbarMediaUrl(finalUrl);
            setNavbarMediaFile(null);
            setNavbarMediaPreview("");

            if (navbarFileInputRef.current) {
                navbarFileInputRef.current.value = "";
            }

            setNavbarMediaMessage(
                "Navbar background successfully save ho gaya ✅"
            );
        } catch (error) {
            console.error("NAVBAR MEDIA SAVE ERROR:", error);
            setNavbarMediaMessage(`Save nahi hua ❌ ${error.message}`);
        } finally {
            setNavbarMediaSaving(false);
        }
    };

    const handleRemoveNavbarMedia = async () => {
        if (!window.confirm("Navbar background remove karna hai?")) {
            return;
        }

        try {
            setNavbarMediaSaving(true);
            setNavbarMediaMessage("");

            const { error } = await supabase
                .from("site_settings")
                .upsert(
                    {
                        setting_key: "navbar_background",
                        setting_value: {
                            media_type: "none",
                            media_url: "",
                        },
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "setting_key" }
                );

            if (error) throw error;

            setNavbarMediaUrl("");
            setNavbarMediaFile(null);
            setNavbarMediaPreview("");
            setNavbarMediaType("image");

            if (navbarFileInputRef.current) {
                navbarFileInputRef.current.value = "";
            }

            setNavbarMediaMessage("Navbar background remove ho gaya ✅");
        } catch (error) {
            setNavbarMediaMessage(`Remove nahi hua ❌ ${error.message}`);
        } finally {
            setNavbarMediaSaving(false);
        }
    };

    // =====================================================
    // WELCOME SCREEN
    // =====================================================

    const fetchWelcomeScreen = async () => {
        try {
            setWelcomeLoading(true);
            setWelcomeMessage("");

            const { data, error } = await supabase
                .from("site_settings")
                .select("setting_value")
                .eq("setting_key", "welcome_screen")
                .maybeSingle();

            if (error) throw error;

            setWelcomeImageUrl(data?.setting_value?.image_url || "");
            setWelcomeFile(null);
            setWelcomePreview("");
        } catch (error) {
            console.error("WELCOME SCREEN FETCH ERROR:", error);
            setWelcomeMessage(`Photo load nahi hui: ${error.message}`);
        } finally {
            setWelcomeLoading(false);
        }
    };

    const handleWelcomeFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Sirf image ya GIF select karo.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            alert("Welcome photo maximum 5MB honi chahiye.");
            event.target.value = "";
            return;
        }

        setWelcomeFile(file);
        setWelcomePreview(URL.createObjectURL(file));
        setWelcomeMessage("");
    };

    const handleSaveWelcomeScreen = async () => {
        if (!welcomeFile && !welcomeImageUrl.trim()) {
            alert("Pehle welcome photo upload karo ya image URL enter karo.");
            return;
        }

        try {
            setWelcomeSaving(true);
            setWelcomeMessage("");

            let finalUrl = welcomeImageUrl.trim();

            if (welcomeFile) {
                const file = welcomeFile;
                const extension =
                    file.name.split(".").pop()?.toLowerCase() || "jpg";

                const filePath =
                    `welcome-screen/${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2, 9)}.${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from("site-images")
                    .upload(filePath, file, {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: file.type,
                    });

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage
                    .from("site-images")
                    .getPublicUrl(filePath);

                finalUrl = publicData.publicUrl;
            }

            const { error } = await supabase
                .from("site_settings")
                .upsert(
                    {
                        setting_key: "welcome_screen",
                        setting_value: {
                            image_url: finalUrl,
                        },
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "setting_key" }
                );

            if (error) throw error;

            setWelcomeImageUrl(finalUrl);
            setWelcomeFile(null);
            setWelcomePreview("");

            if (welcomeFileInputRef.current) {
                welcomeFileInputRef.current.value = "";
            }

            setWelcomeMessage("Welcome photo successfully save ho gayi ✅");
        } catch (error) {
            console.error("WELCOME SCREEN SAVE ERROR:", error);
            setWelcomeMessage(`Save nahi hua ❌ ${error.message}`);
        } finally {
            setWelcomeSaving(false);
        }
    };

    const handleRemoveWelcomeScreen = async () => {
        if (!window.confirm("Welcome screen photo remove karni hai?")) {
            return;
        }

        try {
            setWelcomeSaving(true);
            setWelcomeMessage("");

            const { error } = await supabase
                .from("site_settings")
                .upsert(
                    {
                        setting_key: "welcome_screen",
                        setting_value: { image_url: "" },
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "setting_key" }
                );

            if (error) throw error;

            setWelcomeImageUrl("");
            setWelcomeFile(null);
            setWelcomePreview("");

            if (welcomeFileInputRef.current) {
                welcomeFileInputRef.current.value = "";
            }

            setWelcomeMessage("Welcome photo remove ho gayi ✅");
        } catch (error) {
            console.error("WELCOME SCREEN REMOVE ERROR:", error);
            setWelcomeMessage(`Remove nahi hui ❌ ${error.message}`);
        } finally {
            setWelcomeSaving(false);
        }
    };

    // =====================================================
    // STATS
    // =====================================================

    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.is_active).length;
    const outOfStock = products.filter((p) => Number(p.stock) <= 0).length;
    const activeBanners = banners.filter((b) => b.is_active).length;

    const mediaPreview = navbarMediaPreview || navbarMediaUrl;
    const currentWelcomePreview = welcomePreview || welcomeImageUrl;

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900">
            <header className="sticky top-0 z-40 border-b bg-white">
                <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-xl font-black">Apna Mart Admin</h1>
                        <p className="text-xs text-gray-500">
                            Products, banners and store management
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => navigate("/admin/orders")}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                        >
                            📦 Orders
                        </button>

                        <button
                            onClick={() => navigate("/")}
                            className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-bold text-white hover:bg-gray-900"
                        >
                            🏪 View Store
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1800px] space-y-4 px-3 py-4 sm:px-4">
                {/* STATS */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                        ["Total Products", totalProducts, "text-gray-900"],
                        ["Active Products", activeProducts, "text-green-600"],
                        ["Out of Stock", outOfStock, "text-red-600"],
                        ["Active Banners", activeBanners, "text-blue-600"],
                    ].map(([label, value, color]) => (
                        <div
                            key={label}
                            className="rounded-xl border bg-white p-4"
                        >
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className={`text-2xl font-black ${color}`}>
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* WELCOME SCREEN MANAGER */}
                <section className="overflow-hidden rounded-xl border bg-white">
                    <div className="border-b px-4 py-3">
                        <h2 className="font-black">
                            🌟 Welcome Screen Manager
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                            App open hone par dikhne wali welcome photo manage karo.
                        </p>
                    </div>

                    <div className="grid gap-5 p-4 lg:grid-cols-2">
                        <div className="space-y-3">
                            <div>
                                <label className="admin-label">
                                    Upload Welcome Photo / GIF
                                </label>
                                <input
                                    ref={welcomeFileInputRef}
                                    type="file"
                                    accept="image/*,.gif"
                                    onChange={handleWelcomeFileChange}
                                    className="block w-full rounded-lg border border-gray-300 p-3 text-xs"
                                />
                                <p className="mt-1 text-[11px] text-gray-500">
                                    JPG, PNG, WEBP ya GIF — maximum 5MB.
                                </p>
                            </div>

                            <div>
                                <label className="admin-label">
                                    Public Image URL
                                </label>
                                <input
                                    type="url"
                                    value={welcomeImageUrl}
                                    onChange={(event) => {
                                        setWelcomeImageUrl(event.target.value);
                                        setWelcomeFile(null);
                                        setWelcomePreview("");

                                        if (welcomeFileInputRef.current) {
                                            welcomeFileInputRef.current.value = "";
                                        }
                                    }}
                                    placeholder="https://example.com/welcome.jpg"
                                    className="admin-input"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleSaveWelcomeScreen}
                                    disabled={welcomeSaving || welcomeLoading}
                                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {welcomeSaving ? "Saving..." : "💾 Save Welcome Photo"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRemoveWelcomeScreen}
                                    disabled={
                                        welcomeSaving ||
                                        (!welcomeImageUrl && !welcomeFile && !welcomePreview)
                                    }
                                    className="rounded-lg bg-red-100 px-4 py-2.5 text-xs font-black text-red-700 hover:bg-red-200 disabled:opacity-50"
                                >
                                    Remove Photo
                                </button>

                                <button
                                    type="button"
                                    onClick={fetchWelcomeScreen}
                                    disabled={welcomeLoading || welcomeSaving}
                                    className="rounded-lg bg-gray-100 px-4 py-2.5 text-xs font-bold hover:bg-gray-200 disabled:opacity-50"
                                >
                                    {welcomeLoading ? "Loading..." : "↻ Refresh"}
                                </button>
                            </div>

                            {welcomeMessage && (
                                <p className="break-words rounded-lg bg-gray-50 p-3 text-xs">
                                    {welcomeMessage}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="mb-2 text-xs font-black text-gray-700">
                                Welcome Screen Preview
                            </p>
                            <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl border bg-gray-900">
                                {currentWelcomePreview ? (
                                    <img
                                        src={currentWelcomePreview}
                                        alt="Welcome screen preview"
                                        className="h-64 w-full object-cover"
                                    />
                                ) : (
                                    <div className="p-8 text-center text-sm text-white">
                                        <div className="mb-2 text-3xl">🖼️</div>
                                        Abhi welcome photo set nahi hai.
                                    </div>
                                )}
                            </div>
                            <p className="mt-2 text-[11px] text-gray-500">
                                Photo select karo, preview dekho aur Save dabao.
                            </p>
                        </div>
                    </div>
                </section>

                {/* NAVBAR BACKGROUND MANAGER */}
                <section className="overflow-hidden rounded-xl border bg-white">
                    <div className="border-b px-4 py-3">
                        <h2 className="font-black">🎨 Navbar Background Manager</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Store ke Navbar ke liye image, GIF ya video select karo.
                        </p>
                    </div>

                    <div className="grid gap-5 p-4 lg:grid-cols-2">
                        <div className="space-y-3">
                            <label className="admin-label">Background Type</label>
                            <select
                                value={navbarMediaType}
                                onChange={(event) => {
                                    setNavbarMediaType(event.target.value);
                                    setNavbarMediaFile(null);
                                    setNavbarMediaPreview("");

                                    if (navbarFileInputRef.current) {
                                        navbarFileInputRef.current.value = "";
                                    }
                                }}
                                className="admin-input"
                            >
                                <option value="image">Image / GIF</option>
                                <option value="video">Video</option>
                            </select>

                            <label className="admin-label">
                                Upload {navbarMediaType === "video" ? "Video" : "Image / GIF"}
                            </label>

                            <input
                                ref={navbarFileInputRef}
                                type="file"
                                accept={
                                    navbarMediaType === "video"
                                        ? "video/mp4,video/webm,video/ogg"
                                        : "image/*,.gif"
                                }
                                onChange={handleNavbarMediaChange}
                                className="block w-full rounded-lg border border-gray-300 p-3 text-xs"
                            />

                            <p className="text-[11px] text-gray-500">
                                {navbarMediaType === "video"
                                    ? "MP4, WEBM or OGG • Maximum 25MB"
                                    : "JPG, PNG, WEBP or GIF • Maximum 5MB"}
                            </p>

                            <div>
                                <label className="admin-label">
                                    Optional: Existing Public Media URL
                                </label>
                                <input
                                    type="url"
                                    value={navbarMediaUrl}
                                    onChange={(event) => {
                                        setNavbarMediaUrl(event.target.value);
                                        setNavbarMediaFile(null);
                                        setNavbarMediaPreview("");
                                    }}
                                    placeholder="https://..."
                                    className="admin-input"
                                />
                                <p className="mt-1 text-[10px] text-gray-500">
                                    URL enter karne par selected file ki jagah URL save hoga.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleSaveNavbarMedia}
                                    disabled={navbarMediaSaving || navbarMediaLoading}
                                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {navbarMediaSaving ? "Saving..." : "💾 Save Navbar Background"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRemoveNavbarMedia}
                                    disabled={
                                        navbarMediaSaving ||
                                        (!navbarMediaUrl && !navbarMediaFile && !navbarMediaPreview)
                                    }
                                    className="rounded-lg bg-red-100 px-4 py-2.5 text-xs font-black text-red-700 hover:bg-red-200 disabled:opacity-50"
                                >
                                    Remove Background
                                </button>

                                <button
                                    type="button"
                                    onClick={fetchNavbarMedia}
                                    disabled={navbarMediaLoading}
                                    className="rounded-lg bg-gray-100 px-4 py-2.5 text-xs font-bold hover:bg-gray-200 disabled:opacity-50"
                                >
                                    {navbarMediaLoading ? "Loading..." : "↻ Reload"}
                                </button>
                            </div>

                            {navbarMediaMessage && (
                                <p className="break-words rounded-lg bg-gray-50 p-3 text-xs">
                                    {navbarMediaMessage}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="mb-2 text-xs font-black text-gray-700">
                                Background Preview
                            </p>
                            <div className="relative flex min-h-40 items-center justify-center overflow-hidden rounded-xl border bg-gray-900">
                                {mediaPreview && navbarMediaType === "video" ? (
                                    <video
                                        key={mediaPreview}
                                        src={mediaPreview}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="h-48 w-full object-cover"
                                    />
                                ) : mediaPreview ? (
                                    <img
                                        src={mediaPreview}
                                        alt="Navbar background preview"
                                        className="h-48 w-full object-cover"
                                    />
                                ) : (
                                    <div className="p-8 text-center text-sm text-white">
                                        <div className="mb-2 text-3xl">🖼️</div>
                                        No background selected
                                    </div>
                                )}

                                {mediaPreview && (
                                    <div className="absolute inset-x-0 bottom-0 bg-black/50 p-3 text-sm font-bold text-white">
                                        Apna Mart Navbar Preview
                                    </div>
                                )}
                            </div>
                            <p className="mt-2 text-[11px] text-gray-500">
                                Navbar par apply karne ke liye Navbar.jsx mein saved setting load karna bhi zaroori hai.
                            </p>
                        </div>
                    </div>
                </section>

                {/* PRODUCT FORM */}
                <section className="rounded-xl border bg-white">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div>
                            <h2 className="text-sm font-black">
                                {editingId ? "✏️ Edit Product" : "➕ Add Product"}
                            </h2>
                            <p className="text-xs text-gray-500">Product information</p>
                        </div>

                        {editingId && (
                            <button
                                onClick={resetForm}
                                className="text-xs font-bold text-red-600"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    <form
                        onSubmit={handleProductSubmit}
                        className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        <Field label="Product Name *">
                            <input name="name" value={form.name} onChange={handleProductChange} required className="admin-input" placeholder="Product name" />
                        </Field>
                        <Field label="Price *">
                            <input name="price" type="number" min="0" step="any" value={form.price} onChange={handleProductChange} required className="admin-input" placeholder="₹" />
                        </Field>
                        <Field label="Offer Price">
                            <input name="offer_price" type="number" min="0" step="any" value={form.offer_price} onChange={handleProductChange} className="admin-input" placeholder="₹" />
                        </Field>
                        <Field label="Category">
                            <input name="category" value={form.category} onChange={handleProductChange} className="admin-input" list="product-categories" placeholder="Category" />
                            <datalist id="product-categories">
                                {categories.map((category) => (
                                    <option key={category} value={category} />
                                ))}
                            </datalist>
                        </Field>
                        <Field label="Stock *">
                            <input name="stock" type="number" min="0" value={form.stock} onChange={handleProductChange} required className="admin-input" placeholder="0" />
                        </Field>
                        <Field label="Weight">
                            <input name="weight" value={form.weight} onChange={handleProductChange} className="admin-input" placeholder="1 kg" />
                        </Field>
                        <Field label="Image URL">
                            <input name="image_url" value={form.image_url} onChange={handleProductChange} className="admin-input" placeholder="https://..." />
                        </Field>
                        <Field label="Description">
                            <input name="description" value={form.description} onChange={handleProductChange} className="admin-input" placeholder="Short description" />
                        </Field>

                        <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold">
                            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleProductChange} />
                            Active product
                        </label>

                        <div className="flex flex-wrap items-end gap-2">
                            <button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">
                                {saving ? "Saving..." : editingId ? "Update Product" : "Add Product"}
                            </button>
                            {editingId && (
                                <button type="button" onClick={resetForm} className="rounded-lg bg-gray-100 px-4 py-2.5 text-xs font-bold">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {/* CSV UPLOAD */}
                <section className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-sm font-black">📄 Bulk CSV Upload</h2>
                        <p className="mt-1 text-[11px] text-gray-500">
                            Columns: name, price, offer_price, category, description, stock, weight, image_url, is_active
                        </p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleCSVUpload}
                        className="block max-w-full text-xs"
                    />
                    {bulkUploading && (
                        <span className="text-xs font-bold">Uploading CSV...</span>
                    )}
                </section>

                {/* BANNER MANAGEMENT */}
                <section className="overflow-hidden rounded-xl border bg-white">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-black">🖼️ Banner Management</h2>
                        <p className="text-xs text-gray-500">Gallery image or Image URL</p>
                    </div>

                    <form onSubmit={handleBannerSubmit} className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Field label="Upload Banner Image">
                            <input ref={bannerFileInputRef} type="file" accept="image/*" onChange={handleBannerFileChange} className="block w-full text-xs" />
                            <p className="mt-1 text-[10px] text-gray-500">Maximum 5MB</p>
                        </Field>

                        <Field label="Image URL">
                            <input name="image_url" value={bannerForm.image_url} onChange={handleBannerChange} className="admin-input" placeholder="https://..." />
                        </Field>

                        <Field label="Banner Link">
                            <input name="link_url" value={bannerForm.link_url} onChange={handleBannerChange} className="admin-input" placeholder="/products..." />
                        </Field>

                        <Field label="Sort Order">
                            <input name="sort_order" type="number" value={bannerForm.sort_order} onChange={handleBannerChange} className="admin-input" />
                        </Field>

                        <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold">
                            <input type="checkbox" name="is_active" checked={bannerForm.is_active} onChange={handleBannerChange} />
                            Active banner
                        </label>

                        {(bannerPreview || bannerForm.image_url) && (
                            <div className="sm:col-span-2 lg:col-span-3">
                                <img src={bannerPreview || bannerForm.image_url} alt="Banner preview" className="h-36 w-full rounded-lg border object-cover" />
                            </div>
                        )}

                        <div className="flex flex-wrap items-end gap-2">
                            <button disabled={bannerSaving} className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">
                                {bannerSaving ? "Saving..." : editingBannerId ? "Update Banner" : "Add Banner"}
                            </button>
                            {editingBannerId && (
                                <button type="button" onClick={resetBannerForm} className="rounded-lg bg-gray-100 px-4 py-2.5 text-xs font-bold">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="border-t p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-xs font-black">Existing Banners</h3>
                            <button onClick={fetchBanners} className="text-xs font-bold text-blue-600">Refresh</button>
                        </div>

                        {bannerLoading ? (
                            <p className="py-6 text-center text-xs text-gray-500">Loading banners...</p>
                        ) : banners.length === 0 ? (
                            <p className="rounded-lg border border-dashed p-6 text-center text-xs text-gray-500">No banners added yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {banners.map((banner) => (
                                    <article key={banner.id} className="overflow-hidden rounded-xl border bg-gray-50">
                                        <div className="relative h-32">
                                            <img src={banner.image_url} alt="Banner" className="h-full w-full object-cover" />
                                            <span className={`absolute right-2 top-2 rounded px-2 py-1 text-[9px] font-black text-white ${banner.is_active ? "bg-green-600" : "bg-gray-700"}`}>
                                                {banner.is_active ? "ACTIVE" : "OFF"}
                                            </span>
                                        </div>
                                        <div className="p-3">
                                            <p className="mb-2 text-xs text-gray-500">Order: {banner.sort_order}</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button onClick={() => handleEditBanner(banner)} className="rounded bg-blue-100 py-2 text-[10px] font-bold text-blue-700">Edit</button>
                                                <button onClick={() => handleToggleBanner(banner)} className="rounded bg-yellow-100 py-2 text-[10px] font-bold text-yellow-800">{banner.is_active ? "Off" : "On"}</button>
                                                <button onClick={() => handleDeleteBanner(banner.id)} className="rounded bg-red-100 py-2 text-[10px] font-bold text-red-700">Delete</button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ALL PRODUCTS */}
                <section className="overflow-hidden rounded-xl border bg-white">
                    <div className="space-y-3 border-b p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-sm font-black">All Products</h2>
                                <p className="text-[11px] text-gray-500">
                                    Showing {filteredProducts.length} / {products.length}
                                </p>
                            </div>
                            <button onClick={fetchProducts} disabled={loading} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold">
                                ↻ Refresh
                            </button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products..." className="admin-input" />
                            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="admin-input">
                                <option value="all">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <button onClick={handleSelectAllProducts} disabled={!filteredProducts.length} className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
                                ☑ Select visible (max 50)
                            </button>
                            <button onClick={handleBulkDelete} disabled={!selectedProducts.length || saving} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
                                🗑 Delete selected ({selectedProducts.length})
                            </button>
                        </div>

                        {selectedProducts.length > 0 && (
                            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                                <span className="text-xs font-bold text-red-700">{selectedProducts.length}/50 selected</span>
                                <button onClick={() => setSelectedProducts([])} className="text-xs font-bold text-red-700">Clear selection</button>
                            </div>
                        )}
                    </div>

                    <div className="p-3">
                        {loading ? (
                            <p className="py-10 text-center text-xs text-gray-500">Loading products...</p>
                        ) : filteredProducts.length === 0 ? (
                            <p className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-500">No products found.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                                {filteredProducts.map((product) => {
                                    const isSelected = selectedProducts.some(
                                        (id) => String(id) === String(product.id)
                                    );

                                    const hasOffer =
                                        product.offer_price !== null &&
                                        product.offer_price !== undefined &&
                                        product.offer_price !== "" &&
                                        Number(product.offer_price) < Number(product.price);

                                    const displayPrice = hasOffer
                                        ? product.offer_price
                                        : product.price;

                                    return (
                                        <article key={product.id} className={`relative overflow-hidden rounded-xl border bg-white ${isSelected ? "border-red-500 ring-2 ring-red-100" : "border-gray-200"}`}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectProduct(product.id)}
                                                className="absolute left-2 top-2 z-10 h-4 w-4 accent-red-600"
                                                aria-label={`Select ${product.name}`}
                                            />
                                            <span className={`absolute right-2 top-2 z-10 rounded px-1.5 py-0.5 text-[8px] font-black text-white ${product.is_active ? "bg-green-600" : "bg-gray-700"}`}>
                                                {product.is_active ? "ON" : "OFF"}
                                            </span>

                                            <div className="h-28 bg-gray-50">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-3xl text-gray-300">🛒</div>
                                                )}
                                            </div>

                                            <div className="p-2">
                                                <h3 title={product.name} className="line-clamp-2 min-h-8 text-[11px] font-black">
                                                    {product.name}
                                                </h3>
                                                <p className="mt-1 text-xs font-black text-blue-600">₹{displayPrice}</p>
                                                {hasOffer && <p className="text-[9px] text-gray-400 line-through">₹{product.price}</p>}
                                                <p className={`mt-1 text-[10px] ${Number(product.stock) <= 0 ? "text-red-600" : "text-gray-500"}`}>
                                                    Stock: {product.stock}
                                                </p>
                                                {product.category && <p className="truncate text-[9px] text-gray-400">{product.category}</p>}

                                                <div className="mt-2 grid grid-cols-3 gap-1">
                                                    <button onClick={() => handleEdit(product)} className="rounded bg-blue-50 py-1.5 text-[10px] font-bold text-blue-700">Edit</button>
                                                    <button onClick={() => handleToggleActive(product)} className="rounded bg-yellow-50 py-1.5 text-[10px] font-bold text-yellow-700">{product.is_active ? "Off" : "On"}</button>
                                                    <button onClick={() => handleDelete(product.id)} className="rounded bg-red-50 py-1.5 text-[10px] font-bold text-red-700">Del</button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <style>{`
                .admin-label {
                    display: block;
                    margin-bottom: 5px;
                    color: #4b5563;
                    font-size: 11px;
                    font-weight: 800;
                }
                .admin-input {
                    width: 100%;
                    min-width: 0;
                    height: 40px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    padding: 0 10px;
                    background: white;
                    font-size: 12px;
                    outline: none;
                }
                .admin-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59,130,246,.12);
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="min-w-0">
            <label className="admin-label">{label}</label>
            {children}
        </div>
    );
}

export default AdminDashboard;