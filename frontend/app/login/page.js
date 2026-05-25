"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import API from "../../services/api";

import {
    FaEnvelope,
    FaLock,
    FaArrowLeft,
    FaWarehouse,
    FaEye,
    FaEyeSlash
} from "react-icons/fa";

export default function Login() {

    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [formData, setFormData] = useState({
        email: "",
        password: ""
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
        setErrorMessage("");

        if (!formData.email.trim() || !formData.password.trim()) {
            setErrorMessage("Please enter both email and password.");
            return;
        }

        if (formData.password.length < 6) {
            setErrorMessage("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {

            const res = await API.post(
                "/login",
                formData
            );

            localStorage.setItem("token", res.data.access_token);
            localStorage.setItem("username", res.data.username);
            localStorage.setItem("role", res.data.role);
            localStorage.setItem("email", res.data.email);

            router.push("/dashboard");

        } catch (error) {
            console.log(error.response?.data);
            setErrorMessage(error.response?.data?.detail || "Invalid email or password.");
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

                        <div className="flex items-center gap-4 mb-8">

                            <div className="bg-white/20 p-5 rounded-3xl shadow-xl">

                                <FaWarehouse className="text-5xl" />

                            </div>

                            <div>

                                <h1 className="text-5xl font-extrabold">
                                    FLY ASH BRICKS
                                </h1>

                                <p className="text-blue-100 mt-2">
                                    Smart inventory management for your brick business
                                </p>

                            </div>

                        </div>

                        <p className="mt-6 text-lg text-blue-100 leading-relaxed max-w-md">
                            Login and manage products, suppliers, sales,
                            analytics, and inventory operations professionally.
                        </p>

                        <div className="mt-12">

                            <p className="text-blue-100 mb-4">
                                Don't have an account?
                            </p>

                            <button
                                onClick={() => router.push("/register")}
                                className="border-2 border-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-indigo-700 transition duration-300"
                            >
                                Register
                            </button>

                        </div>

                    </div>

                </div>

                {/* RIGHT SECTION */}

                <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">

                    {/* MOBILE BACK BUTTON */}

                    <button
                        onClick={() => router.push("/")}
                        className="lg:hidden mb-6 flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition"
                    >

                        <FaArrowLeft />

                        Back

                    </button>

                    {/* HEADER */}

                    <div className="mb-8 text-center">

                        <h2 className="text-4xl font-extrabold text-indigo-700">
                            Welcome Back
                        </h2>

                        <p className="text-gray-500 mt-3">
                            Login to your FLY ASH BRICKS dashboard
                        </p>

                    </div>

                    {/* FORM */}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        {errorMessage && (
                            <div className="rounded-2xl border border-rose-400 bg-rose-50 p-4 text-sm text-rose-700">
                                {errorMessage}
                            </div>
                        )}

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
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-transparent outline-none text-gray-700"
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-indigo-600 transition ml-3"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>

                            </div>

                        </div>

                        {/* FORGOT PASSWORD */}

                        <div className="flex justify-end">

                            <button
                                type="button"
                                className="text-sm text-indigo-600 hover:underline"
                            >
                                Forgot Password?
                            </button>

                        </div>

                        {/* BUTTON */}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg transition duration-300 hover:scale-[1.01]"
                        >

                            {
                                loading
                                    ? "Logging In..."
                                    : "Login"
                            }

                        </button>

                    </form>

                    {/* REGISTER */}

                    <div className="mt-8 text-center lg:hidden">

                        <p className="text-gray-600">

                            Don't have an account?

                            <span
                                onClick={() => router.push("/register")}
                                className="text-indigo-600 font-bold ml-2 cursor-pointer hover:underline"
                            >
                                Register
                            </span>

                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}