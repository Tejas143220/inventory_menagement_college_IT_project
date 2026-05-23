"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FaPlus,
    FaTrash,
    FaFileInvoice,
    FaSearch,
    FaCalculator,
    FaTruck,
    FaWarehouse
} from "react-icons/fa";

export default function Purchases() {
    const router = useRouter();
    const [purchases, setPurchases] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Form fields
    const [supplierId, setSupplierId] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [taxAmount, setTaxAmount] = useState("");
    const [status, setStatus] = useState("completed");
    const [items, setItems] = useState([
        { product_id: "", quantity: "", unit_price: "" }
    ]);

    useEffect(() => {
        fetchPurchases();
        fetchProducts();
        fetchSuppliers();
        fetchWarehouses();
        generateAutoInvoiceNumber();
    }, []);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const res = await API.get("/purchases");
            setPurchases(res.data);
        } catch (error) {
            console.error("Error fetching purchases", error);
            toast.error("Failed to load purchases history");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await API.get("/products");
            setProducts(res.data);
        } catch (error) {
            console.error("Error fetching products", error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await API.get("/suppliers");
            setSuppliers(res.data);
        } catch (error) {
            console.error("Error fetching suppliers", error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const res = await API.get("/warehouses");
            setWarehouses(res.data);
        } catch (error) {
            console.error("Error fetching warehouses", error);
        }
    };

    const generateAutoInvoiceNumber = () => {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const randPart = Math.floor(1000 + Math.random() * 9000);
        setInvoiceNumber(`INV-PUR-${datePart}-${randPart}`);
    };

    // Item line changes
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        // Auto populate cost/purchase price
        if (field === "product_id" && value !== "") {
            const selectedProd = products.find(p => p.id === parseInt(value, 10));
            if (selectedProd) {
                newItems[index].unit_price = selectedProd.purchase_price || selectedProd.price;
            }
        }
        setItems(newItems);
    };

    const addRow = () => {
        setItems([...items, { product_id: "", quantity: "", unit_price: "" }]);
    };

    const removeRow = (index) => {
        if (items.length === 1) {
            toast.warning("A purchase order must contain at least one line item");
            return;
        }
        setItems(items.filter((_, i) => i !== index));
    };

    // Calculations
    const subtotal = items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.unit_price) || 0;
        return sum + (qty * rate);
    }, 0);

    const calculatedTax = subtotal * 0.18;
    const effectiveTax = taxAmount !== "" ? parseFloat(taxAmount) : calculatedTax;
    const totalAmount = subtotal + effectiveTax;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!supplierId) return toast.error("Please select a supplier");
        if (!warehouseId) return toast.error("Please select a storage warehouse");
        if (!invoiceNumber) return toast.error("Invoice number is required");

        // Validate items
        const validatedItems = [];
        for (let i = 0; i < items.length; i++) {
            const row = items[i];
            if (!row.product_id || !row.quantity || !row.unit_price) {
                return toast.error(`Please complete row #${i + 1}`);
            }
            validatedItems.push({
                product_id: parseInt(row.product_id, 10),
                quantity: parseInt(row.quantity, 10),
                unit_price: parseFloat(row.unit_price)
            });
        }

        const payload = {
            supplier_id: parseInt(supplierId, 10),
            warehouse_id: parseInt(warehouseId, 10),
            invoice_number: invoiceNumber,
            tax_amount: parseFloat(effectiveTax.toFixed(2)),
            status,
            items: validatedItems
        };

        try {
            const res = await API.post("/purchases", payload);
            toast.success("Purchase order recorded successfully");

            // Reset form
            setSupplierId("");
            setWarehouseId("");
            setTaxAmount("");
            setItems([{ product_id: "", quantity: "", unit_price: "" }]);
            generateAutoInvoiceNumber();

            fetchPurchases();
            router.push(`/purchases/invoice?id=${res.data.id}`);
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Failed to process purchase");
        }
    };

    const deletePurchase = async (id) => {
        if (!confirm("Delete this purchase invoice? This will deduct the imported stock levels automatically!")) return;
        try {
            await API.delete(`/purchases/${id}`);
            toast.success("Purchase invoice record deleted");
            fetchPurchases();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Delete failed");
        }
    };

    const filteredPurchases = purchases.filter((purchase) =>
        purchase.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        String(purchase.id).includes(search)
    );

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
                                <FaTruck className="text-indigo-500" /> Purchases & Intake Control
                            </h1>
                            <p className="text-slate-400 mt-2">
                                Record raw material or brick supply acquisitions, adjust stock levels automatically, and log vendor bills.
                            </p>
                        </div>
                        <div className="relative">
                            <FaSearch className="absolute top-4 left-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search Invoice / Purchase ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 pr-4 py-3 w-72 rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 transition"
                            />
                        </div>
                    </div>

                    {/* Purchase order creation */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 mb-10 shadow-xl">
                        <h2 className="text-xl font-extrabold text-slate-100 mb-6 flex items-center gap-2">
                            📥 Record Supplier Intake Bill
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Supplier Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Supplier *</label>
                                    <select
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                        required
                                    >
                                        <option value="">-- Choose Supplier --</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} {s.gst_number ? `(GST: ${s.gst_number})` : ""}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Storage Warehouse */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Storage Warehouse *</label>
                                    <select
                                        value={warehouseId}
                                        onChange={(e) => setWarehouseId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                        required
                                    >
                                        <option value="">-- Select Destination --</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Invoice number */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Invoice Number *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition text-sm"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={generateAutoInvoiceNumber}
                                            className="px-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 transition"
                                        >
                                            Auto
                                        </button>
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Order Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                    >
                                        <option value="completed">Completed / Received</option>
                                        <option value="pending">Pending Receipt</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row Items Grid */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider">Line Items</h3>
                                <div className="space-y-3">
                                    {items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                                            {/* Product Column */}
                                            <div className="sm:col-span-5">
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Product *</label>
                                                <select
                                                    value={item.product_id}
                                                    onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500 text-sm"
                                                    required
                                                >
                                                    <option value="">-- Select Product --</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Quantity Column */}
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Qty *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                    placeholder="Count"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500 text-sm font-mono text-right"
                                                    required
                                                />
                                            </div>

                                            {/* Unit Price Column */}
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cost Price (₹) *</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                                                    placeholder="Rate"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500 text-sm font-mono text-right"
                                                    required
                                                />
                                            </div>

                                            {/* Line Total */}
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase">Total (₹)</label>
                                                <div className="bg-slate-950/70 border border-slate-850 px-3 py-2 rounded-xl text-slate-400 font-mono text-sm text-right">
                                                    {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="sm:col-span-1 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(index)}
                                                    className="p-3.5 bg-slate-900 hover:bg-rose-500/10 text-rose-500 rounded-xl border border-slate-800 hover:border-rose-500/20 transition"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition mt-2"
                                >
                                    <FaPlus /> Add Line Item
                                </button>
                            </div>

                            {/* Totals Section */}
                            <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900/10 p-6 rounded-2xl">
                                <div className="space-y-2 text-slate-400 text-sm">
                                    <p>⚡ <span className="font-bold">GST Notice:</span> standard purchase GST rate defaults to 18%.</p>
                                    <p>📊 <span className="font-bold">Calculated GST:</span> ₹ {calculatedTax.toFixed(2)}</p>
                                </div>

                                <div className="w-full md:w-80 space-y-4">
                                    <div className="flex justify-between items-center text-sm font-semibold text-slate-400">
                                        <span>Subtotal:</span>
                                        <span className="font-mono">₹ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-semibold text-slate-400">
                                        <span>Override GST / Tax Amount (₹):</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder={calculatedTax.toFixed(2)}
                                            value={taxAmount}
                                            onChange={(e) => setTaxAmount(e.target.value)}
                                            className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 outline-none text-right font-mono"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-lg font-black text-slate-100 border-t border-slate-800 pt-3">
                                        <span>Grand Total:</span>
                                        <span className="font-mono text-indigo-400">₹ {totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition shadow-lg hover:shadow-indigo-500/20 active:scale-95 text-center flex items-center justify-center gap-2"
                            >
                                <FaCalculator /> Complete Intake & Record Bill
                            </button>
                        </form>
                    </div>

                    {/* Historical Table */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-slate-850 flex justify-between items-center bg-slate-900/20">
                            <h3 className="font-extrabold text-slate-200">Supplier Purchases Ledger</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="p-4">Invoice #</th>
                                        <th className="p-4">Supplier Name</th>
                                        <th className="p-4">Intake Storage</th>
                                        <th className="p-4">Purchase Date</th>
                                        <th className="p-4 text-right">Tax (₹)</th>
                                        <th className="p-4 text-right">Grand Total (₹)</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="text-center p-10 text-slate-400 animate-pulse">Loading database records...</td>
                                        </tr>
                                    ) : filteredPurchases.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center p-10 text-slate-500">No purchase invoices registered in the system.</td>
                                        </tr>
                                    ) : (
                                        filteredPurchases.map((purchase) => {
                                            const sup = suppliers.find(s => s.id === purchase.supplier_id);
                                            const wh = warehouses.find(w => w.id === purchase.warehouse_id);
                                            return (
                                                <tr key={purchase.id} className="hover:bg-slate-800/25 transition">
                                                    <td className="p-4 font-mono font-bold text-slate-200">
                                                        {purchase.invoice_number}
                                                    </td>
                                                    <td className="p-4 text-slate-300 font-medium">
                                                        {sup ? sup.name : `Supplier ID: ${purchase.supplier_id}`}
                                                    </td>
                                                    <td className="p-4 text-slate-400 text-sm">
                                                        {wh ? wh.name : `Warehouse ID: ${purchase.warehouse_id}`}
                                                    </td>
                                                    <td className="p-4 text-slate-500 text-xs font-mono font-semibold">
                                                        {new Date(purchase.purchase_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-slate-400">
                                                        ₹{purchase.tax_amount.toFixed(2)}
                                                    </td>
                                                    <td className="p-4 text-right font-mono font-bold text-indigo-400">
                                                        ₹{purchase.total_amount.toFixed(2)}
                                                    </td>
                                                    <td className="p-4">
                                                        <span
                                                            className={`text-xs font-bold ${
                                                                purchase.status === "completed"
                                                                    ? "text-emerald-400"
                                                                    : "text-amber-400"
                                                            }`}
                                                        >
                                                            ● {purchase.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex gap-2 justify-center">
                                                            <button
                                                                onClick={() => router.push(`/purchases/invoice?id=${purchase.id}`)}
                                                                className="bg-slate-800 hover:bg-slate-700 text-indigo-400 p-2.5 rounded-xl transition"
                                                                title="View Invoice"
                                                            >
                                                                <FaFileInvoice />
                                                            </button>
                                                            <button
                                                                onClick={() => deletePurchase(purchase.id)}
                                                                className="bg-slate-800 hover:bg-slate-700 text-rose-500 p-2.5 rounded-xl transition"
                                                                title="Void Acquisition"
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
