"use client";

import { useEffect, useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

export default function ProductForm({ onSubmit, editingProduct, cancelEdit }) {
    const [categories, setCategories] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        sku: "",
        barcode: "",
        price: "",
        purchase_price: "",
        status: "active",
        category_id: "",
        image: ""
    });

    useEffect(() => {
        if (editingProduct) {
            setFormData({
                name: editingProduct.name || "",
                description: editingProduct.description || "",
                sku: editingProduct.sku || "",
                barcode: editingProduct.barcode || "",
                price: editingProduct.price || "",
                purchase_price: editingProduct.purchase_price || "",
                status: editingProduct.status || "active",
                category_id: editingProduct.category_id || "",
                image: editingProduct.image || ""
            });
            setImagePreview(editingProduct.image || "");
            setSelectedFile(null);
        } else {
            // Generate a random SKU for ease of use
            const randomSKU = "FAB-" + Math.floor(100000 + Math.random() * 900000);
            setFormData({
                name: "",
                description: "",
                sku: randomSKU,
                barcode: "",
                price: "",
                purchase_price: "",
                status: "active",
                category_id: "",
                image: ""
            });
            setImagePreview("");
            setSelectedFile(null);
        }
    }, [editingProduct]);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await API.get("/categories");
                setCategories(res.data);
            } catch (error) {
                console.error("Failed to load categories", error);
            }
        }
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.sku || !formData.price || !formData.purchase_price || !formData.category_id) {
            toast.error("Please fill in all required fields (Name, SKU, Selling Price, Cost Price, Category)");
            return;
        }

        const payload = {
            ...formData,
            price: parseFloat(formData.price),
            purchase_price: parseFloat(formData.purchase_price),
            category_id: parseInt(formData.category_id, 10),
            // Don't send file data URI in JSON
            image: selectedFile ? "" : formData.image
        };

        // Pass payload and selected file up to the parent page
        onSubmit(payload, selectedFile);

        // Reset if not editing
        if (!editingProduct) {
            const randomSKU = "FAB-" + Math.floor(100000 + Math.random() * 900000);
            setFormData({
                name: "",
                description: "",
                sku: randomSKU,
                barcode: "",
                price: "",
                purchase_price: "",
                status: "active",
                category_id: "",
                image: ""
            });
            setImagePreview("");
            setSelectedFile(null);
        }
    };

    return (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 mb-8 shadow-xl">
            <h2 className="text-xl font-extrabold text-slate-100 mb-6">
                {editingProduct ? "✏️ Edit Product Details" : "📦 Add New Product"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Product Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Fly Ash Brick - Standard Size"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category *</label>
                        <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                            required
                        >
                            <option value="">-- Select Category --</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* SKU */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SKU (Unique Identifier) *</label>
                        <input
                            type="text"
                            name="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            placeholder="e.g. FAB-100200"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                            required
                        />
                    </div>

                    {/* Barcode */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Barcode (optional)</label>
                        <input
                            type="text"
                            name="barcode"
                            value={formData.barcode}
                            onChange={handleChange}
                            placeholder="e.g. 890123456789"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                        />
                    </div>

                    {/* Purchase Price */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cost/Purchase Price (₹) *</label>
                        <input
                            type="number"
                            step="0.01"
                            name="purchase_price"
                            value={formData.purchase_price}
                            onChange={handleChange}
                            placeholder="Cost price per unit"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                            required
                        />
                    </div>

                    {/* Selling Price */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selling Price (₹) *</label>
                        <input
                            type="number"
                            step="0.01"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="Selling price per unit"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Product detailed description..."
                            rows="2"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Image Source */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Upload Image File</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 outline-none focus:border-indigo-500 transition text-sm cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Or Image URL</label>
                            <input
                                type="text"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                placeholder="Paste image link"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative group">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedFile(null);
                                setFormData((prev) => ({ ...prev, image: "" }));
                                setImagePreview("");
                            }}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 font-bold transition text-xs"
                        >
                            Remove
                        </button>
                    </div>
                )}

                {/* Form Buttons */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg hover:shadow-indigo-500/20 active:scale-95"
                    >
                        {editingProduct ? "Update Product" : "Create Product"}
                    </button>
                    {editingProduct && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition active:scale-95"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}