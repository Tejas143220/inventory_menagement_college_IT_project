"use client";

import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function DashboardCard({
    title,
    value,
    icon,
    color, // expects Tailwind classes like "bg-blue-500/10 border-blue-500/30 text-blue-400"
    percentage = "12%",
    increase = true
}) {
    // Graceful progress fallback for numbers vs currency strings
    let numericValue = 65; // default fallback percentage
    if (typeof value === "number") {
        numericValue = Math.min(value * 5, 100);
    } else if (typeof value === "string") {
        const parsed = parseInt(value.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsed)) {
            numericValue = Math.min(parsed % 100, 100);
        }
    }

    return (
        <div
            className={`
                relative
                overflow-hidden
                rounded-3xl
                bg-slate-900/60
                backdrop-blur-xl
                border
                border-slate-800/80
                shadow-xl
                hover:shadow-indigo-500/5
                transition-all
                duration-300
                hover:-translate-y-1.5
                p-6
                group
            `}
        >
            {/* Glow Effect */}
            <div
                className={`
                    absolute
                    -top-10
                    -right-10
                    w-36
                    h-36
                    rounded-full
                    blur-3xl
                    opacity-10
                    bg-indigo-500
                `}
            ></div>

            {/* Content Section */}
            <div className="flex items-start justify-between relative z-10">
                {/* Left Side */}
                <div className="flex-1 min-w-0 pr-4">
                    <p className="text-slate-500 text-xs font-bold tracking-widest uppercase truncate">
                        {title}
                    </p>
                    <h1 className="text-3xl font-black text-slate-100 mt-3 tracking-tight truncate">
                        {value}
                    </h1>

                    {/* Change Indicator */}
                    <div className="flex items-center gap-2 mt-4">
                        <span
                            className={`
                                inline-flex
                                items-center
                                gap-1
                                px-2
                                py-0.5
                                rounded-lg
                                text-xs
                                font-bold
                                ${increase
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-rose-500/15 text-rose-400"
                                }
                            `}
                        >
                            {increase ? <FaArrowUp className="text-[10px]" /> : <FaArrowDown className="text-[10px]" />}
                            {percentage}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">vs last month</span>
                    </div>
                </div>

                {/* Right Icon Box */}
                <div
                    className={`
                        w-14
                        h-14
                        rounded-2xl
                        flex
                        items-center
                        justify-center
                        shadow-lg
                        transition-transform
                        duration-300
                        group-hover:scale-105
                        ${color || "bg-slate-800 text-slate-300 border border-slate-700"}
                    `}
                >
                    {icon}
                </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="mt-6 relative z-10">
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                        style={{
                            width: `${numericValue || 45}%`
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
}