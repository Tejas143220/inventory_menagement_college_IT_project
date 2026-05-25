"use client";

import { useEffect, useState } from "react";

export default function SupplierForm({ onSubmit, editingSupplier, cancelEdit }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        company: ""
    });

    useEffect(() => {
        if (editingSupplier) {
            setFormData({
                name: editingSupplier.name || "",
                email: editingSupplier.email || "",
                phone: editingSupplier.phone || "",
                address: editingSupplier.address || "",
                company: editingSupplier.company || ""
            });
        } else {
            setFormData({
                name: "",
                email: "",
                phone: "",
                address: "",
                company: ""
            });
        }
    }, [editingSupplier]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({
            name: "",
            email: "",
            phone: "",
            address: "",
            company: ""
        });
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-xl">
            <h2 className="text-xl font-extrabold mb-6 text-slate-100">
                {editingSupplier ? "✏️ Update Supplier Profile" : "➕ Register New Supplier"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Supplier Name *</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="e.g. Acme Corp Inc."
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                        required
                    />
                </div>

                {/* Company */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Company / Division Name *</label>
                    <input
                        type="text"
                        name="company"
                        placeholder="e.g. Brick Raw Materials LLC"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                        required
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address *</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="vendor@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                        required
                    />
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact Phone *</label>
                    <input
                        type="tel"
                        name="phone"
                        placeholder="e.g. 9876543210"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        title="Enter exactly 10 digits"
                        maxLength={10}
                        required
                    />
                    <p className="mt-2 text-xs text-slate-500">Enter exactly 10 digits with no spaces or symbols.</p>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Street Address *</label>
                    <textarea
                        name="address"
                        placeholder="Warehouse yard address, state, city..."
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                        rows="3"
                        required
                    />
                </div>

                {/* Buttons */}
                <div className="md:col-span-2 flex gap-4">
                    <button
                        type="submit"
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg active:scale-95"
                    >
                        {editingSupplier ? "Update Supplier" : "Register Supplier"}
                    </button>
                    {editingSupplier && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}