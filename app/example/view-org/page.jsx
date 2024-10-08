"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client.js";

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
            setArrangements(result.data);
            setLoading(false);
        }

        fetchArrangements();
    }, []);

    if (loading) return <div className="text-center mt-8">Loading...</div>;
    if (error)
        return <div className="text-center mt-8 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto mt-8 p-4">
            <h1 className="text-2xl font-bold mb-4">
                Organization Arrangements
            </h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-2 px-4 border-b">Employee</th>
                            <th className="py-2 px-4 border-b">Department</th>
                            <th className="py-2 px-4 border-b">Date</th>
                            <th className="py-2 px-4 border-b">Type</th>
                            <th className="py-2 px-4 border-b">Location</th>
                            <th className="py-2 px-4 border-b">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {arrangements.map((arr) => (
                            <tr
                                key={arr.arrangement_id}
                                className="hover:bg-gray-50"
                            >
                                <td className="py-2 px-4 border-b">
                                    {arr.employeeName}
                                </td>
                                <td className="py-2 px-4 border-b">
                                    {arr.department}
                                </td>
                                <td className="py-2 px-4 border-b">
                                    {new Date(arr.date).toLocaleDateString()}
                                </td>
                                <td className="py-2 px-4 border-b">
                                    {arr.type}
                                </td>
                                <td className="py-2 px-4 border-b">
                                    {arr.location}
                                </td>
                                <td className="py-2 px-4 border-b">
                                    {arr.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
