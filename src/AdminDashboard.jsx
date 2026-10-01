import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { supabase } from "./supabase";

const MAX_BULK_DELETE = 50;

function AdminDashboard() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const bannerFileInputRef = useRef(null);

    // ======================================================
    // PRODUCTS
    // ======================================================

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bulkUploading, setBulkUploading] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [productSearch, setProductSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    const [selectedProducts, setSelectedProducts] = useState([]);

    const [form, setForm] = useState({
        name: "",
        price: "",
        offer_price: "",
        category: "",
        description: "",
        stock: "",
        weight: "",
        image_url: "",
        is_active: true,
    });

    // ======================================================
    // BANNERS
    // ======================================================

    const [banners, setBanners] = useState([]);
    const [bannerLoading, setBannerLoading] = useState(false);
    const [bannerSaving, setBannerSaving] = useState(false);

    const [editingBannerId, setEditingBannerId] = useState(null);

    const [bannerForm, setBannerForm] = useState({
        image_url: "",
        link_url: "",
        sort_order: 0,
        is_active: true,
    });

    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState("");

    // ======================================================
    // ADMIN CHECK
    // ======================================================

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                navigate("/login");
                return;
            }

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("PROFILE ERROR:", error);
                navigate("/");
                return;
            }

            if (profile?.role !== "admin") {
                alert("Admin access required ❌");
                navigate("/");
                return;
            }

            await Promise.all([
                fetchProducts(),
                fetchBanners(),
            ]);
        } catch (error) {
            console.error("ADMIN CHECK ERROR:", error);
            navigate("/");
        }
    };

    // ======================================================
    // FETCH PRODUCTS
    // ======================================================

    const fetchProducts = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("products")
                .select("*")
                .order("created_at", {
                    ascending: false,
                });

            if (error) {
                console.error("PRODUCT FETCH ERROR:", error);
                alert(`Products load nahi hue ❌\n\n${error.message}`);
                return;
            }

            setProducts(data || []);

            // Remove selected IDs that no longer exist
            const existingIds = new Set(
                (data || []).map((product) => String(product.id))
            );

            setSelectedProducts((prev) =>
                prev.filter((id) => existingIds.has(String(id)))
            );
        } catch (error) {
            console.error("PRODUCT FETCH ERROR:", error);
        } finally {
            setLoading(false);
        }
    };

    // ======================================================
    // PRODUCT CATEGORIES
    // ======================================================

    const categories = useMemo(() => {
        const values = products
            .map((product) => product.category)
            .filter(Boolean)
            .map((category) => category.trim());

        return [...new Set(values)].sort();
    }, [products]);

    // ======================================================
    // FILTERED PRODUCTS
    // ======================================================

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
    }, [
        products,
        productSearch,
        categoryFilter,
    ]);

    // ======================================================
    // PRODUCT FORM
    // ======================================================

    const handleProductChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const resetForm = () => {
        setForm({
            name: "",
            price: "",
            offer_price: "",
            category: "",
            description: "",
            stock: "",
            weight: "",
            image_url: "",
            is_active: true,
        });

        setEditingId(null);
    };

    // ======================================================
    // ADD / UPDATE PRODUCT
    // ======================================================

    const handleProductSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("Product name required ❌");
            return;
        }

        if (form.price === "" || Number(form.price) < 0) {
            alert("Valid price enter karo ❌");
            return;
        }

        if (
            form.offer_price !== "" &&
            Number(form.offer_price) < 0
        ) {
            alert("Valid offer price enter karo ❌");
            return;
        }

        if (form.stock === "" || Number(form.stock) < 0) {
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

            let error;

            if (editingId) {
                const result = await supabase
                    .from("products")
                    .update(productData)
                    .eq("id", editingId);

                error = result.error;
            } else {
                const result = await supabase
                    .from("products")
                    .insert([productData]);

                error = result.error;
            }

            if (error) {
                console.error("PRODUCT SAVE ERROR:", error);
                alert(`Product save nahi hua ❌\n\n${error.message}`);
                return;
            }

            alert(
                editingId
                    ? "Product updated successfully ✅"
                    : "Product added successfully ✅"
            );

            resetForm();
            await fetchProducts();
        } catch (error) {
            console.error("PRODUCT SAVE ERROR:", error);
            alert(`Something went wrong ❌\n\n${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ======================================================
    // EDIT PRODUCT
    // ======================================================

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

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ======================================================
    // TOGGLE PRODUCT ACTIVE
    // ======================================================

    const handleToggleActive = async (product) => {
        try {
            const { error } = await supabase
                .from("products")
                .update({
                    is_active: !product.is_active,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", product.id);

            if (error) {
                console.error("TOGGLE ERROR:", error);
                alert(`Status change nahi hua ❌\n\n${error.message}`);
                return;
            }

            await fetchProducts();
        } catch (error) {
            console.error("TOGGLE ERROR:", error);
        }
    };

    // ======================================================
    // SINGLE DELETE
    // ======================================================

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Ye product permanently delete karna hai?"
        );

        if (!confirmed) return;

        try {
            setSaving(true);

            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", id);

            if (error) {
                console.error("DELETE ERROR:", error);
                alert(`Delete nahi hua ❌\n\n${error.message}`);
                return;
            }

            setSelectedProducts((prev) =>
                prev.filter((item) => String(item) !== String(id))
            );

            if (
                editingId &&
                String(editingId) === String(id)
            ) {
                resetForm();
            }

            await fetchProducts();

            alert("Product deleted successfully 🗑️");
        } catch (error) {
            console.error("DELETE ERROR:", error);
            alert(`Something went wrong ❌\n\n${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ======================================================
    // SELECT PRODUCT
    // ======================================================

    const handleSelectProduct = (id) => {
        setSelectedProducts((prev) => {
            const alreadySelected = prev.some(
                (item) => String(item) === String(id)
            );

            if (alreadySelected) {
                return prev.filter(
                    (item) => String(item) !== String(id)
                );
            }

            if (prev.length >= MAX_BULK_DELETE) {
                alert(
                    "Ek baar me maximum 50 products select kar sakte ho ❌"
                );

                return prev;
            }

            return [...prev, id];
        });
    };

    // ======================================================
    // SELECT ALL VISIBLE - MAX 50
    // ======================================================

    const handleSelectAllProducts = () => {
        const visibleIds = filteredProducts
            .map((product) => product.id);

        const allVisibleSelected =
            visibleIds.length > 0 &&
            visibleIds.every((id) =>
                selectedProducts.some(
                    (selectedId) =>
                        String(selectedId) === String(id)
                )
            );

        if (allVisibleSelected) {
            setSelectedProducts((prev) =>
                prev.filter(
                    (id) =>
                        !visibleIds.some(
                            (visibleId) =>
                                String(visibleId) === String(id)
                        )
                )
            );

            return;
        }

        const currentSelected = [...selectedProducts];

        const availableSlots =
            MAX_BULK_DELETE - currentSelected.length;

        if (availableSlots <= 0) {
            alert(
                "Maximum 50 products already selected ❌"
            );
            return;
        }

        const idsToAdd = visibleIds
            .filter(
                (id) =>
                    !currentSelected.some(
                        (selectedId) =>
                            String(selectedId) === String(id)
                    )
            )
            .slice(0, availableSlots);

        setSelectedProducts([
            ...currentSelected,
            ...idsToAdd,
        ]);

        const remainingUnselected = visibleIds.filter(
            (id) =>
                !currentSelected.some(
                    (selectedId) =>
                        String(selectedId) === String(id)
                )
        );

        if (idsToAdd.length < remainingUnselected.length) {
            alert(
                "Maximum 50 products hi select ho sakte hain ❌"
            );
        }
    };

    // ======================================================
    // BULK DELETE 50 PRODUCTS
    // ======================================================

    const handleBulkDelete = async () => {
        if (selectedProducts.length === 0) {
            alert("Pehle products select karo ❌");
            return;
        }

        if (selectedProducts.length > MAX_BULK_DELETE) {
            alert(
                "Maximum 50 products hi delete kar sakte ho ❌"
            );
            return;
        }

        const confirmed = window.confirm(
            `${selectedProducts.length} products permanently delete karne hain?\n\nYe action undo nahi kiya ja sakta.`
        );

        if (!confirmed) return;

        try {
            setSaving(true);

            const { error } = await supabase
                .from("products")
                .delete()
                .in("id", selectedProducts);

            if (error) {
                console.error(
                    "BULK DELETE ERROR:",
                    error
                );

                alert(
                    `Bulk delete fail hua ❌\n\n${error.message}`
                );

                return;
            }

            const deletedCount = selectedProducts.length;

            setSelectedProducts([]);

            if (
                editingId &&
                selectedProducts.some(
                    (id) =>
                        String(id) === String(editingId)
                )
            ) {
                resetForm();
            }

            await fetchProducts();

            alert(
                `${deletedCount} products successfully deleted 🗑️`
            );
        } catch (error) {
            console.error(
                "BULK DELETE ERROR:",
                error
            );

            alert(
                `Something went wrong ❌\n\n${error.message}`
            );
        } finally {
            setSaving(false);
        }
    };

    // ======================================================
    // CSV BULK UPLOAD
    // ======================================================

    const handleCSVUpload = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,

            complete: async (results) => {
                try {
                    if (!results.data?.length) {
                        alert("CSV empty hai ❌");
                        return;
                    }

                    setBulkUploading(true);

                    const rows = results.data
                        .map((row) => {
                            const name =
                                row.name?.trim();

                            if (!name) return null;

                            const price =
                                Number(row.price);

                            const offerPrice =
                                row.offer_price === "" ||
                                    row.offer_price == null
                                    ? null
                                    : Number(
                                        row.offer_price
                                    );

                            const stock =
                                row.stock === "" ||
                                    row.stock == null
                                    ? 0
                                    : Number(row.stock);

                            return {
                                name,

                                price:
                                    Number.isFinite(price)
                                        ? price
                                        : 0,

                                offer_price:
                                    offerPrice !== null &&
                                        Number.isFinite(
                                            offerPrice
                                        )
                                        ? offerPrice
                                        : null,

                                category:
                                    row.category?.trim() ||
                                    null,

                                description:
                                    row.description?.trim() ||
                                    null,

                                stock:
                                    Number.isFinite(stock)
                                        ? stock
                                        : 0,

                                weight:
                                    row.weight?.trim() ||
                                    null,

                                image_url:
                                    row.image_url?.trim() ||
                                    null,

                                is_active:
                                    String(
                                        row.is_active ?? "true"
                                    ).toLowerCase() !==
                                    "false",
                            };
                        })
                        .filter(Boolean);

                    if (!rows.length) {
                        alert(
                            "CSV me valid products nahi mile ❌"
                        );
                        return;
                    }

                    const { error } = await supabase
                        .from("products")
                        .insert(rows);

                    if (error) {
                        console.error(
                            "CSV UPLOAD ERROR:",
                            error
                        );

                        alert(
                            `CSV upload fail hua ❌\n\n${error.message}`
                        );

                        return;
                    }

                    alert(
                        `${rows.length} products successfully uploaded ✅`
                    );

                    await fetchProducts();
                } catch (error) {
                    console.error(
                        "CSV ERROR:",
                        error
                    );

                    alert(
                        `CSV upload error ❌\n\n${error.message}`
                    );
                } finally {
                    setBulkUploading(false);

                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                }
            },

            error: (error) => {
                console.error("CSV PARSE ERROR:", error);

                alert(
                    `CSV read nahi hua ❌\n\n${error.message}`
                );

                setBulkUploading(false);
            },
        });
    };

    // ======================================================
    // FETCH BANNERS
    // ======================================================

    const fetchBanners = async () => {
        try {
            setBannerLoading(true);

            const { data, error } = await supabase
                .from("banners")
                .select("*")
                .order("sort_order", {
                    ascending: true,
                })
                .order("created_at", {
                    ascending: false,
                });

            if (error) {
                console.error(
                    "BANNER FETCH ERROR:",
                    error
                );

                alert(
                    `Banners load nahi hue ❌\n\n${error.message}`
                );

                return;
            }

            setBanners(data || []);
        } catch (error) {
            console.error(
                "BANNER FETCH ERROR:",
                error
            );
        } finally {
            setBannerLoading(false);
        }
    };

    // ======================================================
    // BANNER FORM CHANGE
    // ======================================================

    const handleBannerChange = (e) => {
        const { name, value, type, checked } = e.target;

        setBannerForm((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    // ======================================================
    // BANNER FILE CHANGE
    // ======================================================

    const handleBannerFileChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            setBannerFile(null);
            setBannerPreview("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert(
                "Sirf image file select karo ❌"
            );

            e.target.value = "";
            setBannerFile(null);
            setBannerPreview("");

            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert(
                "Banner image 5MB se chhoti honi chahiye ❌"
            );

            e.target.value = "";
            setBannerFile(null);
            setBannerPreview("");

            return;
        }

        setBannerFile(file);

        const previewUrl =
            URL.createObjectURL(file);

        setBannerPreview(previewUrl);
    };

    // ======================================================
    // UPLOAD BANNER IMAGE TO SUPABASE STORAGE
    // ======================================================

    const uploadBannerImage = async (file) => {
        if (!file) return null;

        const fileExt =
            file.name
                .split(".")
                .pop()
                ?.toLowerCase() || "jpg";

        const randomPart =
            Math.random()
                .toString(36)
                .substring(2, 9);

        const fileName =
            `banner-${Date.now()}-${randomPart}.${fileExt}`;

        const { error: uploadError } =
            await supabase.storage
                .from("banners")
                .upload(
                    fileName,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: file.type,
                    }
                );

        if (uploadError) {
            throw uploadError;
        }

        const {
            data: publicUrlData,
        } = supabase.storage
            .from("banners")
            .getPublicUrl(fileName);

        return publicUrlData?.publicUrl || null;
    };

    // ======================================================
    // RESET BANNER
    // ======================================================

    const resetBannerForm = () => {
        setBannerForm({
            image_url: "",
            link_url: "",
            sort_order: 0,
            is_active: true,
        });

        setBannerFile(null);
        setBannerPreview("");
        setEditingBannerId(null);

        if (bannerFileInputRef.current) {
            bannerFileInputRef.current.value = "";
        }
    };

    // ======================================================
    // ADD / UPDATE BANNER
    // ======================================================

    const handleBannerSubmit = async (e) => {
        e.preventDefault();

        if (
            !bannerFile &&
            !bannerForm.image_url.trim()
        ) {
            alert(
                "Gallery se banner select karo ya Image URL enter karo ❌"
            );

            return;
        }

        try {
            setBannerSaving(true);

            let finalImageUrl =
                bannerForm.image_url.trim();

            // Gallery image gets priority
            if (bannerFile) {
                finalImageUrl =
                    await uploadBannerImage(
                        bannerFile
                    );
            }

            if (!finalImageUrl) {
                alert(
                    "Banner image nahi mili ❌"
                );

                return;
            }

            const bannerData = {
                image_url: finalImageUrl,

                link_url:
                    bannerForm.link_url.trim() ||
                    null,

                sort_order:
                    Number(
                        bannerForm.sort_order
                    ) || 0,

                is_active:
                    bannerForm.is_active,

                updated_at:
                    new Date().toISOString(),
            };

            let error;

            if (editingBannerId) {
                const result = await supabase
                    .from("banners")
                    .update(bannerData)
                    .eq(
                        "id",
                        editingBannerId
                    );

                error = result.error;
            } else {
                const result = await supabase
                    .from("banners")
                    .insert([
                        bannerData,
                    ]);

                error = result.error;
            }

            if (error) {
                console.error(
                    "BANNER SAVE ERROR:",
                    error
                );

                alert(
                    `Banner save nahi hua ❌\n\n${error.message}`
                );

                return;
            }

            alert(
                editingBannerId
                    ? "Banner updated successfully ✅"
                    : "Banner added successfully ✅"
            );

            resetBannerForm();
            await fetchBanners();
        } catch (error) {
            console.error(
                "BANNER SAVE ERROR:",
                error
            );

            alert(
                `Banner save error ❌\n\n${error.message}`
            );
        } finally {
            setBannerSaving(false);
        }
    };

    // ======================================================
    // EDIT BANNER
    // ======================================================

    const handleEditBanner = (banner) => {
        setEditingBannerId(banner.id);

        setBannerForm({
            image_url:
                banner.image_url || "",

            link_url:
                banner.link_url || "",

            sort_order:
                banner.sort_order ?? 0,

            is_active:
                banner.is_active ?? true,
        });

        setBannerFile(null);
        setBannerPreview("");

        if (bannerFileInputRef.current) {
            bannerFileInputRef.current.value = "";
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ======================================================
    // DELETE BANNER
    // ======================================================

    const handleDeleteBanner = async (id) => {
        const confirmed = window.confirm(
            "Ye banner permanently delete karna hai?"
        );

        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from("banners")
                .delete()
                .eq("id", id);

            if (error) {
                console.error(
                    "BANNER DELETE ERROR:",
                    error
                );

                alert(
                    `Banner delete nahi hua ❌\n\n${error.message}`
                );

                return;
            }

            if (
                String(editingBannerId) ===
                String(id)
            ) {
                resetBannerForm();
            }

            await fetchBanners();

            alert(
                "Banner deleted successfully 🗑️"
            );
        } catch (error) {
            console.error(
                "BANNER DELETE ERROR:",
                error
            );

            alert(
                `Something went wrong ❌\n\n${error.message}`
            );
        }
    };

    // ======================================================
    // TOGGLE BANNER
    // ======================================================

    const handleToggleBanner = async (banner) => {
        try {
            const { error } = await supabase
                .from("banners")
                .update({
                    is_active:
                        !banner.is_active,

                    updated_at:
                        new Date().toISOString(),
                })
                .eq(
                    "id",
                    banner.id
                );

            if (error) {
                console.error(
                    "BANNER TOGGLE ERROR:",
                    error
                );

                alert(
                    `Banner status change nahi hua ❌\n\n${error.message}`
                );

                return;
            }

            await fetchBanners();
        } catch (error) {
            console.error(
                "BANNER TOGGLE ERROR:",
                error
            );
        }
    };

    // ======================================================
    // STATS
    // ======================================================

    const totalProducts = products.length;

    const activeProducts = products.filter(
        (product) => product.is_active
    ).length;

    const outOfStock = products.filter(
        (product) =>
            Number(product.stock) <= 0
    ).length;

    const activeBanners = banners.filter(
        (banner) => banner.is_active
    ).length;

    // ======================================================
    // UI
    // ======================================================

    return (
        <div className="min-h-screen bg-gray-100">

            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">

                <div className="max-w-[1800px] mx-auto px-4 py-3">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

                        <div>
                            <h1 className="text-xl font-black text-gray-900">
                                Apna Mart Admin
                            </h1>

                            <p className="text-xs text-gray-500">
                                Products, banners & store management
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">

                            <button
                                onClick={() =>
                                    navigate("/admin/orders")
                                }
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                            >
                                📦 Orders
                            </button>

                            <button
                                onClick={() =>
                                    navigate("/")
                                }
                                className="px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-bold"
                            >
                                🏪 View Store
                            </button>

                        </div>

                    </div>

                </div>

            </header>

            <main className="max-w-[1800px] mx-auto px-3 sm:px-4 py-4">

                {/* ==================================================
                    QUICK STATS
                ================================================== */}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">

                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                        <p className="text-[11px] text-gray-500">
                            Total Products
                        </p>

                        <p className="text-xl font-black text-gray-900">
                            {totalProducts}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                        <p className="text-[11px] text-gray-500">
                            Active Products
                        </p>

                        <p className="text-xl font-black text-green-600">
                            {activeProducts}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                        <p className="text-[11px] text-gray-500">
                            Out of Stock
                        </p>

                        <p className="text-xl font-black text-red-600">
                            {outOfStock}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                        <p className="text-[11px] text-gray-500">
                            Active Banners
                        </p>

                        <p className="text-xl font-black text-blue-600">
                            {activeBanners}
                        </p>
                    </div>

                </div>

                {/* ==================================================
                    PRODUCT FORM
                ================================================== */}

                <section className="bg-white rounded-xl border border-gray-200 mb-4">

                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">

                        <div>
                            <h2 className="text-sm font-black text-gray-900">
                                {editingId
                                    ? "✏️ Edit Product"
                                    : "➕ Add Product"}
                            </h2>

                            <p className="text-[11px] text-gray-500">
                                Product information
                            </p>
                        </div>

                        {editingId && (
                            <button
                                onClick={resetForm}
                                className="text-xs font-bold text-gray-600 hover:text-red-600"
                            >
                                ✕ Cancel Edit
                            </button>
                        )}

                    </div>

                    <form
                        onSubmit={
                            handleProductSubmit
                        }
                        className="p-4"
                    >

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-2.5">

                            <div className="xl:col-span-2">
                                <label className="admin-label">
                                    Product Name *
                                </label>

                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={
                                        handleProductChange
                                    }
                                    placeholder="Product name"
                                    className="admin-input"
                                />
                            </div>

                            <div>
                                <label className="admin-label">
                                    Price *
                                </label>

                                <input
                                    name="price"
                                    type="number"
                                    min="0"
                                    value={form.price}
                                    onChange={
                                        handleProductChange
                                    }
                                    placeholder="₹"
                                    className="admin-input"
                                />
                            </div>

                            <div>
                                <label className="admin-label">
                                    Offer Price
                                </label>

                                <input
                                    name="offer_price"
                                    type="number"
                                    min="0"
                                    value={
                                        form.offer_price
                                    }
                                    onChange={
                                        handleProductChange
                                    }
                                    placeholder="₹"
                                    className="admin-input"
                                />
                            </div>

                            <div>
                                <label className="admin-label">
                                    Category
                                </label>

                                <input
                                    name="category"
                                    value={
                                        form.category
                                    }
                                    onChange={
                                        handleProductChange
                                    }
                                    placeholder="Category"
                                    className="admin-input"
                                    list="product-categories"
                                />

                                <datalist id="product-categories">
                                    {categories.map(
                                        (category) => (
                                            <option
                                                key={
                                                    category
                                                }
                                                value={
                                                    category
                                                }
                                            />
                                        )
                                    )}
                                </datalist>
                            </div>

                            <div>
                                <label className="admin-label">
                                    Stock *
                                </label>

                                <input
                                    name="stock"
                                    type="number"
                                    min="0"
                                    value={
                                        form.stock
                                    }
                                    onChange={
                                        handleProductChange
                                    }
                                    placeholder="0"
                                    className="admin-input"
                                />
                            </div>

                            <div>
                                <label className="admin-label">
                                    Weight
                                </label>

                                <input
                                    name="weight"
                                    value={
                                        form.weight
                                    }
                                    onChange={
                                        handleProductChange
                                    }
                                    placeholder="1 kg"
                                    className="admin-input"
                                />
                            </div>

                            <div className="xl:col-span-2">
                                <label className="admin-label">
                                    Image URL
                                </label>

                                <input
                                    name="image_url"
                                    value={
                                        form.image_url
                                    }
                                    onChange={
                                        handleProductChange
                                    }
                                    placeholder="https://..."
                                    className="admin-input"
                                />
                            </div>

                            <div className="sm:col-span-2 lg:col-span-2 xl:col-span-3">
                                <label className="admin-label">
                                    Description
                                </label>

                                <input
                                    name="description"
                                    value={
                                        form.description
                                    }
                                    onChange={
                                        handleProductChange
                                    }
                                    placeholder="Short description"
                                    className="admin-input"
                                />
                            </div>

                            <div className="flex items-end">

                                <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full cursor-pointer h-[38px]">

                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={
                                            form.is_active
                                        }
                                        onChange={
                                            handleProductChange
                                        }
                                        className="accent-green-600"
                                    />

                                    <span className="text-xs font-bold">
                                        Active
                                    </span>

                                </label>

                            </div>

                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">

                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-black"
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "💾 Update Product"
                                        : "➕ Add Product"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold"
                                >
                                    Cancel
                                </button>
                            )}

                        </div>

                    </form>

                </section>

                {/* ==================================================
                    CSV UPLOAD
                ================================================== */}

                <section className="bg-white rounded-xl border border-gray-200 p-3 mb-4">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                        <div>
                            <h2 className="text-sm font-black">
                                📄 Bulk CSV Upload
                            </h2>

                            <p className="text-[10px] text-gray-500 mt-0.5">
                                Columns: name, price, offer_price, category,
                                description, stock, weight, image_url, is_active
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            disabled={
                                bulkUploading
                            }
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-bold"
                        >
                            {bulkUploading
                                ? "Uploading..."
                                : "📤 Upload CSV"}
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={
                                handleCSVUpload
                            }
                            className="hidden"
                        />

                    </div>

                </section>

                {/* ==================================================
                    BANNER MANAGEMENT
                ================================================== */}

                <section className="bg-white rounded-xl border border-gray-200 mb-4">

                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">

                        <div>
                            <h2 className="text-sm font-black">
                                🖼️ Banner Management
                            </h2>

                            <p className="text-[11px] text-gray-500">
                                Gallery image ya Image URL use kar sakte ho
                            </p>
                        </div>

                        {editingBannerId && (
                            <button
                                onClick={
                                    resetBannerForm
                                }
                                className="text-xs font-bold text-gray-600 hover:text-red-600"
                            >
                                ✕ Cancel Edit
                            </button>
                        )}

                    </div>

                    <form
                        onSubmit={
                            handleBannerSubmit
                        }
                        className="p-4"
                    >

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">

                            {/* GALLERY */}

                            <div className="lg:col-span-2">

                                <label className="admin-label">
                                    Banner Image
                                </label>

                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-3">

                                    <input
                                        ref={
                                            bannerFileInputRef
                                        }
                                        id="banner-file-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={
                                            handleBannerFileChange
                                        }
                                        className="block w-full text-xs"
                                    />

                                    <p className="text-[10px] text-gray-500 mt-2">
                                        Maximum 5MB • JPG, PNG, WEBP etc.
                                    </p>

                                    {(bannerPreview ||
                                        bannerForm.image_url) && (
                                            <div className="mt-3">

                                                <img
                                                    src={
                                                        bannerPreview ||
                                                        bannerForm.image_url
                                                    }
                                                    alt="Banner Preview"
                                                    className="w-full h-32 object-cover rounded-lg border"
                                                />

                                            </div>
                                        )}

                                </div>

                            </div>

                            {/* URL */}

                            <div>

                                <label className="admin-label">
                                    Image URL
                                </label>

                                <input
                                    name="image_url"
                                    value={
                                        bannerForm.image_url
                                    }
                                    onChange={
                                        handleBannerChange
                                    }
                                    placeholder="https://..."
                                    className="admin-input"
                                />

                                <p className="text-[10px] text-gray-500 mt-1">
                                    Gallery select karoge to gallery image priority hogi.
                                </p>

                            </div>

                            {/* LINK */}

                            <div>

                                <label className="admin-label">
                                    Banner Link
                                </label>

                                <input
                                    name="link_url"
                                    value={
                                        bannerForm.link_url
                                    }
                                    onChange={
                                        handleBannerChange
                                    }
                                    placeholder="/products?category=..."
                                    className="admin-input"
                                />

                                <p className="text-[10px] text-gray-500 mt-1">
                                    Optional
                                </p>

                            </div>

                            {/* SORT */}

                            <div>

                                <label className="admin-label">
                                    Sort Order
                                </label>

                                <input
                                    name="sort_order"
                                    type="number"
                                    value={
                                        bannerForm.sort_order
                                    }
                                    onChange={
                                        handleBannerChange
                                    }
                                    className="admin-input"
                                />

                            </div>

                            {/* ACTIVE */}

                            <div className="flex items-end">

                                <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full cursor-pointer h-[38px]">

                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={
                                            bannerForm.is_active
                                        }
                                        onChange={
                                            handleBannerChange
                                        }
                                        className="accent-green-600"
                                    />

                                    <span className="text-xs font-bold">
                                        Active Banner
                                    </span>

                                </label>

                            </div>

                        </div>

                        <div className="flex gap-2 mt-3">

                            <button
                                type="submit"
                                disabled={
                                    bannerSaving
                                }
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-black"
                            >
                                {bannerSaving
                                    ? "Saving..."
                                    : editingBannerId
                                        ? "💾 Update Banner"
                                        : "➕ Add Banner"}
                            </button>

                            {editingBannerId && (
                                <button
                                    type="button"
                                    onClick={
                                        resetBannerForm
                                    }
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold"
                                >
                                    Cancel
                                </button>
                            )}

                        </div>

                    </form>

                    {/* EXISTING BANNERS */}

                    <div className="border-t border-gray-200 p-4">

                        <div className="flex items-center justify-between mb-3">

                            <h3 className="text-xs font-black">
                                Existing Banners
                            </h3>

                            <span className="text-[10px] text-gray-500">
                                {banners.length} banners
                            </span>

                        </div>

                        {bannerLoading ? (
                            <div className="text-xs text-gray-500 py-5 text-center">
                                Loading banners...
                            </div>
                        ) : banners.length === 0 ? (
                            <div className="text-xs text-gray-500 py-5 text-center border border-dashed rounded-lg">
                                No banners added yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">

                                {banners.map(
                                    (banner) => (
                                        <div
                                            key={
                                                banner.id
                                            }
                                            className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50"
                                        >

                                            <div className="relative h-28">

                                                <img
                                                    src={
                                                        banner.image_url
                                                    }
                                                    alt="Banner"
                                                    className="w-full h-full object-cover"
                                                />

                                                <span
                                                    className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[9px] font-black ${banner.is_active
                                                            ? "bg-green-600 text-white"
                                                            : "bg-gray-700 text-white"
                                                        }`}
                                                >
                                                    {banner.is_active
                                                        ? "ACTIVE"
                                                        : "OFF"}
                                                </span>

                                            </div>

                                            <div className="p-2.5">

                                                <div className="flex items-center justify-between mb-2">

                                                    <span className="text-[10px] text-gray-500">
                                                        Order:{" "}
                                                        {
                                                            banner.sort_order
                                                        }
                                                    </span>

                                                    {banner.link_url && (
                                                        <span className="text-[9px] text-blue-600 truncate max-w-[150px]">
                                                            🔗 Link
                                                        </span>
                                                    )}

                                                </div>

                                                <div className="grid grid-cols-3 gap-1.5">

                                                    <button
                                                        onClick={() =>
                                                            handleEditBanner(
                                                                banner
                                                            )
                                                        }
                                                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md py-1.5 text-[10px] font-bold"
                                                    >
                                                        ✏️ Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleToggleBanner(
                                                                banner
                                                            )
                                                        }
                                                        className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md py-1.5 text-[10px] font-bold"
                                                    >
                                                        {banner.is_active
                                                            ? "⏸ Off"
                                                            : "▶ On"}
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDeleteBanner(
                                                                banner.id
                                                            )
                                                        }
                                                        className="bg-red-100 text-red-700 hover:bg-red-200 rounded-md py-1.5 text-[10px] font-bold"
                                                    >
                                                        🗑️
                                                    </button>

                                                </div>

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>
                        )}

                    </div>

                </section>

                {/* ==================================================
                    PRODUCTS
                ================================================== */}

                <section className="bg-white rounded-xl border border-gray-200">

                    {/* PRODUCTS HEADER */}

                    <div className="p-3 border-b border-gray-200">

                        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">

                            <div>
                                <h2 className="text-sm font-black text-gray-900">
                                    All Products
                                </h2>

                                <p className="text-[10px] text-gray-500">
                                    Showing{" "}
                                    {
                                        filteredProducts.length
                                    }{" "}
                                    /{" "}
                                    {
                                        products.length
                                    }
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">

                                {/* SEARCH */}

                                <input
                                    type="text"
                                    value={
                                        productSearch
                                    }
                                    onChange={(e) =>
                                        setProductSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="🔍 Search..."
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
                                />

                                {/* CATEGORY */}

                                <select
                                    value={
                                        categoryFilter
                                    }
                                    onChange={(e) =>
                                        setCategoryFilter(
                                            e.target.value
                                        )
                                    }
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none bg-white"
                                >

                                    <option value="all">
                                        All Categories
                                    </option>

                                    {categories.map(
                                        (category) => (
                                            <option
                                                key={
                                                    category
                                                }
                                                value={
                                                    category
                                                }
                                            >
                                                {category}
                                            </option>
                                        )
                                    )}

                                </select>

                                {/* SELECT ALL */}

                                <button
                                    onClick={
                                        handleSelectAllProducts
                                    }
                                    disabled={
                                        filteredProducts.length ===
                                        0
                                    }
                                    className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-[10px] font-black whitespace-nowrap"
                                >
                                    ☑ Select 50
                                </button>

                                {/* DELETE */}

                                <button
                                    onClick={
                                        handleBulkDelete
                                    }
                                    disabled={
                                        selectedProducts.length ===
                                        0 ||
                                        saving
                                    }
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-[10px] font-black whitespace-nowrap"
                                >
                                    🗑️ Delete (
                                    {
                                        selectedProducts.length
                                    }
                                    )
                                </button>

                                {/* REFRESH */}

                                <button
                                    onClick={
                                        fetchProducts
                                    }
                                    disabled={
                                        loading
                                    }
                                    className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-200 px-3 py-2 rounded-lg text-xs font-bold"
                                    title="Refresh"
                                >
                                    🔄
                                </button>

                            </div>

                        </div>

                        {/* SELECTION INFO */}

                        {selectedProducts.length >
                            0 && (
                                <div className="mt-2 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">

                                    <p className="text-[10px] font-black text-red-700">
                                        ⚠️{" "}
                                        {
                                            selectedProducts.length
                                        }
                                        /50 products selected
                                    </p>

                                    <button
                                        onClick={() =>
                                            setSelectedProducts(
                                                []
                                            )
                                        }
                                        className="text-[10px] font-bold text-red-600 hover:underline"
                                    >
                                        Clear Selection
                                    </button>

                                </div>
                            )}

                    </div>

                    {/* PRODUCT LIST */}

                    <div className="p-3">

                        {loading ? (
                            <div className="py-10 text-center text-xs text-gray-500">
                                Loading products...
                            </div>
                        ) : filteredProducts.length ===
                            0 ? (
                            <div className="py-10 text-center border border-dashed border-gray-300 rounded-xl">

                                <p className="text-sm font-bold text-gray-600">
                                    No products found
                                </p>

                                <p className="text-[10px] text-gray-400 mt-1">
                                    Search/category filter change karke dekho.
                                </p>

                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">

                                {filteredProducts.map(
                                    (product) => {

                                        const isSelected =
                                            selectedProducts.some(
                                                (id) =>
                                                    String(
                                                        id
                                                    ) ===
                                                    String(
                                                        product.id
                                                    )
                                            );

                                        const displayPrice =
                                            product.offer_price !==
                                                null &&
                                                product.offer_price !==
                                                undefined &&
                                                product.offer_price !==
                                                ""
                                                ? product.offer_price
                                                : product.price;

                                        return (
                                            <div
                                                key={
                                                    product.id
                                                }
                                                className={`relative border rounded-xl overflow-hidden bg-white transition ${isSelected
                                                        ? "border-red-500 ring-2 ring-red-100"
                                                        : "border-gray-200 hover:shadow-md"
                                                    }`}
                                            >

                                                {/* CHECKBOX */}

                                                <div className="absolute top-1.5 left-1.5 z-20 bg-white rounded-md shadow-sm p-0.5">

                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            isSelected
                                                        }
                                                        onChange={() =>
                                                            handleSelectProduct(
                                                                product.id
                                                            )
                                                        }
                                                        className="w-4 h-4 cursor-pointer accent-red-600"
                                                        title="Select product"
                                                    />

                                                </div>

                                                {/* STATUS */}

                                                <span
                                                    className={`absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded text-[8px] font-black ${product.is_active
                                                            ? "bg-green-600 text-white"
                                                            : "bg-gray-700 text-white"
                                                        }`}
                                                >
                                                    {product.is_active
                                                        ? "ON"
                                                        : "OFF"}
                                                </span>

                                                {/* IMAGE */}

                                                <div className="h-28 bg-gray-50">

                                                    {product.image_url ? (
                                                        <img
                                                            src={
                                                                product.image_url
                                                            }
                                                            alt={
                                                                product.name
                                                            }
                                                            loading="lazy"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                                                            🛒
                                                        </div>
                                                    )}

                                                </div>

                                                {/* DETAILS */}

                                                <div className="p-2">

                                                    <h3
                                                        className="text-[11px] font-black text-gray-800 line-clamp-2 min-h-[28px]"
                                                        title={
                                                            product.name
                                                        }
                                                    >
                                                        {
                                                            product.name
                                                        }
                                                    </h3>

                                                    <div className="flex items-center justify-between gap-1 mt-1">

                                                        <div className="min-w-0">

                                                            <p className="text-xs font-black text-blue-600 truncate">
                                                                ₹
                                                                {
                                                                    displayPrice
                                                                }
                                                            </p>

                                                            {product.offer_price !==
                                                                null &&
                                                                product.offer_price !==
                                                                undefined &&
                                                                product.offer_price !==
                                                                "" &&
                                                                Number(
                                                                    product.offer_price
                                                                ) <
                                                                Number(
                                                                    product.price
                                                                ) && (
                                                                    <p className="text-[9px] text-gray-400 line-through">
                                                                        ₹
                                                                        {
                                                                            product.price
                                                                        }
                                                                    </p>
                                                                )}

                                                        </div>

                                                        <span
                                                            className={`text-[9px] font-bold whitespace-nowrap ${Number(
                                                                product.stock
                                                            ) <=
                                                                    0
                                                                    ? "text-red-600"
                                                                    : "text-gray-500"
                                                                }`}
                                                        >
                                                            Stock:{" "}
                                                            {
                                                                product.stock
                                                            }
                                                        </span>

                                                    </div>

                                                    {product.category && (
                                                        <p className="text-[8px] text-gray-400 truncate mt-1">
                                                            {
                                                                product.category
                                                            }
                                                        </p>
                                                    )}

                                                    {/* ACTIONS */}

                                                    <div className="grid grid-cols-3 gap-1 mt-2">

                                                        <button
                                                            onClick={() =>
                                                                handleEdit(
                                                                    product
                                                                )
                                                            }
                                                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md py-1.5 text-[9px] font-black"
                                                        >
                                                            ✏️
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handleToggleActive(
                                                                    product
                                                                )
                                                            }
                                                            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-md py-1.5 text-[9px] font-black"
                                                        >
                                                            {product.is_active
                                                                ? "⏸️"
                                                                : "▶️"}
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    product.id
                                                                )
                                                            }
                                                            className="bg-red-50 hover:bg-red-100 text-red-700 rounded-md py-1.5 text-[9px] font-black"
                                                        >
                                                            🗑️
                                                        </button>

                                                    </div>

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>
                        )}

                    </div>

                </section>

            </main>

            {/* ==================================================
                COMPACT ADMIN CSS
            ================================================== */}

            <style>{`
                .admin-label {
                    display: block;
                    font-size: 10px;
                    font-weight: 800;
                    color: #4b5563;
                    margin-bottom: 4px;
                }

                .admin-input {
                    width: 100%;
                    height: 38px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    padding: 0 10px;
                    font-size: 12px;
                    outline: none;
                    background: white;
                }

                .admin-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
                }

                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                @media (max-width: 640px) {
                    .admin-input {
                        height: 40px;
                    }
                }
            `}</style>

        </div>
    );
}

export default AdminDashboard;