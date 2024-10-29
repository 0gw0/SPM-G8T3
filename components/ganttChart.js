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
            icon: null,
            title: `${capitalizeFirstLetter(employee.staff_fname)} ${capitalizeFirstLetter(employee.staff_lname)}`,
            subtitle: capitalizeFirstLetter(employee.position || 'no position'),
            department: employee.dept
        };

        // Initialize data for employee arrangements
        const employeeData = {
            id: staffId.toString(),
            label: label,
            data: [],
        };

        // Check if there are arrangements for the staff member
        if (employee.arrangements && employee.arrangements.length > 0) {
            employee.arrangements.forEach((arrangement) => {
                if (
                    arrangement.status === "approved" &&
                    arrangement.start_date &&
                    arrangement.end_date && 
                    arrangement.location === "home"
                ) {
                    let startDate, bgColor;

                    // Set start date and bgColor based on type, using same-day end
                    if (arrangement.type === "full-day") {
                        startDate = new Date(`${arrangement.start_date}T09:00:00`);
                        bgColor = "#b5cbcc"; // Full-day background color
                    } else if (arrangement.type === "morning") {
                        startDate = new Date(`${arrangement.start_date}T09:00:00`);
                        bgColor = "#cddeef"; // Morning background color
                    } else if (arrangement.type === "afternoon") {
                        startDate = new Date(`${arrangement.start_date}T14:00:00`);
                        bgColor = "#f3dbbe"; // Afternoon background color
                    } else {
                        startDate = new Date(`${arrangement.start_date}T08:00:00`);
                        bgColor = arrangement.location === "home" ? "rgb(254,165,177)" : "green";
                    }

                    // Calculate the end time based on the start time and type
                    let durationHours = arrangement.type === "full-day" ? 9 : 4;
                    let endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

                    // Handle one-time arrangements
                    if (arrangement.recurrence_pattern === "one-time" || !arrangement.recurrence_pattern) {
                        employeeData.data.push({
                            id: arrangement.arrangement_id.toString(),
                            startDate: startDate,
                            endDate: endDate,
                            occupancy: null,
                            title: arrangement.location === 'home' ? 'WFH' : 'Office',
                            subtitle: capitalizeFirstLetter(arrangement.type),
                            description: arrangement.reason || 'No reason provided',
                            bgColor: bgColor
                        });
                    }
                    // Handle recurring arrangements
                    else if (arrangement.recurrence_pattern) {
                        const recurrenceEndDate = new Date(arrangement.end_date);
                        let recurrenceDate = new Date(startDate);
                        let intervalDays;

                        if (arrangement.recurrence_pattern === "weekly") {
                            intervalDays = 7;
                        } else if (arrangement.recurrence_pattern === "bi-weekly") {
                            intervalDays = 14;
                        } else if (arrangement.recurrence_pattern === "monthly") {
                            intervalDays = 30;
                        }

                        let recurrenceCount = 0;
                        while (recurrenceDate <= recurrenceEndDate) {
                            employeeData.data.push({
                                id: `${arrangement.arrangement_id}-${recurrenceCount}`,
                                startDate: new Date(recurrenceDate),
                                endDate: new Date(recurrenceDate.getTime() + durationHours * 60 * 60 * 1000),
                                occupancy: null,
                                title: arrangement.location === 'home' ? 'WFH' : 'Office',
                                subtitle: capitalizeFirstLetter(arrangement.type),
                                description: arrangement.reason || 'No reason provided',
                                bgColor: bgColor
                            });
                            recurrenceCount++;

                            if (arrangement.recurrence_pattern === "monthly") {
                                recurrenceDate.setMonth(recurrenceDate.getMonth() + 1);
                            } else {
                                recurrenceDate.setDate(recurrenceDate.getDate() + intervalDays);
                            }
                        }
                    }
                }
            });
        }

        return employeeData;
    });
}

// Legend component
const Legend = () => (
    <div className="flex justify-center items-center mt-4">
        <div className="flex space-x-4 items-center font-sans">
            {[
                { color: "#b5cbcc", label: "Full Day WFH" },
                { color: "#cddeef", label: "AM WFH" },
                { color: "#f3dbbe", label: "PM WFH" }
            ].map(({ color, label }) => (
                <div key={label} className="flex items-center space-x-2">
                    <div className="w-5 h-5" style={{ backgroundColor: color }}></div>
                    <span>{label}</span>
                </div>
            ))}
        </div>
    </div>
);

const GanttChart = ({ arrangements, isLoading }) => {
    const transformedData = transformEmployeeData(arrangements);

    return (
        <div>
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
                        showThemeToggle: true,
                    }}
                />
            </div>
            <Legend />
        </div>
    );
};

export default GanttChart;