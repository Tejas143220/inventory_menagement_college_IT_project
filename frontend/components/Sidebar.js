"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/categories", label: "Categories" },
    { href: "/products", label: "Products" },
    { href: "/stock", label: "Stock & Inventory" },
    { href: "/suppliers", label: "Suppliers" },
    { href: "/warehouses", label: "Warehouses" },
    { href: "/customers", label: "Customers" },
    { href: "/sales", label: "Sales" },
    { href: "/purchases", label: "Purchases" },
    { href: "/reports", label: "Reports" },
    { href: "/profile", label: "Profile" }
];

export default function Sidebar() {
    const pathname = usePathname() || "/dashboard";

    return (
        <aside className="w-72 min-h-screen bg-slate-950 text-slate-100 p-6 shadow-xl border-r border-slate-800">

            <h1 className="text-3xl font-bold mb-10 text-center">
                FLY ASH BRICKS
            </h1>

            <div className="space-y-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`block rounded-3xl px-4 py-3 transition-all duration-200 ${isActive ? "bg-slate-800 text-white font-semibold scale-105 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.9)]" : "bg-slate-950/70 text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <span className="text-base font-medium leading-tight">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

        </aside>
    );
}