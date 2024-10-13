"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client.js";
import GanttChart from "../../components/ganttChart";

export default function OrganizationArrangements() {
    const [arrangements, setArrangements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(""); // State for selected department
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

    const handleDepartmentChange = (e) => {
        setSelectedDepartment(e.target.value); // Update the selected department; filteredArrangements will update automatically
    };

    // Function to filter arrangements by department
    const filteredArrangements = selectedDepartment
        ? arrangements.filter((employee) => employee.dept === selectedDepartment) // This line updates automatically
        : arrangements; // Use all arrangements when no department is selected

    if (loading) return <div className="text-center mt-8">Loading...</div>;
    if (error)
        return <div className="text-center mt-8 text-red-500">{error}</div>;

    // Check if arrangements is an array and has data
    if (!Array.isArray(filteredArrangements) || filteredArrangements.length === 0) {
        return <div className="text-center mt-8">No arrangements found.</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Organisation Arrangements</h1>
            
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="department" style={{ color: 'white', marginRight: '8px', fontWeight: 'bold' }}>Select Department:</label>
                <select
                    id="department"
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                    style={{
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '16px',
                        outline: 'none',
                        color: 'black'
                    }}
                >
                    <option value="">All Departments</option>
                    {Array.from(new Set(arrangements.map(emp => emp.dept))).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>

            <GanttChart arrangements={filteredArrangements} />
        </div>
    );
}
