import Link from "next/link";

export default function Home() {

    return (
        <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700">

            <div className="bg-white p-10 rounded-2xl shadow-2xl w-[400px] text-center">

                <h1 className="text-4xl font-bold mb-4">
                    FLY ASH BRICKS
                </h1>

                <p className="text-gray-500 mb-8">
                    Smart Inventory Management System
                </p>

                <Link
                    href="/login"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block w-full"
                >
                    Get Started
                </Link>

            </div>

        </div>
    );
}