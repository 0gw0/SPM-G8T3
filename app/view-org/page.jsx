"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client.js";
import GanttChart from "../../components/ganttChart";

export default function OrganizationArrangements() {
    const [arrangements, setArrangements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchArrangements() {
            setLoading(true);
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                setError("Failed to get session");
                setLoading(false);
                return;
            }

            if (!data.session) {
                setError("No active session");
                setLoading(false);
                return;
            }

            const response = await fetch("/api/schedule/view-org", {
                headers: {
                    Authorization: `Bearer ${data.session.access_token}`,
                },
            });

            if (!response.ok) {
                setError("Failed to fetch arrangements");
                setLoading(false);
                return;
            }

            const result = await response.json();
            console.log("Fetched arrangements:", result); // Check the structure of result
            setArrangements(result.data); // Set the fetched arrangements to state
            setLoading(false);
        }
        fetchArrangements();
    }, []);

    if (loading) return <div className="text-center mt-8">Loading...</div>;
    if (error)
        return <div className="text-center mt-8 text-red-500">{error}</div>;

    // Check if arrangements is an array and has data
    if (!Array.isArray(arrangements) || arrangements.length === 0) {
        return <div className="text-center mt-8">No arrangements found.</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Organisation Arrangements</h1>
                <GanttChart arrangements={arrangements} />
        </div>
    );
}
