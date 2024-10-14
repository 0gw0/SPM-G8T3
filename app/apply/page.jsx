"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client.js";
import ApplyCalendar from "@/components/applycalendar";

export default function OwnArrangements() {
    const [arrangements, setArrangements] = useState([]);
    const [datesDict, setDatesDict] = useState({});
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

            const token = data.session.access_token;
            const user = data.session.user;
            const employee_id = user.user_metadata.staff_id;

            const response = await fetch(
                `/api/schedule/apply?employee_id=${employee_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorResult = await response.json();
                setError(errorResult.error || "Failed to fetch arrangements");
                setLoading(false);
                return;
            }

            const result = await response.json();
            setArrangements(result.data);
            setLoading(false);
        }

        fetchArrangements();
    }, []);

    // Callback function to receive datesDict from ApplyCalendar
    const handleDatesChange = (newDatesDict) => {
        setDatesDict(newDatesDict);
    };

    // Function to handle the POST request
    const handleApply = async () => {
        if (!datesDict || Object.keys(datesDict).length === 0) {
            alert("Please select at least one date before applying.");
            return;
        }
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            setError("Failed to get session");
            return;
        }

        if (!data.session) {
            setError("No active session");
            return;
        }

        const token = data.session.access_token;
        const user = data.session.user;
        const employee_id = user.user_metadata.staff_id;

        // Prepare the request body
        const requestBody = {
            dates: datesDict, // The dates dictionary collected from ApplyCalendar
        };

        const response = await fetch(
            `/api/schedule/apply?employee_id=${employee_id}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorResult = await response.json().catch(() => null);
            setError(
                (errorResult && errorResult.error) ||
                    "Failed to fetch arrangements"
            );
            setLoading(false);
            return;
        }

        const result = await response.json();
        console.log("Debug Data from server:", result.debugData);
        // Optionally, update the arrangements state to reflect the new data
        setArrangements((prevArrangements) => [
            ...prevArrangements,
            ...(Array.isArray(result.arrangements) ? result.arrangements : []),
        ]);
        alert(result.message || "Arrangements applied successfully");
        // Clear the selected dates after applying
        setDatesDict({});
    };

    if (loading) return <div className="text-center mt-8">Loading...</div>;
    if (error)
        return <div className="text-center mt-8 text-red-500">{error}</div>;
    // Extract selected dates from datesDict
    const selectedDatesArray = Object.keys(datesDict);
    return (
        <div className="container mx-auto mt-8 p-4">
            <h1 className="text-2xl font-bold mb-4">Own Arrangements</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-2 px-4 border-b">Employee</th>
                            <th className="py-2 px-4 border-b">Department</th>
                            <th className="py-2 px-4 border-b">Date</th>
                            <th className="py-2 px-4 border-b">Start Date</th>
                            <th className="py-2 px-4 border-b">End Date</th>
                            <th className="py-2 px-4 border-b">
                                Recurrence Pattern
                            </th>
                            <th className="py-2 px-4 border-b">Type</th>
                            <th className="py-2 px-4 border-b">Location</th>
                            <th className="py-2 px-4 border-b">Reason</th>
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
                                    {new Date(
                                        arr.start_date
                                    ).toLocaleDateString()}
                                </td>
                                <td className="py-2 px-4 border-b">
                                    {new Date(
                                        arr.end_date
                                    ).toLocaleDateString()}
                                </td>
                                <td className="py-2 px-4 border-b">
                                    {arr.recurrence_pattern}
                                </td>
                                <td className="py-2 px-4 border-b">
                                    {arr.type}
                                </td>
                                <td className="py-2 px-4 border-b">
                                    {arr.location}
                                </td>
                                <td className="py-2 px-4 border-b">
                                    {arr.reason}
                                </td>
                                <td className="py-2 px-4 border-b">
                                    {arr.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-4">
                    <ApplyCalendar
                        arrangements={arrangements}
                        onDatesChange={handleDatesChange}
                    />
                    {/* Display the selected dates outside the calendar */}
                    <div className="mt-4">
                        <h2 className="text-xl font-bold mb-2">
                            Selected Dates:
                        </h2>
                        {selectedDatesArray.length > 0 ? (
                            <ul className="list-disc list-inside">
                                {selectedDatesArray.map((date) => (
                                    <li key={date}>
                                        {new Date(date).toLocaleDateString()}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No dates selected.</p>
                        )}
                    </div>
                    <button
                        onClick={handleApply}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Apply for WFH
                    </button>
                </div>
            </div>
        </div>
    );
}
