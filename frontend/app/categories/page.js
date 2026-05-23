"use client";

import { useEffect, useState } from "react";

import API from "../../services/api";

import Sidebar from "../../components/Sidebar";

import Navbar from "../../components/Navbar";

import CategoryForm from "../../components/CategoryForm";

export default function Categories() {

    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);

    const [editName, setEditName] = useState("");

    const [error, setError] = useState("");

    // ================= FETCH CATEGORIES =================

    useEffect(() => {

        fetchCategories();

    }, []);

    const fetchCategories = async () => {

        try {

            const res = await API.get("/categories");

            setCategories(res.data);

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);
        }
    };

    // ================= ADD CATEGORY =================

    const addCategory = async (data) => {

        const trimmedName = data.name.trim();

        if (!trimmedName) {
            setError("Please enter a category name.");
            return;
        }

        const duplicate = categories.some(
            (cat) =>
                cat.name.trim().toLowerCase() ===
                trimmedName.toLowerCase()
        );

        if (duplicate) {
            setError("Category already exists.");
            return;
        }

        try {

            await API.post("/categories", { name: trimmedName });

            setError("");
            fetchCategories();

        } catch (error) {

            setError(
                error?.response?.data?.detail ||
                    "Unable to add category."
            );
            console.log(error);
        }
    };

    // ================= DELETE CATEGORY =================

    const deleteCategory = async (id) => {

        const confirmDelete = confirm(
            "Are you sure you want to delete?"
        );

        if (!confirmDelete) return;

        try {

            await API.delete(`/categories/${id}`);

            fetchCategories();

        } catch (error) {

            console.log(error);
        }
    };

    // ================= EDIT CATEGORY =================

    const startEdit = (category) => {

        setEditingId(category.id);

        setEditName(category.name);
    };

    // ================= UPDATE CATEGORY =================

    const updateCategory = async (id) => {

        const trimmedName = editName.trim();

        if (!trimmedName) {
            setError("Please enter a category name.");
            return;
        }

        const duplicate = categories.some(
            (cat) =>
                cat.id !== id &&
                cat.name.trim().toLowerCase() ===
                    trimmedName.toLowerCase()
        );

        if (duplicate) {
            setError("Another category with this name already exists.");
            return;
        }

        try {

            await API.put(`/categories/${id}`, {
                name: trimmedName
            });

            setEditingId(null);
            setEditName("");
            setError("");
            fetchCategories();

        } catch (error) {

            setError(
                error?.response?.data?.detail ||
                    "Unable to update category."
            );
            console.log(error);
        }
    };

    return (

        <div className="flex min-h-screen bg-gray-100">

            <Sidebar />

            <div className="flex-1">

                <Navbar />

                <div className="p-6">

                    <div className="flex items-center justify-between mb-6">

                        <h1 className="text-3xl font-bold text-gray-800">
                            Category Management
                        </h1>

                    </div>

                    {/* FORM */}

                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
                            {error}
                        </div>
                    )}

                    <CategoryForm onSubmit={addCategory} />

                    {/* TABLE */}

                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-8">

                        <table className="w-full">

                            <thead className="bg-blue-600 text-white">

                                <tr>

                                    <th className="p-4 text-left">
                                        ID
                                    </th>

                                    <th className="p-4 text-left">
                                        Category Name
                                    </th>

                                    <th className="p-4 text-center">
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {loading ? (

                                    <tr>

                                        <td
                                            colSpan="3"
                                            className="text-center p-6"
                                        >
                                            Loading...
                                        </td>

                                    </tr>

                                ) : categories.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="3"
                                            className="text-center p-6 text-gray-500"
                                        >
                                            No Categories Found
                                        </td>

                                    </tr>

                                ) : (

                                    categories.map((cat) => (

                                        <tr
                                            key={cat.id}
                                            className="border-b hover:bg-gray-50"
                                        >

                                            {/* ID */}

                                            <td className="p-4">
                                                {cat.id}
                                            </td>

                                            {/* NAME */}

                                            <td className="p-4">

                                                {editingId === cat.id ? (

                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) =>
                                                            setEditName(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="border px-3 py-2 rounded-lg w-full"
                                                    />

                                                ) : (

                                                    cat.name
                                                )}

                                            </td>

                                            {/* ACTIONS */}

                                            <td className="p-4">

                                                <div className="flex justify-center gap-3">

                                                    {editingId === cat.id ? (

                                                        <>

                                                            <button
                                                                onClick={() =>
                                                                    updateCategory(cat.id)
                                                                }
                                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                                                            >
                                                                Save
                                                            </button>

                                                            <button
                                                                onClick={() =>
                                                                    setEditingId(null)
                                                                }
                                                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                                                            >
                                                                Cancel
                                                            </button>

                                                        </>

                                                    ) : (

                                                        <>

                                                            <button
                                                                onClick={() =>
                                                                    startEdit(cat)
                                                                }
                                                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                onClick={() =>
                                                                    deleteCategory(cat.id)
                                                                }
                                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                                                            >
                                                                Delete
                                                            </button>

                                                        </>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>
    );
}