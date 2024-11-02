'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client.js';
import Calendar from '@/components/calendar';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

function extractNameFromEmail(email) {
    const namePart = email.split('@')[0]; // "jack.sim"
    const nameArray = namePart.split('.'); // ["jack", "sim"]
    const capitalizedName = nameArray
        .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
        .join(' '); // "Jack Sim"
    return capitalizedName;
}

export default function Page() {
    const [arrangements, setArrangements] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [displayName, setDisplayName] = useState(''); // Add state for displayName
    const supabase = createClient();

    useEffect(() => {
        async function fetchArrangements() {
            try {
                const { data: sessionData, error: sessionError } = 
                    await supabase.auth.getSession();

                if (sessionError) throw new Error('Failed to get session');
                if (!sessionData.session) throw new Error('No active session');

                const token = sessionData.session.access_token;
                const employee_id = sessionData.session.user.user_metadata.staff_id;
                
                // Extract displayName from the email
                const email = sessionData.session.user.email;
                const name = extractNameFromEmail(email);
                setDisplayName(name); // Set the displayName state

                const response = await fetch(
                    `/api/schedule/view-own?employee_id=${employee_id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) throw new Error('Failed to fetch arrangements')
                const result = await response.json();
                setArrangements(result.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchArrangements();
    }, []);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-4">Welcome {displayName}!</h1>
            <h1 className="text-xl font-bold mb-4">Your Arrangements</h1>
            <Calendar arrangements={arrangements || []} />
        </div>
    );
}
