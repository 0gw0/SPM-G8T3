"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client.js";
import Calendar from "@/components/calendar";

const ViewOwnPage = () => {
    const [arrangements, setArrangements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        // Replace with the front end employee ID from login you want to use

        async function fetchArrangements() {
            setLoading(true);
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                setError('Failed to get session');
                setLoading(false);
                return;
            }

            if (!data.session) {
                setError('No active session');
                setLoading(false);
                return;
            }

            const token = data.session.access_token;
            const user = data.session.user;
            const employee_id = user.user_metadata.staff_id;

            const response = await fetch(
                `/api/schedule/view-own?employee_id=${employee_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                setError('Failed to fetch arrangements');
                setLoading(false);
                return;
            }

            const result = await response.json();
            setArrangements(result.data);
            setLoading(false);
        }

        fetchArrangements();
    }, []);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h1>Employee Arrangements</h1>
            {Array.isArray(arrangements) && arrangements.length === 0 ? (
                <p>No arrangements found.</p>
            ) : Array.isArray(arrangements) ? (
                <div>
                <ul>
                    {arrangements.map(arrangement => (
                        <li key={arrangement.arrangement_id}>
                            {arrangement.date}: {arrangement.type} - {arrangement.status}
                        </li>
                    ))}
                </ul>
                {/* Pass the arrangements to the Calendar component */}
                <Calendar arrangements={arrangements}></Calendar>
                </div>
            ) : (
                <p>Data format is incorrect or no data returned.</p>
            )}
        </div>
    );
}

export default ViewOwnPage;
