"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import API from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { FaPrint, FaFileAlt, FaChartPie, FaBuilding } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Reports() {
    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [pRes, sRes, puRes] = await Promise.all([
                API.get("/products"),
                API.get("/sales"),
                API.get("/purchases")
            ]);
            setProducts(pRes.data);
            setSales(sRes.data);
            setPurchases(puRes.data);
        } catch (error) {
            console.error("Error fetching report data", error);
            toast.error("Failed to fetch consolidation data");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculations
    const totalInventoryValue = products.reduce((acc, p) => acc + ((p.purchase_price || p.price) * p.quantity), 0);
    const totalSalesRevenue = sales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
    const totalPurchaseCost = purchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);
    
    // Low stock using minimum_stock warning threshold from backend
    const lowStockItems = products.filter(p => p.quantity <= 100 && p.quantity > 0);
    const outOfStockItems = products.filter(p => p.quantity === 0);

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans print:bg-white print:text-black">
            {/* Hide sidebar and navbar when printing */}
            <div className="print:hidden block shrink-0">
                <Sidebar />
            </div>
            <ToastContainer theme="dark" />

            <div className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
                <div className="print:hidden block">
                    <Navbar />
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 lg:px-12 print:p-0 print:overflow-visible">
                    <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:rounded-none">
                        {/* Report Header */}
                        <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-end border-b border-slate-800 pb-6 mb-8 print:border-slate-300 print:pb-3">
                            <div>
                                <h1 className="text-4xl font-extrabold text-slate-100 flex items-center gap-3 print:text-indigo-600">
                                    <FaFileAlt className="text-indigo-500 print:text-indigo-600" /> Consolidated Business Report
                                </h1>
                                <p className="text-slate-400 mt-2 font-medium print:text-slate-650">Consolidated overview of products valuation, client dispatches, and supplier intakes.</p>
                                <p className="text-slate-500 mt-1 text-xs print:text-slate-500 font-mono">
                                    Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center print:hidden">
                                <Link href="/reports/sales" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition">Sales Report</Link>
                                <Link href="/reports/purchases" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition">Purchase Report</Link>
                                <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/10 transition flex items-center gap-2 text-xs">
                                    <FaPrint /> Print Report
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-20">
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="mt-4 text-slate-400">Compiling database metrics...</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Summary Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="p-5 bg-slate-950/40 border border-slate-800 rounded-2xl print:border-slate-350 print:bg-slate-50">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 print:text-slate-600">Assets Valuation</p>
                                        <h3 className="text-xl font-black text-slate-200 print:text-black">₹ {totalInventoryValue.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-5 bg-slate-950/40 border border-slate-800 rounded-2xl print:border-slate-350 print:bg-slate-50">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 print:text-slate-600">Gross Sales</p>
                                        <h3 className="text-xl font-black text-emerald-400 print:text-emerald-700 font-mono">₹ {totalSalesRevenue.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-5 bg-slate-950/40 border border-slate-800 rounded-2xl print:border-slate-350 print:bg-slate-50">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 print:text-slate-600">Gross Purchases</p>
                                        <h3 className="text-xl font-black text-rose-400 print:text-rose-700 font-mono">₹ {totalPurchaseCost.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-5 bg-slate-950/40 border border-slate-800 rounded-2xl print:border-slate-350 print:bg-slate-50">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 print:text-slate-600">Low Stock Indicators</p>
                                        <h3 className="text-xl font-black text-amber-500 print:text-amber-700">{lowStockItems.length + outOfStockItems.length} Products</h3>
                                    </div>
                                </div>

                                {/* Detailed Inventory Table */}
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-255 mb-4 flex items-center gap-2 print:text-black"><FaChartPie className="text-slate-500 print:text-indigo-650" /> Portfolio Stock Valuation</h2>
                                    <div className="border border-slate-800 rounded-2xl overflow-hidden print:border-slate-300">
                                        <table className="w-full text-left text-sm print:text-black">
                                            <thead className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-xs print:bg-slate-200 print:text-black print:border-b">
                                                <tr>
                                                    <th className="p-4">Product Name</th>
                                                    <th className="p-4">SKU Code</th>
                                                    <th className="p-4 text-right">Avg Cost Unit</th>
                                                    <th className="p-4 text-center">Live Units count</th>
                                                    <th className="p-4 text-right">Valuation (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                                                {products.map(p => (
                                                    <tr key={p.id} className="hover:bg-slate-800/10 transition">
                                                        <td className="p-4 font-bold text-slate-200 print:text-black">{p.name}</td>
                                                        <td className="p-4 text-slate-400 font-mono text-xs print:text-black">{p.sku}</td>
                                                        <td className="p-4 text-right font-mono text-slate-300 print:text-black">₹ {(p.purchase_price || p.price).toFixed(2)}</td>
                                                        <td className="p-4 text-center font-bold font-mono">
                                                            <span className={p.quantity <= 100 ? "text-amber-500" : "text-slate-300 print:text-black"}>{p.quantity}</span>
                                                        </td>
                                                        <td className="p-4 text-right font-bold font-mono text-slate-200 print:text-black">₹ {((p.purchase_price || p.price) * p.quantity).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-800 font-black text-slate-200 print:bg-slate-100 print:text-black">
                                                    <td className="p-4 uppercase text-right" colSpan="4">Total Yard Valuation</td>
                                                    <td className="p-4 text-right font-mono text-indigo-400 print:text-black text-base">₹ {totalInventoryValue.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Warnings */}
                                {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
                                    <div className="p-6 bg-rose-950/20 border-l-4 border-rose-500 rounded-r-2xl print:border-slate-400 print:bg-slate-50">
                                        <h3 className="text-md font-bold text-rose-400 print:text-rose-800 mb-2">Immediate Dispatch/Intake warnings</h3>
                                        <p className="text-xs text-rose-350 print:text-slate-700 mb-3">The following items are running below minimum stock requirements (100 units):</p>
                                        <ul className="list-disc pl-5 text-xs font-semibold text-slate-300 space-y-1 print:text-black">
                                            {outOfStockItems.map(item => (
                                                <li key={item.id} className="text-rose-450 print:text-rose-700">{item.name} — <span className="font-bold">OUT OF STOCK (0 units)</span></li>
                                            ))}
                                            {lowStockItems.map(item => (
                                                <li key={item.id}>{item.name} — Only {item.quantity} units remaining</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                <div className="pt-10 text-center text-slate-600 text-xs font-semibold print:block">
                                    <p>Generated automatically by FLY ASH BRICKS ERP</p>
                                    <p>Confidential & Proprietary</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
