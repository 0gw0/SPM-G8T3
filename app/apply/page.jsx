"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client.js";
import ApplyCalendar from "@/components/applycalendar";
import RecurringArrangementForm from "@/components/RecurringArrangementForm";

export default function OwnArrangements() {
    const [arrangements, setArrangements] = useState([]);
    const [datesDict, setDatesDict] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [arrangementType, setArrangementType] = useState("adhoc");
    const [reason, setReason] = useState(""); // State for reason
    const [attachment, setAttachment] = useState(null); // State for attachment
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
        if (JSON.stringify(newDatesDict) !== JSON.stringify(datesDict)) {
            setDatesDict(newDatesDict);
        }
    };

    // Handlers for reason and attachment
    const handleReasonChange = (e) => {
        setReason(e.target.value);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            setAttachment(file); // Set only if the file is a PDF
        } else {
            alert("Only PDF files are allowed.");
            e.target.value = ""; // Reset the input if not a PDF
        }
    };

    // Function to handle the POST request
    const handleApply = async () => {
        if (!datesDict || Object.keys(datesDict).length === 0) {
            alert("Please select at least one date before applying.");
            return;
        }

        if (!reason) {
            alert("Please provide a reason for the arrangement.");
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

        // Prepare the request body using FormData
        const requestBody = new FormData();
        requestBody.append("dates", JSON.stringify(datesDict)); // Append datesDict as JSON string
        requestBody.append("reason", reason);

        const response = await fetch(
            `/api/schedule/apply?employee_id=${employee_id}`,
            {
                method: "POST",
                headers: {
                    // Do not set 'Content-Type' header when sending FormData
                    Authorization: `Bearer ${token}`,
                },
                body: requestBody,
            }
        );

        if (!response.ok) {
            const errorResult = await response.json().catch(() => null);
            setError(
                (errorResult && errorResult.error) || "Failed to apply for WFH"
            );
            setLoading(false);
            return;
        }

        const result = await response.json();
        console.log("Debug Data from server:", result.debugData);
        setArrangements((prevArrangements) => {
            const newArrangements = result.arrangements.filter(
                (newArr) =>
                    !prevArrangements.some(
                        (arr) => arr.arrangement_id === newArr.arrangement_id
                    )
            );
            return [...prevArrangements, ...newArrangements];
        });
        alert(result.message || "Arrangements applied successfully");
        // Clear the selected dates and inputs after applying
        setDatesDict({});
        setReason("");
        setAttachment(null);
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
                {/* Existing Arrangements Table */}
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

                {/* Arrangement Type Buttons */}
                <div className="my-4">
                    <button
                        onClick={() => setArrangementType("adhoc")}
                        className={`mr-2 px-4 py-2 rounded ${
                            arrangementType === "adhoc"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200"
                        }`}
                    >
                        Ad-hoc
                    </button>
                    <button
                        onClick={() => setArrangementType("recurring")}
                        className={`px-4 py-2 rounded ${
                            arrangementType === "recurring"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200"
                        }`}
                    >
                        Recurring
                    </button>
                </div>

                {/* Arrangement Form Section */}
                <div className="mt-4">
                    {arrangementType === "adhoc" ? (
                        <>
                            <ApplyCalendar
                                arrangements={arrangements}
                                onDatesChange={handleDatesChange}
                            />

                            {/* Selected Dates Display */}
                            <div className="mt-4">
                                <h2 className="text-xl font-bold mb-2">
                                    Selected Dates:
                                </h2>
                                {selectedDatesArray.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                        {selectedDatesArray.map((date) => (
                                            <li key={date}>
                                                {new Date(
                                                    date
                                                ).toLocaleDateString()}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No dates selected.</p>
                                )}
                            </div>

                            {/* Reason Input */}
                            <div className="flex flex-col mt-4">
                                <label
                                    htmlFor="reason"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Reason
                                </label>
                                <textarea
                                    id="reason"
                                    name="reason"
                                    value={reason}
                                    onChange={handleReasonChange}
                                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                                    rows="3"
                                    placeholder="Enter your reason here"
                                />
                            </div>

                            {/* PDF Attachment Input */}
                            <div className="flex flex-col mt-4">
                                <label
                                    htmlFor="attachment"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Upload Attachment (PDF only)
                                </label>
                                <input
                                    type="file"
                                    id="attachment"
                                    name="attachment"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                                />
                            </div>

                            {/* Apply Button */}
                            <button
                                onClick={handleApply}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
                            >
                                Apply for WFH
                            </button>
                        </>
                    ) : (
                        <RecurringArrangementForm />
                    )}
                </div>
            </div>
        </div>
    );
}
