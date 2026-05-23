"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import API from "../../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUserCircle, FaEnvelope, FaShieldAlt, FaKey, FaUserEdit } from "react-icons/fa";

export default function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Profile Edit State
    const [editMode, setEditMode] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");

    // Password Change State
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            setLoading(true);
            const res = await API.get("/me");
            setProfile(res.data);
            setUsername(res.data.username);
            setEmail(res.data.email);
        } catch (error) {
            console.error("Unable to fetch profile", error);
            toast.error("Failed to load admin profile details");
        } finally {
            setLoading(false);
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!username || !email) {
            toast.error("Username and email cannot be empty");
            return;
        }

        try {
            const res = await API.put("/me", null, {
                params: {
                    username: username,
                    email: email
                }
            });
            setProfile(res.data);
            setEditMode(false);
            toast.success("Profile details updated successfully");
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Failed to update profile details");
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (!oldPassword || !newPassword) {
            toast.error("Please fill in both old and new passwords");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        try {
            await API.put("/me/change-password", {
                old_password: oldPassword,
                new_password: newPassword
            });
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success("Password changed successfully");
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Failed to change password");
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
            <Sidebar />
            <ToastContainer theme="dark" />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Navbar />

                <div className="flex-1 overflow-y-auto p-8 lg:px-12 scroll-smooth">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-10">
                            <h1 className="text-4xl font-extrabold text-slate-100 flex items-center gap-3">
                                <FaUserCircle className="text-indigo-500" /> Admin Profile Settings
                            </h1>
                            <p className="text-slate-400 mt-2">
                                Manage your administrative account credentials and security keys.
                            </p>
                        </div>

                        {loading ? (
                            <div className="text-center py-20">
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="mt-4 text-slate-400">Loading your profile configuration...</p>
                            </div>
                        ) : profile ? (
                            <div className="space-y-8">
                                {/* Overview Panel */}
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col items-center text-center gap-4 shadow-xl">
                                        <div className="bg-indigo-600 text-white rounded-full p-4 shadow-lg shadow-indigo-500/20">
                                            <FaUserCircle className="text-4xl" />
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-slate-500 tracking-widest font-black">Logged Admin</p>
                                            <p className="text-lg font-extrabold text-slate-200 mt-1">{profile.username}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-center gap-2 shadow-xl">
                                        <p className="text-xs uppercase text-slate-500 tracking-widest font-black mb-1">Email Address</p>
                                        <div className="flex items-center gap-3 text-slate-300 font-medium">
                                            <FaEnvelope className="text-indigo-400" />
                                            <span className="truncate">{profile.email}</span>
                                        </div>
                                    </div>
                                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-center gap-2 shadow-xl">
                                        <p className="text-xs uppercase text-slate-500 tracking-widest font-black mb-1">Current Role</p>
                                        <div className="flex items-center gap-3 text-slate-300 font-medium">
                                            <FaShieldAlt className="text-orange-400" />
                                            <span className="uppercase tracking-wider text-xs font-black px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/25">
                                                {profile.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Forms Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Edit details form */}
                                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
                                        <h3 className="text-xl font-extrabold text-slate-100 mb-6 flex items-center gap-2">
                                            <FaUserEdit className="text-indigo-400" /> Update Details
                                        </h3>
                                        <form onSubmit={handleUpdateProfile} className="space-y-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg hover:shadow-indigo-500/20 active:scale-95"
                                            >
                                                Save Basic Changes
                                            </button>
                                        </form>
                                    </div>

                                    {/* Edit password form */}
                                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
                                        <h3 className="text-xl font-extrabold text-slate-100 mb-6 flex items-center gap-2">
                                            <FaKey className="text-indigo-400" /> Change Security Password
                                        </h3>
                                        <form onSubmit={handleChangePassword} className="space-y-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={oldPassword}
                                                    onChange={(e) => setOldPassword(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition"
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg hover:shadow-indigo-500/20 active:scale-95"
                                            >
                                                Update Password
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 text-rose-500">
                                Could not load admin profile details. Please login again.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
