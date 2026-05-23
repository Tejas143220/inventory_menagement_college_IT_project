"use client";

import { useState } from "react";

export default function CategoryForm({
    onSubmit
}) {

    const [name, setName] = useState("");

    const handleSubmit = (e) => {

        e.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            alert("Please enter a category name.");
            return;
        }

        onSubmit({ name: trimmedName });

        setName("");
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex gap-4 mb-6"
        >

            <input
                type="text"
                placeholder="Category Name"
                className="border p-3 rounded w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <button className="bg-blue-600 text-white px-5 rounded-lg transition duration-200 ease-in-out hover:bg-blue-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300">
                Add
            </button>

        </form>
    );
}