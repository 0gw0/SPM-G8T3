"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
    const pathname = usePathname();

    // Add your routes here
    const routes = [
        { path: "/", name: "My Arrangements" },
        { path: "/apply", name: "Arrangement Management" },
        { path: "/view-team", name: "My Team" },
        { path: "/view-org", name: "Organisation" },
    ];

    return (
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-white text-xl font-bold">
                    G8T3
                </Link>
                <ul className="flex space-x-4">
                    {routes.map((route) => (
                        <li key={route.path}>
                            <Link
                                href={route.path}
                                className={`text-white hover:text-gray-300 ${
                                    pathname === route.path ? "font-bold" : ""
                                }`}
                            >
                                {route.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
