"use client";
import { useEffect, useState } from 'react';

const ViewOwnPage = () => {
    const [arrangements, setArrangements] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Replace with the front end employee ID from login you want to use
        const employeeID = '140002'; 

        // Fetch arrangements for the specific employee
        fetch(`/api/schedule/view-own/${employeeID}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                return response.json(); // Parse response as JSON
            })
            .then(data => {
                console.log(data)// Check what the data looks like
                setArrangements(data); // Set state only if data is an array
            })
            .catch(error => {
                console.error("Error fetching arrangements:", error);
                setError(error.message);
            });
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
                <ul>
                    {arrangements.map(arrangement => (
                        <li key={arrangement.arrangement_id}>
                            {arrangement.date}: {arrangement.type} - {arrangement.status}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Data format is incorrect or no data returned.</p>
            )}
        </div>
    );
}

export default ViewOwnPage;
