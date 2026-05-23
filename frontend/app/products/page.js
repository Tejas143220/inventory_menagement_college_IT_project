"use client";

import { useEffect, useState } from "react";
import API from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import ProductForm from "../../components/ProductForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash, FaSearch, FaBox } from "react-icons/fa";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await API.get("/products");
            setProducts(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await API.get("/categories");
            setCategories(res.data);
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    // Add Product & Upload Image if present
    const handleAddProduct = async (payload, file) => {
        try {
            const res = await API.post("/products", payload);
            const newProduct = res.data;

            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                await API.post(`/products/${newProduct.id}/image`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            toast.success(`Product "${newProduct.name}" created successfully`);
            fetchProducts();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Failed to create product");
        }
    };

    // Update Product & Upload Image if present
    const handleUpdateProduct = async (payload, file) => {
        try {
            const res = await API.put(`/products/${editingProduct.id}`, payload);
            const updatedProduct = res.data;

            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                await API.post(`/products/${updatedProduct.id}/image`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            toast.success(`Product "${updatedProduct.name}" updated successfully`);
            setEditingProduct(null);
            fetchProducts();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Failed to update product");
        }
    };

    const deleteProduct = async (id) => {
        if (!confirm("Are you sure you want to permanently delete this product? This will also wipe its transaction history!")) return;
        try {
            await API.delete(`/products/${id}`);
            toast.success("Product deleted successfully");
            fetchProducts();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Failed to delete product");
        }
    };

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            <Sidebar />
            <ToastContainer theme="dark" />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Navbar />

                <div className="flex-1 overflow-y-auto p-8 lg:px-12 scroll-smooth">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-100 flex items-center gap-3">
                                <FaBox className="text-indigo-500" /> Product Inventory Catalog
                            </h1>
                            <p className="text-slate-400 mt-2">
                                Register brick specifications, barcode bindings, cost pricing, and sales prices.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative mt-4 md:mt-0">
                            <FaSearch className="absolute top-4 left-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search by name or SKU..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 pr-4 py-3 w-72 rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 transition"
                            />
                        </div>
                    </div>

                    {/* Form Panel */}
                    <ProductForm
                        onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
                        editingProduct={editingProduct}
                        cancelEdit={() => setEditingProduct(null)}
                    />

                    {/* Table View */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="p-4">Image</th>
                                        <th className="p-4">Name / SKU</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4 text-right">Cost Price (₹)</th>
                                        <th className="p-4 text-right">Selling Price (₹)</th>
                                        <th className="p-4 text-center">Live Stock</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="text-center p-16 text-slate-400 font-semibold animate-pulse">
                                                Loading product catalog...
                                            </td>
                                        </tr>
                                    ) : filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center p-16 text-slate-500">
                                                No products found in the catalog.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map((product) => {
                                            const cat = categories.find((c) => c.id === product.category_id);
                                            return (
                                                <tr
                                                    key={product.id}
                                                    className={`hover:bg-slate-800/30 transition-all ${editingProduct?.id === product.id ? "bg-indigo-500/10" : ""}`}
                                                >
                                                    {/* Image */}
                                                    <td className="p-4">
                                                        <img
                                                            src={
                                                                product.image
                                                                    ? (product.image.startsWith("http") ? product.image : `http://localhost:8000${product.image}`)
                                                                    : "https://via.placeholder.com/60?text=Brick"
                                                            }
                                                            alt="product preview"
                                                            className="w-14 h-14 rounded-xl object-cover border border-slate-800 bg-slate-950"
                                                        />
                                                    </td>

                                                    {/* Name / SKU */}
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-100">{product.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono mt-1">SKU: {product.sku}</div>
                                                        {product.barcode && <div className="text-[10px] text-slate-600 font-mono mt-0.5">BC: {product.barcode}</div>}
                                                    </td>

                                                    {/* Category */}
                                                    <td className="p-4 text-slate-300">
                                                        {cat ? cat.name : "Uncategorized"}
                                                    </td>

                                                    {/* Cost Price */}
                                                    <td className="p-4 text-right font-mono font-semibold text-rose-400">
                                                        ₹{product.purchase_price.toFixed(2)}
                                                    </td>

                                                    {/* Selling Price */}
                                                    <td className="p-4 text-right font-mono font-semibold text-emerald-400">
                                                        ₹{product.price.toFixed(2)}
                                                    </td>

                                                    {/* Quantity */}
                                                    <td className="p-4 text-center">
                                                        <span
                                                            className={`px-3 py-1 rounded-full font-black text-xs ${
                                                                product.quantity === 0
                                                                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                                                                    : product.quantity <= 100
                                                                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                                                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                                            }`}
                                                        >
                                                            {product.quantity}
                                                        </span>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="p-4">
                                                        <span
                                                            className={`text-xs font-bold ${
                                                                product.status === "active"
                                                                    ? "text-emerald-400"
                                                                    : "text-slate-500"
                                                            }`}
                                                        >
                                                            ● {product.status === "active" ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="p-4 text-center">
                                                        <div className="flex gap-2.5 justify-center">
                                                            <button
                                                                onClick={() => setEditingProduct(product)}
                                                                className="bg-slate-800 hover:bg-slate-700 text-amber-400 p-2.5 rounded-xl transition"
                                                                title="Edit specifications"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteProduct(product.id)}
                                                                className="bg-slate-800 hover:bg-slate-700 text-rose-500 p-2.5 rounded-xl transition"
                                                                title="Delete item"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}