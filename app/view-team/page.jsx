"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client.js";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import GanttChart from "../../components/ganttChart";

const ViewTeamPage = () => {
    const [managedTeamArrangements, setManagedTeamArrangements] = useState([]);
    const [
        reportingManagerTeamArrangements,
        setReportingManagerTeamArrangements,
    ] = useState([]);
    const [role, setRole] = useState(null);
    const [isMD, setIsMD] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchArrangements() {
            setLoading(true);
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    console.error("Failed to get session:", error);
                    setError("Failed to get session");
                    window.location.href = "/login";
                    return;
                }

                const token = data.session.access_token;
                const response = await fetch(`/api/schedule/view-team`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    console.error("Failed to fetch data:", response.statusText);
                    setError("Failed to fetch data");
                    return;
                }

                const result = await response.json();
                setRole(result.role);

                // Check if user is an MD (will only have managedTeam in response)
                const isManagingDirector =
                    result.role === 1 && !result.reportingManagerTeam;
                setIsMD(isManagingDirector);

                if (result.role === 1 || result.role === 3) {
                    // Remove duplicates from managedTeam
                    const uniqueManagedTeam = removeDuplicateEmployees(
                        ensureEmptyArrangements(result.managedTeam)
                    );
                    setManagedTeamArrangements(uniqueManagedTeam);

                    // Only set reporting manager team if not MD
                    if (!isManagingDirector && result.reportingManagerTeam) {
                        const uniqueReportingTeam = removeDuplicateEmployees(
                            ensureEmptyArrangements(result.reportingManagerTeam)
                        );
                        setReportingManagerTeamArrangements(
                            uniqueReportingTeam
                        );
                    }
                } else if (result.role === 2) {
                    const uniqueTeam = removeDuplicateEmployees(
                        ensureEmptyArrangements(result.teamMemberArrangements)
                    );
                    setReportingManagerTeamArrangements(uniqueTeam);
                }
            } catch (err) {
                console.error("Unexpected error:", err);
                setError("Unexpected error occurred");
            } finally {
                setLoading(false);
            }
        }

        fetchArrangements();
    }, []);

    const ensureEmptyArrangements = (team) =>
        team.map((member) => ({
            ...member,
            arrangements: member.arrangements || [],
        }));

    const removeDuplicateEmployees = (team) => {
        return team.filter(
            (employee, index, self) =>
                index ===
                self.findIndex((e) => e.staff_id === employee.staff_id)
        );
    };

    if (loading) return <div>Loading...</div>;
    if (error)
        return (
            <div className="text-red-500">
                <h2>Error loading schedules</h2>
                <p>{error}</p>
            </div>
        );

    // For MD, show single view
    if (isMD) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-6">Team Schedules</h1>
                <div className="mb-4">
                    <GanttChart
                        arrangements={managedTeamArrangements}
                        isLoading={loading}
                    />
                </div>
            </div>
        );
    }

    // For other roles (Manager/Director), show tabs
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Team Schedules</h1>

            {role === 1 || role === 3 ? (
                <Tabs>
                    <TabList>
                        <Tab>Manager View</Tab>
                        <Tab>Team View</Tab>
                    </TabList>

                    <TabPanel>
                        <GanttChart
                            arrangements={managedTeamArrangements}
                            isLoading={loading}
                        />
                    </TabPanel>

                    <TabPanel>
                        <GanttChart
                            arrangements={reportingManagerTeamArrangements}
                            isLoading={loading}
                        />
                    </TabPanel>
                </Tabs>
            ) : (
                <Tabs>
                    <TabList>
                        <Tab>My Team</Tab>
                    </TabList>
                    <TabPanel>
                        <GanttChart
                            arrangements={reportingManagerTeamArrangements}
                            isLoading={loading}
                        />
                    </TabPanel>
                </Tabs>
            )}
        </div>
    );
};

export default ViewTeamPage;
