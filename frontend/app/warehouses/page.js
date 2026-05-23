"use client";

import { useEffect, useState } from "react";
import API from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { FaBuilding, FaExclamationCircle, FaPlus, FaWarehouse } from "react-icons/fa";

export default function Warehouses() {
    const [warehouses, setWarehouses] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // Form state for Warehouse
    const [formData, setFormData] = useState({
        name: "",
        location: "",
        manager: "",
        capacity: ""
    });

    const [inventoryFormData, setInventoryFormData] = useState({
        product_id: "",
        warehouse_id: "",
        stock: "",
        minimum_stock: ""
    });
    const [editingInventory, setEditingInventory] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [whRes, invRes, prodRes, supRes] = await Promise.all([
                API.get("/warehouses"),
                API.get("/inventory"),
                API.get("/products"),
                API.get("/suppliers")
            ]);
            setWarehouses(whRes.data);
            setInventory(invRes.data);
            setProducts(prodRes.data);
            setSuppliers(supRes.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
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
            await API.post("/warehouses", formData);
            setFormData({ name: "", location: "", manager: "", capacity: "" });
            fetchData();
        } catch (error) {
            alert(error?.response?.data?.detail || "An error occurred");
        }
    };

    const handleInventoryChange = (e) => {
        setInventoryFormData({ ...inventoryFormData, [e.target.name]: e.target.value });
    };

    const handleInventorySubmit = async (e) => {
        e.preventDefault();
        const payload = {
            product_id: parseInt(inventoryFormData.product_id, 10),
            warehouse_id: parseInt(inventoryFormData.warehouse_id, 10),
            stock: parseInt(inventoryFormData.stock, 10),
            minimum_stock: parseInt(inventoryFormData.minimum_stock, 10)
        };

        try {
            if (editingInventory) {
                await API.put(`/inventory/${editingInventory.id}`, payload);
                setEditingInventory(null);
            } else {
                await API.post("/inventory", payload);
            }
            setInventoryFormData({ product_id: "", warehouse_id: "", stock: "", minimum_stock: "" });
            fetchData();
        } catch (error) {
            alert(error?.response?.data?.detail || "An error occurred while saving inventory");
        }
    };

    const editInventory = (item) => {
        setEditingInventory(item);
        setInventoryFormData({
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            stock: item.stock,
            minimum_stock: item.minimum_stock
        });
    };

    const deleteInventory = async (id) => {
        if (!confirm("Delete this inventory record?")) return;
        try {
            await API.delete(`/inventory/${id}`);
            fetchData();
        } catch (error) {
            alert(error?.response?.data?.detail || "Unable to delete inventory record");
        }
    };

    // Calculate which warehouses need to order new stock
    const getWarehouseNeeds = (warehouseId) => {
        const whInventory = inventory.filter(inv => inv.warehouse_id === warehouseId);
        const needsRestock = whInventory.filter(inv => inv.stock <= inv.minimum_stock);
        return {
            totalItems: whInventory.length,
            needsRestock: needsRestock.length,
            items: needsRestock.map(inv => {
                const p = products.find(prod => prod.id === inv.product_id);
                return { ...inv, productName: p ? p.name : `Product #${inv.product_id}` };
            })
        };
    };

    const filteredWarehouses = warehouses.filter(w => 
        w.name.toLowerCase().includes(search.toLowerCase()) || 
        w.location.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1">
                <Navbar />
                <div className="p-6 max-w-7xl mx-auto">
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-800 flex items-center gap-3">
                                <FaBuilding className="text-teal-600" /> Warehouse Operations
                            </h1>
                            <p className="text-slate-500 mt-2">Manage warehouses and monitor restock requirements.</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <input
                                type="text"
                                placeholder="Search Warehouses..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="px-4 py-3 w-64 rounded-xl border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        
                        {/* Warehouse List */}
                        <div className="lg:col-span-2 space-y-6">
                            {loading ? (
                                <p className="text-center p-10 text-slate-500">Loading...</p>
                            ) : filteredWarehouses.length === 0 ? (
                                <p className="text-center p-10 text-slate-500 bg-white rounded-2xl shadow">No warehouses found.</p>
                            ) : (
                                filteredWarehouses.map(wh => {
                                    const stats = getWarehouseNeeds(wh.id);
                                    
                                    return (
                                        <div key={wh.id} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden hover:shadow-lg transition">
                                            <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 border-b">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                                        <FaWarehouse className="text-slate-400" /> {wh.name}
                                                    </h2>
                                                    <p className="text-sm text-slate-500 mt-1">Location: {wh.location} • Manager: {wh.manager}</p>
                                                </div>
                                                <div className="mt-4 md:mt-0 text-right">
                                                    <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full">
                                                        Capacity: {wh.capacity}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="p-6">
                                                {stats.needsRestock > 0 ? (
                                                    <div>
                                                        <div className="flex items-center gap-2 text-rose-600 font-bold mb-4">
                                                            <FaExclamationCircle /> 
                                                            <span>Action Required: Restock Needed ({stats.needsRestock} Items)</span>
                                                        </div>
                                                        <div className="grid sm:grid-cols-2 gap-4">
                                                            {stats.items.map(item => (
                                                                <div key={item.id} className="p-3 border border-rose-200 bg-rose-50 rounded-lg flex justify-between items-center">
                                                                    <span className="font-semibold text-slate-800">{item.productName}</span>
                                                                    <div className="text-right text-xs">
                                                                        <p className="text-rose-600 font-bold">Stock: {item.stock}</p>
                                                                        <p className="text-slate-500">Min: {item.minimum_stock}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-emerald-600 font-bold flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                        Inventory Levels Stable
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Add Warehouse Form */}
                        <div>
                            <div className="bg-white shadow-xl rounded-2xl p-6 sticky top-6">
                                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <FaPlus className="text-teal-600" /> Add New Warehouse
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-1">Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-1">Location</label>
                                        <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-1">Manager Name</label>
                                        <input type="text" name="manager" value={formData.manager} onChange={handleChange} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required />
                                        <label className="block text-xs text-slate-400 mt-2">Or pick an existing supplier as manager</label>
                                        <select className="w-full mt-2 border p-2 rounded-lg bg-white" onChange={(e) => setFormData({ ...formData, manager: e.target.value })}>
                                            <option value="">-- Select Supplier (optional) --</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.name}>{s.name} ({s.company || 'Supplier'})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-1">Capacity (Sq Ft / Units)</label>
                                        <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required />
                                    </div>
                                    <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition duration-300 shadow-md">
                                        Create Warehouse
                                    </button>
                                </form>
                            </div>
                        </div>

                    </div>

                    <div className="mt-10 bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="p-6 border-b bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Warehouse Inventory Records</h2>
                                <p className="text-slate-500 mt-1">Create stock records per warehouse, update available quantities, and delete outdated entries.</p>
                            </div>
                        </div>
                        <div className="p-6 grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-800 text-white">
                                            <tr>
                                                <th className="p-4">Product</th>
                                                <th className="p-4">Warehouse</th>
                                                <th className="p-4 text-center">Stock</th>
                                                <th className="p-4 text-center">Minimum Stock</th>
                                                <th className="p-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventory.length === 0 ? (
                                                <tr><td colSpan="5" className="p-6 text-center text-slate-500">No inventory records available.</td></tr>
                                            ) : (
                                                inventory.map(item => {
                                                    const product = products.find(p => p.id === item.product_id);
                                                    const warehouse = warehouses.find(w => w.id === item.warehouse_id);
                                                    return (
                                                        <tr key={item.id} className="border-b hover:bg-slate-50 transition">
                                                            <td className="p-4 font-semibold text-slate-800">{product?.name || `Product #${item.product_id}`}</td>
                                                            <td className="p-4 text-slate-600">{warehouse?.name || `Warehouse #${item.warehouse_id}`}</td>
                                                            <td className="p-4 text-center font-bold text-slate-800">{item.stock}</td>
                                                            <td className="p-4 text-center text-slate-600">{item.minimum_stock}</td>
                                                            <td className="p-4 flex flex-wrap gap-2">
                                                                <button onClick={() => editInventory(item)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg">Edit</button>
                                                                <button onClick={() => deleteInventory(item.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg">Delete</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div>
                                <div className="bg-slate-50 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-xl font-bold text-slate-800 mb-4">{editingInventory ? "Update Inventory" : "Add Inventory"}</h3>
                                    <form onSubmit={handleInventorySubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-600 mb-1">Product</label>
                                            <select name="product_id" value={inventoryFormData.product_id} onChange={handleInventoryChange} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 bg-white" required>
                                                <option value="" disabled>Select Product</option>
                                                {products.map(prod => (
                                                    <option key={prod.id} value={prod.id}>{prod.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-600 mb-1">Warehouse</label>
                                            <select name="warehouse_id" value={inventoryFormData.warehouse_id} onChange={handleInventoryChange} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 bg-white" required>
                                                <option value="" disabled>Select Warehouse</option>
                                                {warehouses.map(wh => (
                                                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-600 mb-1">Stock Quantity</label>
                                            <input type="number" name="stock" value={inventoryFormData.stock} onChange={handleInventoryChange} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 bg-white" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-600 mb-1">Minimum Stock</label>
                                            <input type="number" name="minimum_stock" value={inventoryFormData.minimum_stock} onChange={handleInventoryChange} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 bg-white" required />
                                        </div>
                                        <div className="flex gap-3">
                                            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition">{editingInventory ? "Update Record" : "Add Stock Record"}</button>
                                            {editingInventory && (
                                                <button type="button" onClick={() => { setEditingInventory(null); setInventoryFormData({ product_id: "", warehouse_id: "", stock: "", minimum_stock: "" }); }} className="w-full bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition">Cancel</button>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
