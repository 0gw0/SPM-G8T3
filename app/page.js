"use client";

import { useState, useEffect } from "react";

export default function Home() {
    const [greeting, setGreeting] = useState("");

    useEffect(() => {
        async function fetchGreeting() {
            const response = await fetch("/api/greeting");
            const data = await response.json();
            setGreeting(data.message);
        }
        fetchGreeting();
    }, []);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-4">
                Welcome to our + Next.js App!
            </h1>
            <p className="text-xl">Message from backend: {greeting}</p>
        </main>
    );
}
