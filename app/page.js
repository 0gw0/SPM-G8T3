'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client.js';
import Calendar from '@/components/calendar';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

export default function Page() {
    const [arrangements, setArrangements] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchArrangements() {
            try {
                const { data: sessionData, error: sessionError } =
                    await supabase.auth.getSession();

                if (sessionError) throw new Error('Failed to get session');
                if (!sessionData.session) throw new Error('No active session');

                const token = sessionData.session.access_token;
                const employee_id =
                    sessionData.session.user.user_metadata.staff_id;

                const response = await fetch(
                    `/api/schedule/view-own?employee_id=${employee_id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok)
                    throw new Error('Failed to fetch arrangements');

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
            <h1 className="text-2xl font-bold mb-4">My Arrangements</h1>
            {!arrangements || arrangements.length === 0 ? (
                <p className="text-gray-600">No arrangements found.</p>
            ) : (
                <Calendar arrangements={arrangements} />
            )}
        </div>
    );
}
