"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import API from "../services/api";
import { FaUserCircle } from "react-icons/fa";

export default function Navbar() {
    const [profile, setProfile] = useState({ name: "", role: "" });

    useEffect(() => {
        const savedName = localStorage.getItem("username");
        const savedRole = localStorage.getItem("role") || "";

        if (savedName) {
            setProfile({ name: savedName, role: savedRole });
        }

        async function loadProfile() {
            try {
                const res = await API.get("/me");
                setProfile({ name: res.data.username, role: res.data.role });
                localStorage.setItem("username", res.data.username);
                localStorage.setItem("role", res.data.role);
            } catch (error) {
                console.error("Failed to load profile", error);
            }
        }

        loadProfile();
    }, []);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        window.location.href = "/login";
    };

    return (
        <div className="bg-white shadow-md px-6 py-4 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
            <div>
                <h1 className="text-2xl font-bold text-blue-700">FLY ASH BRICKS</h1>
                {profile.name && (
                    <p className="text-sm text-slate-600 mt-1">
                        Signed in as <strong>{profile.name}</strong>{profile.role ? ` (${profile.role})` : ""}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-3">
                {profile.name && (
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 bg-slate-100 text-slate-900 px-4 py-2 rounded-full hover:bg-slate-200 transition"
                    >
                        <FaUserCircle /> Profile
                    </Link>
                )}
                <button
                    onClick={logout}
                    className="bg-red-500 text-white px-5 py-2 rounded-lg"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}