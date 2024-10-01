"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client.js";

const ViewTeamPage = () => {
    const [managedTeamArrangements, setManagedTeamArrangements] = useState([]);
    const [
        reportingManagerTeamArrangements,
        setReportingManagerTeamArrangements,
    ] = useState([]);
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

            const token = data.session.access_token;

            const response = await fetch(`/api/schedule/view-team`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                setError("Failed to fetch arrangements");
                setLoading(false);
                return;
            }

            const result = await response.json();

            if (result.managedTeam) {
                setManagedTeamArrangements(result.managedTeam);
                setReportingManagerTeamArrangements(
                    result.reportingManagerTeam
                );
            } else {
                setReportingManagerTeamArrangements(
                    result.teamMemberArrangements
                );
            }

            setLoading(false);
        }

        fetchArrangements();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Employee Arrangements</h1>

            {/* For Role 1/3, show two views as tables */}
            {managedTeamArrangements?.length > 0 && (
                <>
                    <h2 className="text-xl font-semibold mb-4">My Team</h2>
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="py-2 px-4 border">Staff ID</th>
                                <th className="py-2 px-4 border">Full Name</th>
                                <th className="py-2 px-4 border">Position</th>
                                <th className="py-2 px-4 border">Date</th>
                                <th className="py-2 px-4 border">Start Date</th>
                                <th className="py-2 px-4 border">End Date</th>
                                <th className="py-2 px-4 border">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {managedTeamArrangements.map((arrangement) => (
                                <tr
                                    key={arrangement.arrangement_id}
                                    className="hover:bg-gray-100"
                                >
                                    <td className="py-2 px-4 border">
                                        {arrangement.staff_id}
                                    </td>
                                    <td className="py-2 px-4 border">
                                        {arrangement.employee?.staff_fname}{" "}
                                        {arrangement.employee?.staff_lname}
                                    </td>
                                    <td className="py-2 px-4 border">
                                        {arrangement.employee?.position}
                                    </td>
                                    <td className="py-2 px-4 border">
                                        {arrangement.date}
                                    </td>
                                    <td className="py-2 px-4 border">
                                        {arrangement.start_date}
                                    </td>
                                    <td className="py-2 px-4 border">
                                        {arrangement.end_date}
                                    </td>
                                    <td className="py-2 px-4 border">
                                        {arrangement.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* For Role 1/3's second view or Role 2's single view */}
            <h2 className="text-xl font-semibold mt-6">
                {managedTeamArrangements?.length > 0
                    ? "Team I'm Reporting To"
                    : "My Team"}
            </h2>
            {reportingManagerTeamArrangements?.length === 0 ? (
                <p>No arrangements found for this team.</p>
            ) : (
                <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="py-2 px-4 border">Staff ID</th>
                            <th className="py-2 px-4 border">Full Name</th>
                            <th className="py-2 px-4 border">Position</th>
                            <th className="py-2 px-4 border">Date</th>
                            <th className="py-2 px-4 border">Start Date</th>
                            <th className="py-2 px-4 border">End Date</th>
                            <th className="py-2 px-4 border">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportingManagerTeamArrangements.map((arrangement) => (
                            <tr
                                key={arrangement.arrangement_id}
                                className="hover:bg-gray-100"
                            >
                                <td className="py-2 px-4 border">
                                    {arrangement.staff_id}
                                </td>
                                <td className="py-2 px-4 border">
                                    {arrangement.employee?.staff_fname}{" "}
                                    {arrangement.employee?.staff_lname}
                                </td>
                                <td className="py-2 px-4 border">
                                    {arrangement.employee?.position}
                                </td>
                                <td className="py-2 px-4 border">
                                    {arrangement.date}
                                </td>
                                <td className="py-2 px-4 border">
                                    {arrangement.start_date}
                                </td>
                                <td className="py-2 px-4 border">
                                    {arrangement.end_date}
                                </td>
                                <td className="py-2 px-4 border">
                                    {arrangement.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ViewTeamPage;
