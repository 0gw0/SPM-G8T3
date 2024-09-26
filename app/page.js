'use client';

import { useState, useEffect } from 'react';
import { logout } from './logout/actions';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-4">
                Welcome to our + Next.js App!
            </h1>
            <p className="text-xl">Message from backend:</p>
            <button onClick={() => logout()}>Log Out</button>
        </main>
    );
}
