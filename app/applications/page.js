"use client";

import React, { useState, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list"; // Import listPlugin for list views
import styles from "../styles/applications.module.css"; // Import the CSS module

import {
    fetchApprovedArrangements,
    formatDate,
} from "../api/applications/route.js"; // Import service functions

const ApprovedArrangements = () => {
    // State Variables
    const [arrangements, setArrangements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDates, setSelectedDates] = useState([]);
    const [statusMessage, setStatusMessage] = useState(null);
    const [isError, setIsError] = useState(false);

    // Fetch Data on Component Mount
    useEffect(() => {
        const getData = async () => {
            try {
                setLoading(true);
                setStatusMessage("Fetching approved arrangements...");
                setIsError(false);
                const { data, error } = await fetchApprovedArrangements();

                if (error) throw error;

                console.log("Fetched data:", data);

                setArrangements(data);
                setStatusMessage("Successfully fetched approved arrangements.");
            } catch (error) {
                setError("Failed to fetch approved arrangements");
                console.error("Error:", error);
                setStatusMessage("Error fetching approved arrangements.");
                setIsError(true);
            } finally {
                setLoading(false);
                setTimeout(() => setStatusMessage(null), 3000);
            }
        };

        getData();
    }, []);

    // Event Data for FullCalendar
    const events = useMemo(() => {
        return arrangements.map((arrangement) => ({
            id: arrangement.arrangement_id.toString(),
            title: `${arrangement.employee?.staff_fname || "Unknown"} ${
                arrangement.employee?.staff_lname || "Employee"
            } - ${arrangement.type}`,
            start: arrangement.date,
            allDay: true,
            extendedProps: {
                location: arrangement.location,
            },
            backgroundColor: "#1e90ff",
            borderColor: "#1e90ff",
            textColor: "#ffffff",
        }));
    }, [arrangements]);

    // Handler for Date Click
    const handleDateClick = (dateInfo) => {
        console.log("Date clicked:", dateInfo.date);
        const clickedDate = formatDate(dateInfo.date);

        const date = new Date(clickedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) {
            setStatusMessage("Cannot select past dates.");
            setIsError(true);
            setTimeout(() => setStatusMessage(null), 3000);
            return;
        }

        const isConflict = events.some((event) => event.start === clickedDate);

        if (isConflict) {
            alert("Cannot select a date that already has an arrangement.");
            return;
        }

        if (selectedDates.includes(clickedDate)) {
            setSelectedDates(selectedDates.filter((d) => d !== clickedDate));
            setStatusMessage(
                `Unselected ${new Date(clickedDate).toLocaleDateString()}`
            );
            setIsError(false);
            setTimeout(() => setStatusMessage(null), 3000);
        } else {
            setSelectedDates([...selectedDates, clickedDate]);
            setStatusMessage(
                `Selected ${new Date(clickedDate).toLocaleDateString()}`
            );
            setIsError(false);
            setTimeout(() => setStatusMessage(null), 3000);
        }
    };

    // Handler for Range Selection
    const handleSelect = (selectInfo) => {
        const { start, end } = selectInfo;

        // Calculate the number of days selected
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            // Single date selection; ignore and let dateClick handle it
            return;
        }

        // Proceed with range selection
        const dates = [];
        let current = new Date(start);
        const lastDate = new Date(end);
        lastDate.setDate(lastDate.getDate() - 1);

        while (current <= lastDate) {
            dates.push(formatDate(current));
            current.setDate(current.getDate() + 1);
        }

        const newSelectedDates = dates.filter((date) => {
            const dateObj = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isPast = dateObj < today;
            const isConflict = events.some((event) => event.start === date);
            const isAlreadySelected = selectedDates.includes(date);
            return !isPast && !isConflict && !isAlreadySelected;
        });

        if (newSelectedDates.length === 0) {
            setStatusMessage(
                "No new dates were selected (possible conflicts or past dates)."
            );
            setIsError(true);
            setTimeout(() => setStatusMessage(null), 3000);
            return;
        }

        setSelectedDates([...selectedDates, ...newSelectedDates]);
        setStatusMessage(
            `Selected ${newSelectedDates.length} date(s): ${newSelectedDates
                .map((d) => new Date(d).toLocaleDateString())
                .join(", ")}`
        );
        setIsError(false);

        selectInfo.view.calendar.unselect();
        setTimeout(() => setStatusMessage(null), 5000);
    };

    // Handler for Submit Button
    const handleSubmit = () => {
        console.log("Submit button clicked. Selected dates:", selectedDates);
        // Future implementation goes here
    };

    // Function to Allow Selection Only for Future Dates
    const selectAllow = (selectInfo) => {
        const { start } = selectInfo;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return false;
        }

        return true;
    };

    // Convert Selected Dates to a Set for Efficient Lookup
    const selectedDatesSet = useMemo(
        () => new Set(selectedDates),
        [selectedDates]
    );

    // Conditional Rendering Based on Loading and Error States
    if (loading) return <div className={styles.container}>Loading...</div>;
    if (error) return <div className={styles.container}>Error: {error}</div>;

    return (
        <div className={styles.container}>
            <h2 className={styles.header}>Arrangement Application</h2>

            {/* FullCalendar Integration */}
            <div className={styles.calendarContainer}>
                <FullCalendar
                    plugins={[
                        dayGridPlugin,
                        timeGridPlugin,
                        interactionPlugin,
                        listPlugin,
                    ]} // Include all necessary plugins
                    initialView="dayGridMonth"
                    events={events}
                    selectable={true}
                    select={handleSelect}
                    dateClick={handleDateClick}
                    selectAllow={selectAllow}
                    dayCellClassNames={(arg) => {
                        const date = new Date(arg.date);
                        const today = new Date();
                        date.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);

                        const formattedDate = formatDate(date);
                        let classes = [];

                        if (date < today) {
                            classes.push("disabled-date");
                        }

                        if (selectedDatesSet.has(formattedDate)) {
                            classes.push("selected-date");
                        }

                        return classes;
                    }}
                    headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek", // Corrected view names and added listWeek
                    }}
                    height="auto"
                    aspectRatio={1.5} // Adjust aspect ratio as needed
                    views={{
                        listWeek: {
                            buttonText: "List",
                        },
                    }}
                />
            </div>

            {/* Status Message */}
            {statusMessage && (
                <p
                    className={styles.statusMessage}
                    style={{ color: isError ? "red" : "green" }}
                >
                    {statusMessage}
                </p>
            )}

            {/* Selected Dates */}
            <div className={styles.selectedDates}>
                <h3 className={styles.subheader}>Selected Dates:</h3>
                {selectedDates.length === 0 ? (
                    <p>No dates selected.</p>
                ) : (
                    <ul>
                        {selectedDates.sort().map((date) => (
                            <li key={date}>
                                {new Date(date).toLocaleDateString()}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={selectedDates.length === 0}
                className={styles.submitButton}
                aria-label="Submit selected dates"
            >
                Submit Selected Dates
            </button>

            {/* Arrangements List */}
            <div className={styles.arrangementsList}>
                <h3 className={styles.subheader}>Arrangements List:</h3>
                <ul>
                    {arrangements.map((arrangement) => (
                        <li key={arrangement.arrangement_id}>
                            {arrangement.employee?.staff_fname || "Unknown"}{" "}
                            {arrangement.employee?.staff_lname || "Employee"} -{" "}
                            {new Date(arrangement.date).toLocaleDateString()} -{" "}
                            {arrangement.type} - {arrangement.location}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ApprovedArrangements;
