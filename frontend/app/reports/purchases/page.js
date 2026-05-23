"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import API from "../../../services/api";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import { FaFileAlt, FaTruck, FaPrint } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PurchaseReportPage() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPurchaseReportData();
    }, []);

    const fetchPurchaseReportData = async () => {
        try {
            setLoading(true);
            const res = await API.get("/purchases");
            setPurchases(res.data);
        } catch (error) {
            console.error("Error loading purchase report", error);
            toast.error("Failed to load purchase database");
        } finally {
            setLoading(false);
        }
    };

    // Calculate aggregated metrics
    const totalPurchaseAmount = purchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0);
    const totalTaxAmount = purchases.reduce((sum, purchase) => sum + (purchase.tax_amount || 0), 0);
    const totalPurchaseCount = purchases.length;

    // Calculate total quantity across all line items
    const totalUnitsPurchased = purchases.reduce((sum, purchase) => {
        const itemSum = purchase.items ? purchase.items.reduce((acc, item) => acc + (item.quantity || 0), 0) : 0;
        return sum + itemSum;
    }, 0);

    const handlePrint = () => window.print();

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans print:bg-white print:text-black">
            <div className="print:hidden block shrink-0">
                <Sidebar />
            </div>
            <ToastContainer theme="dark" />

            <div className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
                <div className="print:hidden block">
                    <Navbar />
                </div>

                <div className="flex-1 overflow-y-auto p-8 lg:px-12 print:p-0 print:overflow-visible">
                    {/* Header */}
                    <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-end border-b border-slate-800 pb-6 mb-8 print:border-slate-300 print:pb-3">
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-100 flex items-center gap-3 print:text-black">
                                <FaTruck className="text-indigo-500 print:text-indigo-600" /> Purchase Ledger Report
                            </h1>
                            <p className="text-slate-400 mt-2 font-medium print:text-slate-600">
                                Detailed supplier purchases, tax acquisitions, and unit stock intakes.
                            </p>
                            <p className="text-slate-500 mt-1 text-xs print:text-slate-500 font-mono">
                                Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row items-start sm:items-center print:hidden">
                            <Link href="/reports" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition">
                                Consolidated Report
                            </Link>
                            <Link href="/reports/sales" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition">
                                Sales Report
                            </Link>
                            <button
                                onClick={handlePrint}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/10 transition flex items-center gap-2 text-sm"
                            >
                                <FaPrint /> Print Report
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-slate-400">Compiling acquisition logs...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl print:border-slate-300 print:bg-slate-50">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Total Invoices</p>
                                    <p className="text-3xl font-black text-slate-200 print:text-black">{totalPurchaseCount} Bills</p>
                                </div>
                                <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl print:border-slate-300 print:bg-slate-50">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Total Spend Cost</p>
                                    <p className="text-3xl font-black text-rose-400 print:text-rose-700">₹ {totalPurchaseAmount.toLocaleString()}</p>
                                </div>
                                <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl print:border-slate-300 print:bg-slate-50">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Total Bricks Acquired</p>
                                    <p className="text-3xl font-black text-indigo-400 print:text-indigo-700">{totalUnitsPurchased.toLocaleString()} units</p>
                                </div>
                            </div>

                            {/* Detailed Ledger Table */}
                            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl print:border-slate-300 print:rounded-none print:shadow-none">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm print:text-black">
                                        <thead className="bg-slate-850 text-slate-300 font-bold uppercase tracking-wider text-xs print:bg-slate-200 print:text-black print:border-b">
                                            <tr>
                                                <th className="p-4">Invoice #</th>
                                                <th className="p-4">Supplier</th>
                                                <th className="p-4">Date</th>
                                                <th className="p-4">Items Summary</th>
                                                <th className="p-4 text-right">Tax (₹)</th>
                                                <th className="p-4 text-right">Total Amount (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                                            {purchases.map((purchase) => (
                                                <tr key={purchase.id} className="hover:bg-slate-800/10 transition">
                                                    <td className="p-4 font-mono font-bold text-slate-200 print:text-black">
                                                        {purchase.invoice_number}
                                                    </td>
                                                    <td className="p-4 text-slate-300 font-medium print:text-black">
                                                        {purchase.supplier ? purchase.supplier.name : "Raw Material Vendor"}
                                                    </td>
                                                    <td className="p-4 text-slate-400 text-xs font-semibold print:text-black font-mono">
                                                        {new Date(purchase.purchase_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 text-slate-400 print:text-black max-w-xs truncate">
                                                        {purchase.items ? purchase.items.map(i => `${i.product ? i.product.name : 'Item'} (x${i.quantity})`).join(", ") : "N/A"}
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-slate-400 print:text-black">
                                                        ₹{purchase.tax_amount.toFixed(2)}
                                                    </td>
                                                    <td className="p-4 text-right font-mono font-bold text-indigo-400 print:text-black">
                                                        ₹{purchase.total_amount.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-800/40 font-black text-slate-200 print:bg-slate-100 print:text-black">
                                                <td className="p-4 uppercase text-right" colSpan="4">Aggregate Totals</td>
                                                <td className="p-4 text-right font-mono">₹{totalTaxAmount.toFixed(2)}</td>
                                                <td className="p-4 text-right font-mono text-indigo-400 print:text-black text-base">₹{totalPurchaseAmount.toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Footnote */}
                            <div className="text-center text-slate-500 text-xs font-semibold pt-10">
                                <p>FLY ASH BRICKS ENTERPRISE - STRICTLY CONFIDENTIAL INTERNAL LEDGER</p>
                            </div>
                        </div>
                    )}
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
