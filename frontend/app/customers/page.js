"use client";

import { useEffect, useState } from "react";
import API from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash, FaSearch, FaUserAlt, FaPhone, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [search, setSearch] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: ""
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await API.get("/customers");
            setCustomers(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load customer catalog");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await API.put(`/customers/${editingCustomer.id}`, formData);
                toast.success(`Customer "${formData.name}" updated successfully`);
                setEditingCustomer(null);
            } else {
                await API.post("/customers", formData);
                toast.success(`Customer "${formData.name}" added successfully`);
            }
            setFormData({ name: "", email: "", phone: "", address: "" });
            fetchCustomers();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Action failed");
        }
    };

    const editCustomer = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name || "",
            email: customer.email || "",
            phone: customer.phone || "",
            address: customer.address || ""
        });
    };

    const deleteCustomer = async (id) => {
        if (!confirm("Are you sure you want to delete this customer? This will also wipe its sales history!")) return;
        try {
            await API.delete(`/customers/${id}`);
            toast.success("Customer record removed successfully");
            fetchCustomers();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete customer");
        }
    };

    const filteredCustomers = customers.filter((customer) =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase())
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
                                <FaUserAlt className="text-indigo-500" /> Customer Registry
                            </h1>
                            <p className="text-slate-400 mt-2">
                                Register client directories, query contact nodes, and audit sales accounts.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative mt-4 md:mt-0">
                            <FaSearch className="absolute top-4 left-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 pr-4 py-3 w-72 rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 transition"
                            />
                        </div>
                    </div>

                    {/* Customer Form Panel */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-xl">
                        <h2 className="text-xl font-extrabold mb-6 text-slate-100">
                            {editingCustomer ? "✏️ Edit Customer Credentials" : "➕ Register New Client Profile"}
                        </h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="e.g. John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number *</label>
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="e.g. +91 99999 88888"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Street Address *</label>
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="e.g. 5th Cross Road, Industrial Zone"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 flex gap-4 mt-2">
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg active:scale-95"
                                >
                                    {editingCustomer ? "Update Customer Profile" : "Register Client"}
                                </button>
                                {editingCustomer && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingCustomer(null);
                                            setFormData({ name: "", email: "", phone: "", address: "" });
                                        }}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Customer Table */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="p-4">Customer Name</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Phone</th>
                                        <th className="p-4">Address</th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="text-center p-16 text-slate-400 font-semibold animate-pulse">
                                                Loading customer registry...
                                            </td>
                                        </tr>
                                    ) : filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center p-16 text-slate-500">
                                                No customers found in directory.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCustomers.map((customer) => (
                                            <tr key={customer.id} className="hover:bg-slate-800/30 transition">
                                                <td className="p-4 font-bold text-slate-200 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-bold uppercase">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    {customer.name}
                                                </td>
                                                <td className="p-4 text-indigo-400 font-medium font-mono text-sm">
                                                    <span className="flex items-center gap-2"><FaEnvelope className="text-slate-650" /> {customer.email}</span>
                                                </td>
                                                <td className="p-4 text-slate-300 font-mono text-sm">
                                                    <span className="flex items-center gap-2"><FaPhone className="text-slate-650" /> {customer.phone}</span>
                                                </td>
                                                <td className="p-4 text-slate-400 text-sm max-w-xs truncate">
                                                    <span className="flex items-center gap-2"><FaMapMarkerAlt className="text-slate-650" /> {customer.address}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <button
                                                            onClick={() => editCustomer(customer)}
                                                            className="bg-slate-800 hover:bg-slate-700 text-amber-400 p-2.5 rounded-xl transition"
                                                            title="Edit Customer Profile"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteCustomer(customer.id)}
                                                            className="bg-slate-800 hover:bg-slate-700 text-rose-500 p-2.5 rounded-xl transition"
                                                            title="Void Customer Profile"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
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
