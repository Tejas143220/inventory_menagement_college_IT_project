"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import API from "../../services/api";

import {
    FaUser,
    FaEnvelope,
    FaLock,
    FaArrowLeft
} from "react-icons/fa";

export default function Register() {

    const router = useRouter();

    const [loading, setLoading] = useState(false);

    const [checked, setChecked] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "admin"
    });

    // =========================================
    // HANDLE CHANGE
    // =========================================

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // =========================================
    // HANDLE SUBMIT
    // =========================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!checked) {

            alert("Please accept terms & conditions");

            return;
        }

        setLoading(true);

        try {

            await API.post(
                "/register",
                formData
            );

            alert("Registration Successful");

            router.push("/login");

        } catch (error) {

            console.log(error.response?.data);

            alert("Registration Failed");

        } finally {

            setLoading(false);
        }
    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-700 via-blue-700 to-purple-700 relative overflow-hidden px-4 py-10">

            {/* BACKGROUND EFFECTS */}

            <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>

            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

            <div className="absolute top-40 right-20 w-52 h-52 bg-white/10 rounded-full blur-2xl"></div>

            {/* MAIN CARD */}

            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

                {/* LEFT SECTION */}

                <div className="relative hidden lg:flex flex-col justify-center bg-gradient-to-br from-indigo-700 via-blue-700 to-purple-700 p-14 text-white overflow-hidden">

                    {/* SHAPES */}

                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full"></div>

                    <div className="absolute -bottom-32 -left-24 w-[420px] h-[420px] bg-white/10 rounded-full"></div>

                    {/* CONTENT */}

                    <button
                        onClick={() => router.push("/")}
                        className="absolute top-8 left-8 flex items-center gap-2 text-sm hover:opacity-80 transition"
                    >

                        <FaArrowLeft />

                        Home Page

                    </button>

                    <div className="relative z-10">

                        <h1 className="text-6xl font-extrabold leading-tight">
                            Get
                            <br />
                            Started
                        </h1>

                        <p className="mt-6 text-lg text-blue-100 leading-relaxed max-w-md">
                            Create your account and manage your inventory system professionally and efficiently.
                        </p>

                        <div className="mt-12">

                            <p className="text-blue-100 mb-4">
                                Already have an account?
                            </p>

                            <button
                                onClick={() => router.push("/login")}
                                className="border-2 border-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-indigo-700 transition duration-300"
                            >
                                Log in
                            </button>

                        </div>

                    </div>

                </div>

                {/* RIGHT SECTION */}

                <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">

                    {/* MOBILE HOME BUTTON */}

                    <button
                        onClick={() => router.push("/")}
                        className="lg:hidden mb-6 flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition"
                    >

                        <FaArrowLeft />

                        Back

                    </button>

                    <div className="mb-8 text-center">

                        <h2 className="text-4xl font-extrabold text-indigo-700">
                            Create Account
                        </h2>

                        <p className="text-gray-500 mt-3">
                            Register your inventory management account
                        </p>

                    </div>

                    {/* FORM */}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* USERNAME */}

                        <div>

                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Username
                            </label>

                            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 focus-within:ring-2 focus-within:ring-indigo-500 transition">

                                <FaUser className="text-gray-400 mr-3" />

                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Enter username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-transparent outline-none text-gray-700"
                                    required
                                />

                            </div>

                        </div>

                        {/* EMAIL */}

                        <div>

                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email
                            </label>

                            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 focus-within:ring-2 focus-within:ring-indigo-500 transition">

                                <FaEnvelope className="text-gray-400 mr-3" />

                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-transparent outline-none text-gray-700"
                                    required
                                />

                            </div>

                        </div>

                        {/* PASSWORD */}

                        <div>

                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>

                            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 focus-within:ring-2 focus-within:ring-indigo-500 transition">

                                <FaLock className="text-gray-400 mr-3" />

                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-transparent outline-none text-gray-700"
                                    required
                                />

                            </div>

                        </div>

                        {/* TERMS */}

                        <div className="flex items-center gap-3 pt-1">

                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                    setChecked(!checked)
                                }
                                className="w-4 h-4 accent-indigo-600"
                            />

                            <p className="text-sm text-gray-600">
                                I accept the terms and conditions
                            </p>

                        </div>

                        {/* BUTTON */}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg transition duration-300 hover:scale-[1.01]"
                        >

                            {
                                loading
                                    ? "Creating Account..."
                                    : "Sign Up"
                            }

                        </button>

                    </form>

                    {/* LOGIN */}

                    <div className="mt-8 text-center lg:hidden">

                        <p className="text-gray-600">

                            Already have an account?

                            <span
                                onClick={() => router.push("/login")}
                                className="text-indigo-600 font-bold ml-2 cursor-pointer hover:underline"
                            >
                                Login
                            </span>

                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}