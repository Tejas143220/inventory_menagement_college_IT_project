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
    FaUser,
    FaWarehouse,
    FaShoppingCart
} from "react-icons/fa";

export default function Sales() {
    const router = useRouter();
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Multi-item form state
    const [customerId, setCustomerId] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [taxAmount, setTaxAmount] = useState("");
    const [status, setStatus] = useState("completed");
    const [items, setItems] = useState([
        { product_id: "", quantity: "", unit_price: "" }
    ]);

    useEffect(() => {
        fetchSales();
        fetchProducts();
        fetchCustomers();
        fetchWarehouses();
        generateAutoInvoiceNumber();
    }, []);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const res = await API.get("/sales");
            setSales(res.data);
        } catch (error) {
            console.error("Error fetching sales", error);
            toast.error("Failed to load sales database");
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

    const fetchCustomers = async () => {
        try {
            const res = await API.get("/customers");
            setCustomers(res.data);
        } catch (error) {
            console.error("Error fetching customers", error);
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
        setInvoiceNumber(`INV-SAL-${datePart}-${randPart}`);
    };

    // Handle Item changes
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        // Auto-populate price if product is selected
        if (field === "product_id" && value !== "") {
            const selectedProd = products.find(p => p.id === parseInt(value, 10));
            if (selectedProd) {
                newItems[index].unit_price = selectedProd.price;
            }
        }
        setItems(newItems);
    };

    const addRow = () => {
        setItems([...items, { product_id: "", quantity: "", unit_price: "" }]);
    };

    const removeRow = (index) => {
        if (items.length === 1) {
            toast.warning("A sale must contain at least one product row");
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

    // Auto-calculate tax (e.g. 18% GST) if not custom overridden
    const calculatedTax = subtotal * 0.18;
    const effectiveTax = taxAmount !== "" ? parseFloat(taxAmount) : calculatedTax;
    const totalAmount = subtotal + effectiveTax;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!customerId) return toast.error("Please select a customer");
        if (!warehouseId) return toast.error("Please select a warehouse");
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
            customer_id: parseInt(customerId, 10),
            warehouse_id: parseInt(warehouseId, 10),
            invoice_number: invoiceNumber,
            tax_amount: parseFloat(effectiveTax.toFixed(2)),
            status,
            items: validatedItems
        };

        try {
            const res = await API.post("/sales", payload);
            toast.success("Sales order placed successfully");
            
            // Reset form
            setCustomerId("");
            setWarehouseId("");
            setTaxAmount("");
            setItems([{ product_id: "", quantity: "", unit_price: "" }]);
            generateAutoInvoiceNumber();
            
            // Fetch updated database
            fetchSales();
            
            // Navigate to invoice page
            router.push(`/sales/invoice?id=${res.data.id}`);
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Failed to process sale");
        }
    };

    const deleteSale = async (id) => {
        if (!confirm("Delete this invoice? This will restore stock levels automatically!")) return;
        try {
            await API.delete(`/sales/${id}`);
            toast.success("Sales record deleted");
            fetchSales();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Delete failed");
        }
    };

    const filteredSales = sales.filter((sale) =>
        sale.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        String(sale.id).includes(search)
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
                                <FaShoppingCart className="text-indigo-500" /> Sales & Dispatch Management
                            </h1>
                            <p className="text-slate-400 mt-2">
                                Record client sales orders, deduct inventory counts dynamically, and dispatch invoices.
                            </p>
                        </div>
                        <div className="relative">
                            <FaSearch className="absolute top-4 left-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search Invoice / Sale ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 pr-4 py-3 w-72 rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 transition"
                            />
                        </div>
                    </div>

                    {/* Multi-item Sale Creator Form */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 mb-10 shadow-xl">
                        <h2 className="text-xl font-extrabold text-slate-100 mb-6 flex items-center gap-2">
                            🆕 Dispatch New Sales Invoice
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Customer Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer *</label>
                                    <select
                                        value={customerId}
                                        onChange={(e) => setCustomerId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                        required
                                    >
                                        <option value="">-- Choose Customer --</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Warehouse Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dispatch Warehouse *</label>
                                    <select
                                        value={warehouseId}
                                        onChange={(e) => setWarehouseId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                        required
                                    >
                                        <option value="">-- Choose Dispatch Source --</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Invoice Number */}
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
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Invoice Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                    >
                                        <option value="completed">Completed</option>
                                        <option value="pending">Pending Dispatch</option>
                                        <option value="cancelled">Cancelled</option>
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
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unit Price (₹) *</label>
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
                                    <p>⚡ <span className="font-bold">GST Notice:</span> GST calculation is set to 18% standard rate default.</p>
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

                            {/* Form Submit */}
                            <button
                                type="submit"
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition shadow-lg hover:shadow-indigo-500/20 active:scale-95 text-center flex items-center justify-center gap-2"
                            >
                                <FaCalculator /> Finalize Order & Generate Bill
                            </button>
                        </form>
                    </div>

                    {/* Sales List Table */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-slate-850 flex justify-between items-center bg-slate-900/20">
                            <h3 className="font-extrabold text-slate-200">Historical Sales Database</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="p-4">Invoice #</th>
                                        <th className="p-4">Customer Name</th>
                                        <th className="p-4">Dispatch Source</th>
                                        <th className="p-4">Sale Date</th>
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
                                    ) : filteredSales.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center p-10 text-slate-500">No matching sales orders registered in the system.</td>
                                        </tr>
                                    ) : (
                                        filteredSales.map((sale) => {
                                            const cust = customers.find(c => c.id === sale.customer_id);
                                            const wh = warehouses.find(w => w.id === sale.warehouse_id);
                                            return (
                                                <tr key={sale.id} className="hover:bg-slate-800/25 transition">
                                                    <td className="p-4 font-mono font-bold text-slate-200">
                                                        {sale.invoice_number}
                                                    </td>
                                                    <td className="p-4 text-slate-300 font-medium">
                                                        {cust ? cust.name : `Customer ID: ${sale.customer_id}`}
                                                    </td>
                                                    <td className="p-4 text-slate-400 text-sm">
                                                        {wh ? wh.name : `Warehouse ID: ${sale.warehouse_id}`}
                                                    </td>
                                                    <td className="p-4 text-slate-500 text-xs font-mono font-semibold">
                                                        {new Date(sale.sale_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-slate-400">
                                                        ₹{sale.tax_amount.toFixed(2)}
                                                    </td>
                                                    <td className="p-4 text-right font-mono font-bold text-indigo-400">
                                                        ₹{sale.total_amount.toFixed(2)}
                                                    </td>
                                                    <td className="p-4">
                                                        <span
                                                            className={`text-xs font-bold ${
                                                                sale.status === "completed"
                                                                    ? "text-emerald-400"
                                                                    : sale.status === "pending"
                                                                    ? "text-amber-400"
                                                                    : "text-slate-500"
                                                            }`}
                                                        >
                                                            ● {sale.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex gap-2 justify-center">
                                                            <button
                                                                onClick={() => router.push(`/sales/invoice?id=${sale.id}`)}
                                                                className="bg-slate-800 hover:bg-slate-700 text-indigo-400 p-2.5 rounded-xl transition"
                                                                title="View Invoice"
                                                            >
                                                                <FaFileInvoice />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteSale(sale.id)}
                                                                className="bg-slate-800 hover:bg-slate-700 text-rose-500 p-2.5 rounded-xl transition"
                                                                title="Void Transaction"
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
