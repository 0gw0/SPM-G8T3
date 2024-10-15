import { Scheduler } from "@bitnoi.se/react-scheduler";
import React from "react";

// Function to transform employee data into the required format for the component
export function transformEmployeeData(employees) {
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    return employees.map(employee => {
        const staffId = employee.staff_id;

        // Prepare the label for the staff member
        const label = {
            icon: null, // Default icon
            title: `${capitalizeFirstLetter(employee.staff_fname)} ${capitalizeFirstLetter(employee.staff_lname)}`, // Full name with capitalized first letters
            subtitle: capitalizeFirstLetter(employee.position || 'no position'), // Capitalize position or fallback
            department: employee.dept
        };

        // Initialize data for employee arrangements
        const employeeData = {
            id: staffId.toString(), // Unique staff id
            label: label,
            data: [], // Initialize as an empty array
        };

        // Check if there are arrangements for the staff member
        if (employee.arrangements && employee.arrangements.length > 0) {
            employee.arrangements.forEach((arrangement) => {
                // Check if status is 'approved' and start_date and end_date are not null
                if (
                    arrangement.status === "approved" &&
                    arrangement.start_date &&
                    arrangement.end_date && 
                    arrangement.location === "home"
                ) {
                    let startDate, endDate, bgColor;

                    // Set start and end dates and bgColor based on type
                    if (arrangement.type === "full-day") {
                        startDate = new Date(
                            `${arrangement.start_date}T09:00:00`
                        );
                        endDate = new Date(`${arrangement.end_date}T18:00:00`);
                        bgColor = "#b5cbcc"; // Full-day background color
                    } else if (arrangement.type === "morning") {
                        startDate = new Date(
                            `${arrangement.start_date}T09:00:00`
                        );
                        endDate = new Date(`${arrangement.end_date}T13:00:00`);
                        bgColor = "#cddeef"; // Morning background color
                    } else if (arrangement.type === "afternoon") {
                        startDate = new Date(
                            `${arrangement.start_date}T14:00:00`
                        );
                        endDate = new Date(`${arrangement.end_date}T18:00:00`);
                        bgColor = "#f3dbbe"; // Afternoon background color
                    } else {
                        // Default case, for other types
                        startDate = new Date(
                            `${arrangement.start_date}T08:00:00`
                        );
                        endDate = new Date(`${arrangement.end_date}T18:00:00`);
                        bgColor =
                            arrangement.location === "home"
                                ? "rgb(254,165,177)"
                                : "green";
                    }

                    // Add initial arrangement
                    employeeData.data.push({
                        id: arrangement.arrangement_id.toString(), // Use arrangement_id as unique id
                        startDate: startDate,
                        endDate: endDate,
                        occupancy: null, // Set occupancy or default to 3600
                        title: arrangement.location === 'home' ? 'WFH' : 'Office',
                        subtitle: capitalizeFirstLetter(arrangement.type),
                        description: arrangement.reason || 'No reason provided', // Fallback to 'No reason provided'
                        bgColor: bgColor
                    });

                    // Handle recurrence pattern
                    if (arrangement.recurrence_pattern) {
                        const recurrenceStartDate = new Date(startDate);
                        const recurrenceEndDate = new Date(endDate);
                        const threeMonthsLater = new Date(recurrenceStartDate);
                        threeMonthsLater.setMonth(
                            threeMonthsLater.getMonth() + 3
                        );

                        let intervalDays;
                        if (arrangement.recurrence_pattern === "weekly") {
                            intervalDays = 7; // Every week
                        } else if (
                            arrangement.recurrence_pattern === "bi-weekly"
                        ) {
                            intervalDays = 14; // Every two weeks
                        } else if (
                            arrangement.recurrence_pattern === "monthly"
                        ) {
                            intervalDays = 30; // Approximately every month (adjust if needed for exact month duration)
                        }

                        // Repeat arrangement for the duration based on the recurrence pattern
                        let recurrenceCount = 0; // To ensure unique IDs
                        while (recurrenceStartDate < threeMonthsLater) {
                            if (arrangement.recurrence_pattern === "monthly") {
                                recurrenceStartDate.setMonth(
                                    recurrenceStartDate.getMonth() + 1
                                );
                                recurrenceEndDate.setMonth(
                                    recurrenceEndDate.getMonth() + 1
                                );
                            } else {
                                recurrenceStartDate.setDate(
                                    recurrenceStartDate.getDate() + intervalDays
                                );
                                recurrenceEndDate.setDate(
                                    recurrenceEndDate.getDate() + intervalDays
                                );
                            }

                            if (recurrenceStartDate < threeMonthsLater) {
                                // Generate a unique ID for each recurring arrangement
                                employeeData.data.push({
                                    id: `${arrangement.arrangement_id}-${recurrenceCount}`, // Unique ID for each recurring arrangement
                                    startDate: new Date(recurrenceStartDate),
                                    endDate: new Date(recurrenceEndDate),
                                    occupancy: null, // Set occupancy or default
                                    title: arrangement.location === 'home' ? 'WFH' : 'Office',
                                    subtitle: capitalizeFirstLetter(arrangement.type),
                                    description: arrangement.reason || 'No reason provided',
                                    bgColor: bgColor
                                });
                                recurrenceCount++; // Increment count for unique ID
                            }
                        }
                    }
                }
            });
        }

        // Return employee data with arrangements or empty data
        return employeeData;
    });
}



const GanttChart = ({ arrangements, isLoading }) => {
    // Transform the employee data into the required format
    console.log("Arrangement:", arrangements);

    console.log("Arrangements Input Data:", arrangements);

    const transformedData = transformEmployeeData(arrangements);

    // Log the transformed data to the console
    console.log("Transformed Employee Data:", transformedData);

    return (
        <div style={{ position: "relative", width: "auto", height: "600px" }}>
            <Scheduler
            isLoading={isLoading}
            data={transformedData}
            config={{
                filterButtonState: -1,
                zoom: 1,
                lang: "en",
                maxRecordsPerPage: 20,
                showTooltip: false,
                showThemeToggle: true
            }}
        />
        </div>
    );
};

export default GanttChart;
