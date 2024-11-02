"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client.js";
import GanttChart, {transformEmployeeData} from "../../components/ganttChart";

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

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

            if (response.status === 403) {
                // Custom message for 403 Forbidden errors
                setError("You do not have permission to view these arrangements.");
                setLoading(false);
                return;
            }
            
            if (!response.ok) {
                setError("Failed to fetch arrangements");
                setLoading(false);
                return;
            }

            const result = await response.json();
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

    if (loading) return <div className="text-center mt-8"><LoadingSpinner /></div>;
    if (error)
        return <div className="text-center mt-8 text-red-500">{error}</div>;

    // Check if arrangements is an array and has data
    if (!Array.isArray(filteredArrangements) || filteredArrangements.length === 0) {
        return <div className="text-center mt-8">No arrangements found.</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Organisation Arrangements</h1>
            
            <div className="text-l font-semibold text-black-700 mb-4">
                {`Today's Date: ${new Date().toLocaleDateString()}`}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                    // Step 1: Transform the employee data
                    const transformedData = transformEmployeeData(arrangements);

                    // Step 2: Get unique departments from transformed data
                    const uniqueDepartments = Array.from(new Set(transformedData.map(emp => emp.label.department)));

                    // Step 3: Create cards using a for loop
                    const departmentCards = [];
                    for (let i = 0; i < uniqueDepartments.length; i++) {
                        const dept = uniqueDepartments[i];
                        const todayDate = new Date().toISOString().split('T')[0];    

                        // Filter employees for the current department
                        const deptEmployees = transformedData.filter(employee => employee.label.department === dept);

                        // Calculate totals
                        const totalInDept = deptEmployees.length > 0 ? deptEmployees.length : 0;
                        let totalWFH = 0; // Initialize WFH count for the department
                        let totalOffice = 0
                        // Iterate through each employee in the department
                        deptEmployees.forEach(employee => {
                            // Check if the employee has arrangements in their data array
                            if (Array.isArray(employee.data)) {
                                // Iterate through the employee's arrangements
                                employee.data.forEach(arrangement => {
                                    // Ensure that startDate exists in the arrangement
                                    const arrangementStartDate = arrangement.startDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD
                                    
                                    // Check if the arrangement's start date matches today and it's WFH
                                    if (arrangementStartDate === todayDate && arrangement.title === 'WFH') {
                                        // If it's WFH and the date matches today, increment WFH count
                                        totalWFH++;
                                    }
                                });
                            }
                            totalOffice = totalInDept - totalWFH
                        });

                        // Push the card component for this department
                        departmentCards.push(
                            <div key={dept} className="max-w-sm rounded overflow-hidden shadow-lg border border-gray-300 bg-white mb-4">
                                <div className="px-2 py-2">
                                    <div className="font-bold text-lg text-black">{dept} Department</div>
                                    <p className="text-gray-800 text-base">
                                        Total in Department: {totalInDept}<br />
                                        Total Work from Home: {totalWFH} <br/>
                                        Total in Office: {totalOffice}
                                    </p>
                                </div>
                            </div>
                        );
                    }

                    return departmentCards; // Return the array of cards
                })()}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="department" style={{ color: 'black', marginRight: '8px', fontWeight: 'bold' }}>Filter by Department:</label>
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
