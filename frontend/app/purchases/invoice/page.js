"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import API from "../../../services/api";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import { FaPrint, FaArrowLeft, FaFileInvoiceDollar } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function InvoiceContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const purchaseId = searchParams.get("id");

    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (purchaseId) {
            fetchInvoiceData();
        }
    }, [purchaseId]);

    const fetchInvoiceData = async () => {
        try {
            setLoading(true);
            const res = await API.get(`/purchases/${purchaseId}`);
            setPurchase(res.data);
        } catch (error) {
            console.error("Error fetching invoice data:", error);
            toast.error("Failed to load invoice details");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-slate-400 font-medium">Loading purchase order details...</p>
                </div>
            </div>
        );
    }

    if (!purchase) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <p className="text-rose-500 font-bold text-lg">Purchase invoice details not found</p>
                <button
                    onClick={() => router.push("/purchases")}
                    className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold text-slate-300"
                >
                    Back to Purchases
                </button>
            </div>
        );
    }

    const { supplier, warehouse, items, invoice_number, purchase_date, total_amount, tax_amount, status } = purchase;
    const subtotal = total_amount - tax_amount;
    const cgst = tax_amount / 2;
    const sgst = tax_amount / 2;

    return (
        <div className="flex-1 overflow-y-auto p-8 lg:px-12 print:p-0 print:overflow-visible">
            {/* Action Bar */}
            <div className="mb-8 flex gap-4 print:hidden justify-between items-center bg-slate-900/40 p-4 border border-slate-855 rounded-2xl">
                <button
                    onClick={() => router.push("/purchases")}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition"
                >
                    <FaArrowLeft /> Back to Purchases List
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-500/10"
                >
                    <FaPrint /> Print / Export PDF
                </button>
            </div>

            {/* Invoice Body Container */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:rounded-none">
                {/* Header banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 mb-8 gap-4 print:border-slate-300">
                    <div>
                        <h1 className="text-3xl font-black text-indigo-400 print:text-indigo-600 flex items-center gap-2">
                            <FaFileInvoiceDollar /> PURCHASE ORDER RECEIPT
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm print:text-slate-600 font-mono font-bold"># {invoice_number}</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            status === "completed" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 print:bg-emerald-100 print:text-emerald-800" : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        }`}>
                            Status: {status}
                        </span>
                    </div>
                </div>

                {/* Invoice Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                    {/* Bill To */}
                    <div className="p-5 bg-slate-950/40 rounded-2xl border border-slate-850 print:bg-slate-50 print:border-slate-200">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 print:text-slate-500">Bill To (Buyer):</h3>
                        <p className="font-extrabold text-slate-200 text-base print:text-slate-800">FLY ASH BRICKS MFG LTD</p>
                        <p className="text-slate-400 text-sm mt-1 print:text-slate-600">Plot 24, Industrial Growth Yard</p>
                        <p className="text-slate-400 text-sm print:text-slate-600">City Zone, State 40001</p>
                        <p className="text-slate-500 text-xs font-semibold mt-3 print:text-slate-700">GSTIN: 27AABCF1234H1Z5</p>
                    </div>

                    {/* Bill From */}
                    <div className="p-5 bg-slate-950/40 rounded-2xl border border-slate-850 print:bg-slate-50 print:border-slate-200">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 print:text-slate-500">Bill From (Vendor):</h3>
                        <p className="font-extrabold text-slate-200 text-base print:text-slate-800">{supplier ? supplier.name : "Raw Material Supplier"}</p>
                        {supplier?.phone && <p className="text-slate-400 text-sm mt-1 print:text-slate-600">Phone: {supplier.phone}</p>}
                        {supplier?.email && <p className="text-slate-400 text-sm mt-1 print:text-slate-600">Email: {supplier.email}</p>}
                        {supplier?.gst_number && <p className="text-slate-500 text-xs font-semibold mt-3 print:text-slate-700">GSTIN: {supplier.gst_number}</p>}
                    </div>
                </div>

                {/* Date and Intake location */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-xs bg-slate-950/20 p-4 rounded-xl border border-slate-850 print:bg-slate-100 print:text-black">
                    <div>
                        <span className="text-slate-500 font-bold block uppercase tracking-wider">Date Received</span>
                        <span className="font-bold text-slate-300 mt-1 block print:text-black">{new Date(purchase_date).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 font-bold block uppercase tracking-wider">Due Date</span>
                        <span className="font-bold text-slate-300 mt-1 block print:text-black">{new Date(new Date(purchase_date).setDate(new Date(purchase_date).getDate() + 30)).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 font-bold block uppercase tracking-wider">Storage Warehouse</span>
                        <span className="font-bold text-slate-300 mt-1 block print:text-black">{warehouse ? warehouse.name : "Central Depot"}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 font-bold block uppercase tracking-wider">Payment Status</span>
                        <span className="font-bold text-slate-300 mt-1 block print:text-black">Paid</span>
                    </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden mb-8 print:border-slate-300">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-xs print:bg-slate-200 print:text-black print:border-b">
                            <tr>
                                <th className="p-4">Line Description / Item SKU</th>
                                <th className="p-4 text-center">Quantity</th>
                                <th className="p-4 text-right">Cost Price (₹)</th>
                                <th className="p-4 text-right">Line Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 print:divide-slate-300 print:text-black">
                            {items && items.length > 0 ? (
                                items.map((line, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/10">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-200 print:text-black">{line.product ? line.product.name : `Product ID: ${line.product_id}`}</div>
                                            {line.product?.sku && <div className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {line.product.sku}</div>}
                                        </td>
                                        <td className="p-4 text-center font-bold font-mono">
                                            {line.quantity}
                                        </td>
                                        <td className="p-4 text-right font-mono">
                                            ₹{line.unit_price.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-300 print:text-black">
                                            ₹{(line.quantity * line.unit_price).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center p-6 text-slate-500">No items specified.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end mb-8">
                    <div className="w-full sm:w-80 space-y-3 text-sm">
                        <div className="flex justify-between text-slate-400 font-medium print:text-slate-700">
                            <span>Subtotal Amount:</span>
                            <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 font-medium print:text-slate-700">
                            <span>CGST (9.0%):</span>
                            <span className="font-mono">₹{cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 font-medium print:text-slate-700">
                            <span>SGST (9.0%):</span>
                            <span className="font-mono">₹{sgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300 font-bold border-b border-slate-800 pb-2 print:text-slate-800 print:border-slate-200">
                            <span>Total Tax (18% GST):</span>
                            <span className="font-mono">₹{tax_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-black text-indigo-400 print:text-indigo-700">
                            <span>TOTAL AMOUNT:</span>
                            <span className="font-mono">₹{total_amount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footnote */}
                <div className="border-t border-slate-800 pt-6 text-xs text-slate-500 space-y-2 print:border-slate-300 print:text-slate-600">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider print:text-slate-800">Acquisition Terms</h4>
                    <p>All brick shipments received from suppliers are subject to standard quality audit and count validation at receipt dock.</p>
                    <p className="font-bold mt-2 text-indigo-500/70 print:text-indigo-600">Internal Audit Copy - Confirmed & Recorded</p>
                </div>
            </div>
        </div>
    );
}

export default function PurchaseInvoice() {
    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
            <div className="print:hidden block">
                <Sidebar />
            </div>
            <ToastContainer theme="dark" />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="print:hidden block">
                    <Navbar />
                </div>
                <Suspense fallback={
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-slate-400 font-medium">Resolving route query context...</p>
                        </div>
                    </div>
                }>
                    <InvoiceContent />
                </Suspense>
            </div>

            <style>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:p-0 {
                        padding: 0 !important;
                    }
                    .print\\:text-black {
                        color: black !important;
                    }
                    .print\\:bg-white {
                        background: white !important;
                    }
                    .print\\:border-none {
                        border: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:rounded-none {
                        border-radius: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
