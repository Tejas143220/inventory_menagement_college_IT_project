"use client";

import { useEffect, useState } from "react";
import API from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import SupplierForm from "../../components/SupplierForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FaEdit,
    FaTrash,
    FaSearch,
    FaBuilding,
    FaEnvelope,
    FaPhone,
    FaUserTie
} from "react-icons/fa";

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const res = await API.get("/suppliers");
            setSuppliers(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load suppliers");
        } finally {
            setLoading(false);
        }
    };

    const addSupplier = async (data) => {
        try {
            const res = await API.post("/suppliers", data);
            toast.success(`Supplier "${res.data.name}" added successfully`);
            fetchSuppliers();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Failed to add supplier");
        }
    };

    const updateSupplier = async (data) => {
        try {
            const res = await API.put(`/suppliers/${editingSupplier.id}`, data);
            toast.success(`Supplier "${res.data.name}" updated successfully`);
            setEditingSupplier(null);
            fetchSuppliers();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Failed to update supplier");
        }
    };

    const deleteSupplier = async (id) => {
        if (!confirm("Are you sure you want to delete this supplier? This will also wipe its linked purchase history!")) return;
        try {
            await API.delete(`/suppliers/${id}`);
            toast.success("Supplier deleted successfully");
            fetchSuppliers();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Failed to delete supplier");
        }
    };

    const filteredSuppliers = suppliers.filter((supplier) =>
        supplier.name.toLowerCase().includes(search.toLowerCase()) ||
        supplier.company.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
            <Sidebar />
            <ToastContainer theme="dark" />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Navbar />

                <div className="flex-1 overflow-y-auto p-8 lg:px-12 scroll-smooth">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-100 flex items-center gap-3">
                                <FaUserTie className="text-indigo-500" /> Supplier Directory
                            </h1>
                            <p className="text-slate-400 mt-2">
                                Register raw material suppliers, manage companies, and query contact registries.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative mt-4 md:mt-0">
                            <FaSearch className="absolute top-4 left-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search by name or company..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 pr-4 py-3 w-72 rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 transition"
                            />
                        </div>
                    </div>

                    {/* Supplier Form */}
                    <SupplierForm
                        onSubmit={editingSupplier ? updateSupplier : addSupplier}
                        editingSupplier={editingSupplier}
                        cancelEdit={() => setEditingSupplier(null)}
                    />

                    {/* Supplier Cards */}
                    {loading ? (
                        <div className="text-center py-20 text-slate-400 animate-pulse font-semibold">
                            Loading supplier catalog...
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-10 text-center text-slate-500">
                            No matching suppliers found in directory.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredSuppliers.map((supplier) => (
                                <div
                                    key={supplier.id}
                                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Card Top */}
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xl">
                                                <FaUserTie />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingSupplier(supplier)}
                                                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 p-2.5 rounded-xl transition"
                                                    title="Edit supplier details"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => deleteSupplier(supplier.id)}
                                                    className="bg-slate-800 hover:bg-slate-700 text-rose-500 p-2.5 rounded-xl transition"
                                                    title="Delete supplier"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Supplier details */}
                                        <h2 className="text-xl font-bold text-slate-100 mb-4">{supplier.name}</h2>
                                        <div className="space-y-3.5 text-sm text-slate-400">
                                            <div className="flex items-center gap-3">
                                                <FaBuilding className="text-indigo-400 shrink-0" />
                                                <span className="truncate">{supplier.company}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <FaEnvelope className="text-indigo-400 shrink-0" />
                                                <span className="truncate">{supplier.email}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <FaPhone className="text-indigo-400 shrink-0" />
                                                <span>{supplier.phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {supplier.address && (
                                        <div className="border-t border-slate-850 mt-5 pt-4 text-xs text-slate-500 line-clamp-2">
                                            {supplier.address}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}