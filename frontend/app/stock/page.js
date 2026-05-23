"use client";

import { useEffect, useState } from "react";
import API from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    FaBoxOpen,
    FaExclamationTriangle,
    FaExchangeAlt,
    FaWrench,
    FaHistory,
    FaListUl,
    FaBuilding
} from "react-icons/fa";

export default function StockManagement() {
    const [activeTab, setActiveTab] = useState("levels"); // levels, transfer, adjust, movements
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [transferForm, setTransferForm] = useState({
        product_id: "",
        from_warehouse_id: "",
        to_warehouse_id: "",
        quantity: ""
    });

    const [adjustForm, setAdjustForm] = useState({
        product_id: "",
        warehouse_id: "",
        stock: "",
        damaged_stock: "",
        description: ""
    });

    useEffect(() => {
        fetchAllStockData();
    }, []);

    const fetchAllStockData = async () => {
        try {
            setLoading(true);
            const [pRes, wRes, iRes, mRes] = await Promise.all([
                API.get("/products"),
                API.get("/warehouses"),
                API.get("/inventory"),
                API.get("/stock-movements")
            ]);
            setProducts(pRes.data);
            setWarehouses(wRes.data);
            setInventory(iRes.data);
            setMovements(mRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load stock data");
        } finally {
            setLoading(false);
        }
    };

    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        const { product_id, from_warehouse_id, to_warehouse_id, quantity } = transferForm;

        if (!product_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
            toast.error("Please fill in all transfer fields");
            return;
        }

        if (from_warehouse_id === to_warehouse_id) {
            toast.error("Source and destination warehouses must be different");
            return;
        }

        try {
            await API.post("/inventory/transfer", {
                product_id: parseInt(product_id, 10),
                from_warehouse_id: parseInt(from_warehouse_id, 10),
                to_warehouse_id: parseInt(to_warehouse_id, 10),
                quantity: parseInt(quantity, 10)
            });
            toast.success("Stock transferred successfully");
            setTransferForm({ product_id: "", from_warehouse_id: "", to_warehouse_id: "", quantity: "" });
            fetchAllStockData();
            setActiveTab("levels");
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Transfer failed");
        }
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        const { product_id, warehouse_id, stock, damaged_stock, description } = adjustForm;

        if (!product_id || !warehouse_id || stock === "") {
            toast.error("Product, Warehouse, and New Stock quantity are required");
            return;
        }

        try {
            await API.post("/inventory/adjust", {
                product_id: parseInt(product_id, 10),
                warehouse_id: parseInt(warehouse_id, 10),
                stock: parseInt(stock, 10),
                damaged_stock: parseInt(damaged_stock || 0, 10),
                description: description || ""
            });
            toast.success("Stock adjustment applied successfully");
            setAdjustForm({ product_id: "", warehouse_id: "", stock: "", damaged_stock: "", description: "" });
            fetchAllStockData();
            setActiveTab("levels");
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Adjustment failed");
        }
    };

    // Helper functions to get names
    const getProductName = (id) => {
        const prod = products.find((p) => p.id === id);
        return prod ? prod.name : `Product ID: ${id}`;
    };

    const getWarehouseName = (id) => {
        const wh = warehouses.find((w) => w.id === id);
        return wh ? wh.name : `Warehouse ID: ${id}`;
    };

    // Calculate low and out of stock items
    const lowStockItems = inventory.filter((item) => item.stock <= item.minimum_stock);
    const totalPhysicalBricks = inventory.reduce((sum, item) => sum + item.stock, 0);
    const totalDamagedBricks = inventory.reduce((sum, item) => sum + item.damaged_stock, 0);

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
            <Sidebar />
            <ToastContainer theme="dark" />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Navbar />

                <div className="flex-1 overflow-y-auto p-8 lg:px-12 scroll-smooth">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-100 flex items-center gap-3">
                                <FaBoxOpen className="text-indigo-500" /> Stock & Warehouse Control
                            </h1>
                            <p className="text-slate-400 mt-2">
                                Monitor physical inventories, perform warehouse transfers, and logs adjustments.
                            </p>
                        </div>
                    </div>

                    {/* Quick Analytics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl flex items-center justify-between">
                            <div>
                                <h3 className="text-slate-500 text-xs font-bold tracking-widest uppercase">Total Stock</h3>
                                <p className="text-3xl font-black mt-2 text-indigo-400">{loading ? "..." : totalPhysicalBricks.toLocaleString()} units</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                <FaBoxOpen />
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl flex items-center justify-between">
                            <div>
                                <h3 className="text-slate-500 text-xs font-bold tracking-widest uppercase">Damaged Inventory</h3>
                                <p className="text-3xl font-black mt-2 text-rose-500">{loading ? "..." : totalDamagedBricks.toLocaleString()} units</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <FaExclamationTriangle />
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl flex items-center justify-between">
                            <div>
                                <h3 className="text-slate-500 text-xs font-bold tracking-widest uppercase">Low Stock Alerts</h3>
                                <p className="text-3xl font-black mt-2 text-amber-500">{loading ? "..." : lowStockItems.length} records</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                                <FaExclamationTriangle />
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-800 mb-8">
                        <button
                            onClick={() => setActiveTab("levels")}
                            className={`px-6 py-3.5 font-bold text-sm flex items-center gap-2 border-b-2 transition ${
                                activeTab === "levels" ? "border-indigo-500 text-indigo-400 bg-slate-900/30" : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <FaListUl /> Stock Levels
                        </button>
                        <button
                            onClick={() => setActiveTab("transfer")}
                            className={`px-6 py-3.5 font-bold text-sm flex items-center gap-2 border-b-2 transition ${
                                activeTab === "transfer" ? "border-indigo-500 text-indigo-400 bg-slate-900/30" : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <FaExchangeAlt /> Warehouse Transfer
                        </button>
                        <button
                            onClick={() => setActiveTab("adjust")}
                            className={`px-6 py-3.5 font-bold text-sm flex items-center gap-2 border-b-2 transition ${
                                activeTab === "adjust" ? "border-indigo-500 text-indigo-400 bg-slate-900/30" : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <FaWrench /> Manual Adjustment
                        </button>
                        <button
                            onClick={() => setActiveTab("movements")}
                            className={`px-6 py-3.5 font-bold text-sm flex items-center gap-2 border-b-2 transition ${
                                activeTab === "movements" ? "border-indigo-500 text-indigo-400 bg-slate-900/30" : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <FaHistory /> Audit Log
                        </button>
                    </div>

                    {/* Tab Panels */}
                    {activeTab === "levels" && (
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-slate-850 flex justify-between items-center bg-slate-900/20">
                                <h3 className="font-extrabold text-slate-200">Live Warehouse inventory Records</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-xs">
                                        <tr>
                                            <th className="p-4">Product Name</th>
                                            <th className="p-4">Warehouse Location</th>
                                            <th className="p-4 text-right">Available Stock</th>
                                            <th className="p-4 text-right">Damaged Stock</th>
                                            <th className="p-4 text-right">Min stock limit</th>
                                            <th className="p-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="6" className="text-center p-10 text-slate-400 animate-pulse">Loading stock records...</td>
                                            </tr>
                                        ) : inventory.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center p-10 text-slate-500">No records found. Setup inventory by registering products or warehouses.</td>
                                            </tr>
                                        ) : (
                                            inventory.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-800/25 transition">
                                                    <td className="p-4 font-bold text-slate-200">
                                                        {getProductName(item.product_id)}
                                                    </td>
                                                    <td className="p-4 text-slate-400 font-medium flex items-center gap-2">
                                                        <FaBuilding className="text-slate-600" /> {getWarehouseName(item.warehouse_id)}
                                                    </td>
                                                    <td className="p-4 text-right font-mono font-bold text-indigo-400">
                                                        {item.stock.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-rose-500">
                                                        {item.damaged_stock.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-slate-500">
                                                        {item.minimum_stock.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span
                                                            className={`px-3 py-1 rounded-full font-bold text-xs ${
                                                                item.stock === 0
                                                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                                                    : item.stock <= item.minimum_stock
                                                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                            }`}
                                                        >
                                                            {item.stock === 0 ? "Out of Stock" : item.stock <= item.minimum_stock ? "Low Stock" : "Healthy"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "transfer" && (
                        <div className="max-w-2xl bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-xl">
                            <h3 className="text-xl font-extrabold text-slate-100 mb-6 flex items-center gap-2">
                                <FaExchangeAlt className="text-indigo-400" /> Stock Transfer
                            </h3>
                            <form onSubmit={handleTransferSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Product</label>
                                    <select
                                        value={transferForm.product_id}
                                        onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500"
                                        required
                                    >
                                        <option value="">-- Choose Product --</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name} (Available: {p.quantity})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Source Warehouse (From)</label>
                                        <select
                                            value={transferForm.from_warehouse_id}
                                            onChange={(e) => setTransferForm({ ...transferForm, from_warehouse_id: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500"
                                            required
                                        >
                                            <option value="">-- Select Source --</option>
                                            {warehouses.map((w) => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Destination Warehouse (To)</label>
                                        <select
                                            value={transferForm.to_warehouse_id}
                                            onChange={(e) => setTransferForm({ ...transferForm, to_warehouse_id: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500"
                                            required
                                        >
                                            <option value="">-- Select Destination --</option>
                                            {warehouses.map((w) => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transfer Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Enter units count"
                                        value={transferForm.quantity}
                                        onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg active:scale-95"
                                >
                                    Authorize Stock Transfer
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === "adjust" && (
                        <div className="max-w-2xl bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-xl">
                            <h3 className="text-xl font-extrabold text-slate-100 mb-6 flex items-center gap-2">
                                <FaWrench className="text-indigo-400" /> Manual Stock Adjustment
                            </h3>
                            <form onSubmit={handleAdjustSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Product Name</label>
                                        <select
                                            value={adjustForm.product_id}
                                            onChange={(e) => setAdjustForm({ ...adjustForm, product_id: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500"
                                            required
                                        >
                                            <option value="">-- Select Product --</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Warehouse Location</label>
                                        <select
                                            value={adjustForm.warehouse_id}
                                            onChange={(e) => setAdjustForm({ ...adjustForm, warehouse_id: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500"
                                            required
                                        >
                                            <option value="">-- Choose Warehouse --</option>
                                            {warehouses.map((w) => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Healthy Stock Quantity</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Healthy unit count"
                                            value={adjustForm.stock}
                                            onChange={(e) => setAdjustForm({ ...adjustForm, stock: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Damaged Stock Quantity</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Damaged unit count"
                                            value={adjustForm.damaged_stock}
                                            onChange={(e) => setAdjustForm({ ...adjustForm, damaged_stock: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reason for Adjustment</label>
                                    <textarea
                                        placeholder="Provide explanation (e.g. Audit variance, broken bricks in yard etc.)"
                                        value={adjustForm.description}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500"
                                        rows="3"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg active:scale-95"
                                >
                                    Apply Stock Adjustment
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === "movements" && (
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-slate-850 flex justify-between items-center bg-slate-900/20">
                                <h3 className="font-extrabold text-slate-200">Stock Movements History</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-xs">
                                        <tr>
                                            <th className="p-4">Timestamp</th>
                                            <th className="p-4">Product</th>
                                            <th className="p-4">Movement Type</th>
                                            <th className="p-4 text-right">Adjustment Qty</th>
                                            <th className="p-4">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="text-center p-10 text-slate-400 animate-pulse">Loading logs...</td>
                                            </tr>
                                        ) : movements.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center p-10 text-slate-500">No stock movements logged.</td>
                                            </tr>
                                        ) : (
                                            movements.map((move) => (
                                                <tr key={move.id} className="hover:bg-slate-800/25 transition">
                                                    <td className="p-4 text-xs text-slate-500 font-semibold font-mono">
                                                        {new Date(move.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 font-bold text-slate-200">
                                                        {getProductName(move.product_id)}
                                                    </td>
                                                    <td className="p-4">
                                                        <span
                                                            className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                                                                move.type === "purchase"
                                                                    ? "bg-blue-500/10 text-blue-400"
                                                                    : move.type === "sale"
                                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                                    : move.type === "transfer"
                                                                    ? "bg-purple-500/10 text-purple-400"
                                                                    : "bg-amber-500/10 text-amber-400"
                                                            }`}
                                                        >
                                                            {move.type}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className={`p-4 text-right font-mono font-bold ${
                                                            move.quantity > 0 ? "text-emerald-400" : "text-rose-500"
                                                        }`}
                                                    >
                                                        {move.quantity > 0 ? `+${move.quantity}` : move.quantity}
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-400 font-medium">
                                                        {move.description}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
