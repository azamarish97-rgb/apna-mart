import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";

function AdminDashboard() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        name: "",
        price: "",
        offer_price: "",
        category: "",
        description: "",
        stock: "",
        weight:"",
        image_url: "",
        is_active: true,
    });

    // ================= CHECK ADMIN =================

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            navigate("/admin-login");
            return;
        }

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (error) {
            console.error("ADMIN CHECK ERROR:", error);
            alert("Admin verification failed.");
            navigate("/");
            return;
        }

        if (profile?.role !== "admin") {
            alert("Access denied ❌");
            navigate("/");
            return;
        }

        fetchProducts();
    };

    // ================= FETCH PRODUCTS =================

    const fetchProducts = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("FETCH PRODUCTS ERROR:", error);
            alert("Products load nahi ho paaye ❌");
        } else {
            setProducts(data || []);
        }

        setLoading(false);
    };

    // ================= INPUT CHANGE =================

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // ================= RESET FORM =================

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

    // ================= DISCOUNT =================

    const getDiscount = (price, offerPrice) => {
        if (
            !price ||
            !offerPrice ||
            Number(offerPrice) >= Number(price)
        ) {
            return 0;
        }

        return Math.round(
            ((Number(price) - Number(offerPrice)) /
                Number(price)) *
            100
        );
    };

    // ================= ADD / UPDATE =================
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (saving) return;

        if (!form.name.trim()) {
            alert("Product name enter karo.");
            return;
        }

        if (form.price === "" || Number(form.price) < 0) {
            alert("Valid original price enter karo.");
            return;
        }

        if (
            form.offer_price !== "" &&
            Number(form.offer_price) < 0
        ) {
            alert("Valid offer price enter karo.");
            return;
        }

        if (
            form.offer_price !== "" &&
            Number(form.offer_price) > Number(form.price)
        ) {
            alert("Offer price original price se zyada nahi ho sakta.");
            return;
        }

        if (form.stock === "" || Number(form.stock) < 0) {
            alert("Valid stock enter karo.");
            return;
        }

        setSaving(true);

        const productData = {
            name: form.name.trim(),
            price: Number(form.price),

            offer_price:
                form.offer_price === ""
                    ? null
                    : Number(form.offer_price),

            category: form.category.trim(),

            description: form.description.trim(),

            stock: Number(form.stock),
            weight: form.weight.trim() || null,

            image_url: form.image_url.trim() || null,

            is_active: form.is_active,

            updated_at: new Date().toISOString(),
        };

        try {
            // ================= UPDATE =================

            if (editingId) {
                const { error } = await supabase
                    .from("products")
                    .update(productData)
                    .eq("id", editingId);

                console.log("EDITING ID:", editingId);
                console.log("SENDING DATA:", productData);
                console.log("UPDATE ERROR:", error);

                if (error) {
                    console.error("UPDATE ERROR:", error);
                    alert(`Product update nahi hua ❌\n\n${error.message}`);
                    return;
                }

                alert("Product updated successfully ✅");
            }

            // ================= ADD =================

            else {
                const { data, error } = await supabase
                    .from("products")
                    .insert([productData])
                    .select();

                console.log("INSERTED DATA:", data);
                console.log("INSERT ERROR:", error);

                if (error) {
                    console.error("INSERT ERROR:", error);

                    alert(
                        `Product add nahi hua ❌\n\n${error.message}`
                    );

                    return;
                }

                alert("Product added successfully 🎉");
            }

            resetForm();

            await fetchProducts();

        } catch (error) {
            console.error("PRODUCT ERROR:", error);

            alert(
                `Something went wrong ❌\n\n${error.message}`
            );

        } finally {
            setSaving(false);
        }
    };



    // ================= BULK CSV UPLOAD =================

    const handleBulkUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setBulkUploading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().replace(/^\uFEFF/, ""),
            complete: async (results) => {
                try {
                    const rows = results.data;

                    if (rows.length === 0) {
                        alert("CSV khaali hai ❌");
                        setBulkUploading(false);
                        return;
                    }

                    const productsToInsert = rows.map((row) => {
                        const cleanOfferPrice = row.offer_price?.trim();
                        const cleanIsActive = row.is_active?.trim().toLowerCase();

                        return {
                            name: row.name?.trim() || "",
                            price: Number(row.price?.trim()) || 0,
                            offer_price:
                                !cleanOfferPrice ? null : Number(cleanOfferPrice),
                            category: row.category?.trim() || "",
                            description: row.description?.trim() || "",
                            stock: Number(row.stock?.trim()) || 0,
                            weight: row.weight?.trim() || null,
                            image_url: row.image_url?.trim() || null,
                            is_active:
                                cleanIsActive === undefined || cleanIsActive === ""
                                    ? true
                                    : cleanIsActive === "true",
                        };
                    });

                    const invalidRows = productsToInsert.filter(
                        (p) => !p.name
                    );

                    if (invalidRows.length > 0) {
                        alert(
                            `${invalidRows.length} rows me "name" missing hai, unhe check karo ❌`
                        );
                        setBulkUploading(false);
                        return;
                    }

                    const { data, error } = await supabase
                        .from("products")
                        .insert(productsToInsert)
                        .select();

                    if (error) {
                        console.error("BULK UPLOAD ERROR:", error);
                        alert(`Bulk upload fail hua ❌\n\n${error.message}`);
                        setBulkUploading(false);
                        return;
                    }

                    alert(`${data.length} products successfully add ho gaye 🎉`);
                    await fetchProducts();

                } catch (err) {
                    console.error("BULK UPLOAD ERROR:", err);
                    alert(`Kuch galat hua ❌\n\n${err.message}`);
                } finally {
                    setBulkUploading(false);
                    e.target.value = "";
                }
            },
            error: (err) => {
                console.error("CSV PARSE ERROR:", err);
                alert("CSV parse nahi hui ❌");
                setBulkUploading(false);
            },
        });
    };

    // ================= EDIT =================

    const handleEdit = (product) => {
        console.log("EDIT PRODUCT:", product);
        console.log("EDIT PRODUCT ID:", product.id);

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



    const handleToggleActive = async (product) => {
        const newStatus = !product.is_active;

        const { error } = await supabase
            .from("products")
            .update({
                is_active: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq("id", product.id);

        if (error) {
            console.error("STATUS UPDATE ERROR:", error);
            alert("Product status change nahi hua ❌");
            return;
        }

        // Screen par turant update
        setProducts((prev) =>
            prev.map((item) =>
                item.id === product.id
                    ? { ...item, is_active: newStatus }
                    : item
            )
        );
    };

    // ================= DELETE =================

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Kya tum is product ko permanently delete karna chahte ho?"
        );

        if (!confirmDelete) return;

        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("DELETE ERROR:", error);
            alert("Product delete nahi hua ❌");
            return;
        }

        alert("Product deleted successfully 🗑️");

        if (editingId === id) {
            resetForm();
        }

        fetchProducts();
    };

    // ================= UI =================

    return (
        <main className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 lg:px-10">

            <div className="max-w-7xl mx-auto">

                {/* ================= HEADER ================= */}

                <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                Admin Dashboard 🛠️
                            </h1>

                            <p className="text-gray-500 mt-1">
                                Manage Apna Mart Products
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                    Admin Dashboard 🛠️
                                </h1>

                                <p className="text-gray-500 mt-1">
                                    Manage Apna Mart Products
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">

                                <label className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-semibold transition cursor-pointer text-center">
                                    {bulkUploading ? "Uploading..." : "📤 Bulk Upload CSV"}
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleBulkUpload}
                                        disabled={bulkUploading}
                                        className="hidden"
                                    />
                                </label>

                                <button
                                    onClick={() => navigate("/admin/orders")}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
                                >
                                    📦 Manage Orders
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

                {/* ================= PRODUCT FORM ================= */}

                <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-7 mb-8">

                    <div className="flex items-center justify-between mb-6">

                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                                {editingId
                                    ? "✏️ Edit Product"
                                    : "➕ Add New Product"}
                            </h2>

                            <p className="text-gray-500 text-sm mt-1">
                                Product information enter karo
                            </p>
                        </div>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-red-500 font-semibold hover:underline"
                            >
                                Cancel
                            </button>
                        )}

                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* PRODUCT NAME */}

                            <div>
                                <label className="block font-semibold text-gray-700 mb-2">
                                    Product Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Tata Salt 1kg"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* CATEGORY */}

                            <div>
                                <label className="block font-semibold text-gray-700 mb-2">
                                    Category
                                </label>

                                <input
                                    type="text"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    placeholder="e.g. Grocery"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* ORIGINAL PRICE */}

                            <div>
                                <label className="block font-semibold text-gray-700 mb-2">
                                    Original Price ₹
                                </label>

                                <input
                                    type="number"
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    placeholder="100"
                                    min="0"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* OFFER PRICE */}

                            <div>
                                <label className="block font-semibold text-gray-700 mb-2">
                                    Offer Price ₹
                                </label>

                                <input
                                    type="number"
                                    name="offer_price"
                                    value={form.offer_price}
                                    onChange={handleChange}
                                    placeholder="80"
                                    min="0"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                {form.price &&
                                    form.offer_price &&
                                    Number(form.offer_price) <
                                    Number(form.price) && (
                                        <p className="text-green-600 text-sm mt-2 font-semibold">
                                            🎉{" "}
                                            {getDiscount(
                                                form.price,
                                                form.offer_price
                                            )}
                                            % OFF
                                        </p>
                                    )}
                            </div>

                            {/* STOCK */}

                            <div>
                                <label className="block font-semibold text-gray-700 mb-2">
                                    Stock
                                </label>

                                <input
                                    type="number"
                                    name="stock"
                                    value={form.stock}
                                    onChange={handleChange}
                                    placeholder="50"
                                    min="0"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>


                            {/* WEIGHT */}

                            <div>
                                <label className="block font-semibold text-gray-700 mb-2">
                                    Weight
                                </label>

                                <input
                                    type="text"
                                    name="weight"
                                    value={form.weight}
                                    onChange={handleChange}
                                    placeholder="500g / 1kg / 1L"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* IMAGE URL */}

                            <div>
                                <label className="block font-semibold text-gray-700 mb-2">
                                    Image URL
                                </label>

                                <input
                                    type="url"
                                    name="image_url"
                                    value={form.image_url}
                                    onChange={handleChange}
                                    placeholder="https://example.com/product.jpg"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                        </div>

                        {/* IMAGE PREVIEW */}

                        {form.image_url && (
                            <div className="mt-5">

                                <p className="font-semibold text-gray-700 mb-2">
                                    Image Preview
                                </p>

                                <div className="w-32 h-32 border rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">

                                    <img
                                        src={form.image_url}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display =
                                                "none";
                                        }}
                                    />

                                </div>

                            </div>
                        )}

                        {/* DESCRIPTION */}

                        <div className="mt-5">

                            <label className="block font-semibold text-gray-700 mb-2">
                                Description
                            </label>

                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Product ke baare me details..."
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />

                        </div>

                        {/* ACTIVE */}

                        <div className="flex items-center gap-3 mt-5">

                            <input
                                type="checkbox"
                                name="is_active"
                                checked={form.is_active}
                                onChange={handleChange}
                                className="w-5 h-5 accent-blue-600"
                            />

                            <label className="font-semibold text-gray-700">
                                Show product on website
                            </label>

                        </div>

                        {/* FORM BUTTONS */}

                        <div className="flex flex-col sm:flex-row gap-3 mt-6">

                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition"
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Product"
                                        : "Add Product"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-bold transition"
                                >
                                    Cancel Edit
                                </button>
                            )}

                        </div>

                    </form>

                </div>

                {/* ================= ALL PRODUCTS ================= */}

                <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-7">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">

                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                                All Products
                            </h2>

                            <p className="text-gray-500 mt-1">
                                Total Products: {products.length}
                            </p>
                        </div>

                        <button
                            onClick={fetchProducts}
                            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl font-semibold"
                        >
                            🔄 Refresh
                        </button>

                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-gray-500">
                            Loading products...
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-5xl mb-3">📦</p>
                            <p>No products found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                            {products.map((product) => {

                                const discount = getDiscount(
                                    product.price,
                                    product.offer_price
                                );

                                return (
                                    <div
                                        key={product.id}
                                        className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition"
                                    >

                                        {/* PRODUCT IMAGE */}

                                        <div className="h-48 bg-gray-100 flex items-center justify-center">

                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-5xl">
                                                    🛒
                                                </span>
                                            )}

                                        </div>

                                        {/* PRODUCT CONTENT */}

                                        <div className="p-5">

                                            <div className="flex items-start justify-between gap-3">

                                                <h3 className="font-bold text-lg text-gray-800">
                                                    {product.name}
                                                </h3>

                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${product.is_active
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {product.is_active
                                                        ? "Active"
                                                        : "Hidden"}
                                                </span>

                                            </div>

                                            <p className="text-sm text-gray-500 mt-1">
                                                {product.category ||
                                                    "No category"}
                                            </p>

                                            {product.weight && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    ⚖️ {product.weight}
                                                </p>
                                            )}

                                            {/* PRICE */}

                                            <div className="mt-4">

                                                {product.offer_price !== null &&
                                                    product.offer_price <
                                                    product.price ? (
                                                    <div className="flex items-center gap-2 flex-wrap">

                                                        <span className="text-xl font-bold text-green-600">
                                                            ₹
                                                            {
                                                                product.offer_price
                                                            }
                                                        </span>

                                                        <span className="text-sm text-gray-400 line-through">
                                                            ₹{product.price}
                                                        </span>

                                                        {discount > 0 && (
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                                                                {discount}% OFF
                                                            </span>
                                                        )}

                                                    </div>
                                                ) : (
                                                    <span className="text-xl font-bold text-gray-800">
                                                        ₹{product.price}
                                                    </span>
                                                )}

                                            </div>

                                            {/* STOCK */}

                                            <div className="mt-3">

                                                <span
                                                    className={`font-semibold ${Number(
                                                        product.stock
                                                    ) > 0
                                                            ? "text-gray-700"
                                                            : "text-red-600"
                                                        }`}
                                                >
                                                    📦 Stock:{" "}
                                                    {product.stock}
                                                </span>

                                            </div>

                                            {/* DESCRIPTION */}

                                            {product.description && (
                                                <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                                                    {
                                                        product.description
                                                    }
                                                </p>
                                            )}

                                            {/* ACTION BUTTONS */}
                                            <div className="grid grid-cols-3 gap-2 mt-5">

                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition"
                                                >
                                                    ✏️ Edit
                                                </button>

                                                <button
                                                    onClick={() => handleToggleActive(product)}
                                                    className={`text-white py-2.5 rounded-xl font-semibold transition ${product.is_active
                                                            ? "bg-orange-500 hover:bg-orange-600"
                                                            : "bg-green-600 hover:bg-green-700"
                                                        }`}
                                                >
                                                    {product.is_active ? "⏸️ Deactivate" : "▶️ Activate"}
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-semibold transition"
                                                >
                                                    🗑️ Delete
                                                </button>

                                            </div>

                                        </div>

                                    </div>
                                );
                            })}

                        </div>
                    )}

                </div>

            </div>

        </main>
    );
}

export default AdminDashboard;