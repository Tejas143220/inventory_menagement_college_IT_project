"use client";

import { useEffect, useState } from "react";
import API from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import DashboardCard from "../../components/DashboardCard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    FaBox,
    FaTags,
    FaTruck,
    FaUsers,
    FaShoppingCart,
    FaFileInvoiceDollar,
    FaWarehouse,
    FaWallet,
    FaArrowRight,
    FaExclamationTriangle,
    FaHistory,
    FaDollarSign
} from "react-icons/fa";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await API.get("/dashboard");
            setDashboardData(res.data);
        } catch (error) {
            console.error("Dashboard Error:", error);
            toast.error(error?.response?.data?.detail || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto drop-shadow-lg"></div>
                    <p className="mt-6 text-xl font-bold tracking-wide animate-pulse">
                        Loading ERP Systems...
                    </p>
                </div>
            </div>
        );
    }

    const { summary, recent_activities, sales_analytics } = dashboardData || {
        summary: {
            total_products: 0,
            total_sales: 0,
            total_purchases: 0,
            total_warehouses: 0,
            low_stock_count: 0,
            total_revenue: 0,
            total_expense: 0,
            total_profit: 0,
            inventory_valuation: 0
        },
        recent_activities: [],
        sales_analytics: []
    };

    // Prepare chart data
    const chartLabels = sales_analytics.map((item) => item.month);
    const salesData = sales_analytics.map((item) => item.sales);
    const purchasesData = sales_analytics.map((item) => item.purchases);

    const chartConfig = {
        labels: chartLabels,
        datasets: [
            {
                label: "Sales Revenue (₹)",
                data: salesData,
                borderColor: "#10b981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                fill: true,
                tension: 0.4,
            },
            {
                label: "Purchases (₹)",
                data: purchasesData,
                borderColor: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                fill: true,
                tension: 0.4,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
                labels: {
                    color: "#f1f5f9",
                    font: {
                        family: "Inter",
                        weight: "bold"
                    }
                }
            }
        },
        scales: {
            y: {
                grid: {
                    color: "rgba(255, 255, 255, 0.05)"
                },
                ticks: {
                    color: "#94a3b8",
                    font: {
                        family: "Inter"
                    }
                }
            },
            x: {
                grid: {
                    color: "rgba(255, 255, 255, 0.05)"
                },
                ticks: {
                    color: "#94a3b8",
                    font: {
                        family: "Inter"
                    }
                }
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
            <Sidebar />
            <ToastContainer theme="dark" />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Navbar />

                <div className="flex-1 overflow-y-auto p-8 lg:px-12 scroll-smooth">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Executive Dashboard
                            </h1>
                            <p className="text-slate-400 mt-2 font-medium text-lg">
                                Fly Ash Bricks Enterprise Resource Planning Platform
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={fetchDashboardData}
                                className="px-5 py-2.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-500/20"
                            >
                                Refresh Live Data
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                        <DashboardCard
                            title="Total Products"
                            value={summary.total_products}
                            icon={<FaBox className="text-xl" />}
                            color="bg-blue-500/10 border-blue-500/30 text-blue-400"
                        />
                        <DashboardCard
                            title="Gross Revenue"
                            value={`₹${summary.total_revenue.toLocaleString()}`}
                            icon={<FaWallet className="text-xl" />}
                            color="bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        />
                        <DashboardCard
                            title="Net Profit"
                            value={`₹${summary.total_profit.toLocaleString()}`}
                            icon={<FaDollarSign className="text-xl" />}
                            color="bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                        />
                        <DashboardCard
                            title="Inventory Valuation"
                            value={`₹${summary.inventory_valuation.toLocaleString()}`}
                            icon={<FaFileInvoiceDollar className="text-xl" />}
                            color="bg-purple-500/10 border-purple-500/30 text-purple-400"
                        />
                        <DashboardCard
                            title="Completed Sales"
                            value={summary.total_sales}
                            icon={<FaShoppingCart className="text-xl" />}
                            color="bg-pink-500/10 border-pink-500/30 text-pink-400"
                        />
                        <DashboardCard
                            title="Purchase Orders"
                            value={summary.total_purchases}
                            icon={<FaFileInvoiceDollar className="text-xl" />}
                            color="bg-rose-500/10 border-rose-500/30 text-rose-400"
                        />
                        <DashboardCard
                            title="Active Warehouses"
                            value={summary.total_warehouses}
                            icon={<FaWarehouse className="text-xl" />}
                            color="bg-teal-500/10 border-teal-500/30 text-teal-400"
                        />
                        <DashboardCard
                            title="Low Stock Alerts"
                            value={summary.low_stock_count}
                            icon={<FaExclamationTriangle className="text-xl" />}
                            color={summary.low_stock_count > 0 ? "bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse" : "bg-slate-800/50 border-slate-700/50 text-slate-400"}
                        />
                    </div>

                    {/* Warning Alerts */}
                    {summary.low_stock_count > 0 && (
                        <div className="mb-10 p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4 text-amber-300">
                            <FaExclamationTriangle className="text-3xl text-amber-400 shrink-0" />
                            <div>
                                <h3 className="font-extrabold text-lg">Inventory Shortage Detected</h3>
                                <p className="text-slate-400 text-sm mt-0.5">
                                    There are {summary.low_stock_count} item(s) currently falling below the minimum threshold. Please check the Stock page for immediate replenishment.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Analytics Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                        {/* Chart Component */}
                        <div className="lg:col-span-2 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 flex flex-col min-h-[400px]">
                            <h2 className="text-2xl font-extrabold text-slate-200 mb-6">
                                Sales & Purchases Trend
                            </h2>
                            <div className="flex-1 relative min-h-[280px]">
                                {sales_analytics.length === 0 ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                        No sales or purchases data recorded for visual analysis.
                                    </div>
                               ) : (
                                    <Line data={chartConfig} options={chartOptions} />
                               )}
                            </div>
                        </div>

                        {/* Recent Activity Log */}
                        <div className="rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 flex flex-col">
                            <h2 className="text-2xl font-extrabold text-slate-200 mb-6 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <FaHistory />
                                </span>
                                System Audit Log
                            </h2>
                            <div className="flex-1 overflow-y-auto space-y-4 max-h-[320px] pr-2">
                                {recent_activities.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                        <FaHistory className="text-3xl mb-2 opacity-20" />
                                        <p className="text-sm">No activity recorded yet</p>
                                    </div>
                                ) : (
                                    recent_activities.map((act) => (
                                        <div
                                            key={act.id}
                                            className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-700 transition duration-300"
                                        >
                                            <div className="flex justify-between items-start gap-3">
                                                <span className="font-extrabold text-indigo-400 text-xs uppercase px-2 py-0.5 rounded bg-indigo-500/10 tracking-wider">
                                                    {act.action}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-semibold">
                                                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-300 mt-2">
                                                {act.details}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}