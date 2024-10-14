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
                    return;
                }

                console.log("Session data:", data);
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
                console.log("API Response:", result);

                setRole(result.role);

                if (result.role === 1 || result.role === 3) {
                    setManagedTeamArrangements(result.managedTeam || []);
                    setReportingManagerTeamArrangements(
                        result.reportingManagerTeam || []
                    );
                } else if (result.role === 2) {
                    setReportingManagerTeamArrangements(
                        result.teamMemberArrangements || []
                    );
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

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

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
                <div>
                    <Tabs>
                        <TabList>
                            <Tab>My Team</Tab>
                        </TabList>
                        <GanttChart
                            arrangements={reportingManagerTeamArrangements}
                            isLoading={loading}
                        />
                    </Tabs>
                </div>
            )}
        </div>
    );
};

export default ViewTeamPage;
