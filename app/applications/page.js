"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
);

const ApprovedArrangements = () => {
    const [arrangements, setArrangements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDates, setSelectedDates] = useState([]);
    const [statusMessage, setStatusMessage] = useState(null);

    useEffect(() => {
        fetchApprovedArrangements();
    }, []);

    const fetchApprovedArrangements = async () => {
        try {
            setLoading(true);
            setStatusMessage("Fetching approved arrangements...");
            const { data, error } = await supabase
                .from("arrangement")
                .select(`*,employee:staff_id (staff_fname, staff_lname)`)
                .eq("status", "approved")
                .order("date", { ascending: true });

            if (error) throw error;

            console.log("Fetched data:", data);

            setArrangements(data);
            setStatusMessage("Successfully fetched approved arrangements.");
        } catch (error) {
            setError("Failed to fetch approved arrangements");
            console.error("Error:", error);
            setStatusMessage("Error fetching approved arrangements.");
        } finally {
            setLoading(false);
            setTimeout(() => setStatusMessage(null), 3000);
        }
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

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

    const handleDateClick = (dateInfo) => {
        console.log("Date clicked:", dateInfo.date);
        const clickedDate = formatDate(dateInfo.date);

        const date = new Date(clickedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) {
            setStatusMessage("Cannot select past dates.");
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
            setTimeout(() => setStatusMessage(null), 3000);
        } else {
            setSelectedDates([...selectedDates, clickedDate]);
            setStatusMessage(
                `Selected ${new Date(clickedDate).toLocaleDateString()}`
            );
            setTimeout(() => setStatusMessage(null), 3000);
        }
    };

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
            setTimeout(() => setStatusMessage(null), 3000);
            return;
        }

        setSelectedDates([...selectedDates, ...newSelectedDates]);
        setStatusMessage(
            `Selected ${newSelectedDates.length} date(s): ${newSelectedDates
                .map((d) => new Date(d).toLocaleDateString())
                .join(", ")}`
        );

        selectInfo.view.calendar.unselect();
        setTimeout(() => setStatusMessage(null), 5000);
    };

    const handleSubmit = () => {
        console.log("Submit button clicked. Selected dates:", selectedDates);
        // Future implementation goes here
    };

    const selectAllow = (selectInfo) => {
        const { start } = selectInfo;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return false;
        }

        return true;
    };

    const selectedDatesSet = useMemo(
        () => new Set(selectedDates),
        [selectedDates]
    );

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Approved Arrangements</h2>

            {/* Status Message */}
            {statusMessage && (
                <p
                    style={{
                        color:
                            statusMessage.includes("Error") ||
                            statusMessage.includes("Failed")
                                ? "red"
                                : "green",
                    }}
                >
                    {statusMessage}
                </p>
            )}

            {/* FullCalendar Integration */}
            <div style={{ marginBottom: "2rem" }}>
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
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
                        right: "dayGridMonth,dayGridWeek,dayGridDay",
                    }}
                    height="auto"
                />
            </div>

            {/* Selected Dates */}
            <div style={{ marginBottom: "1rem" }}>
                <h3>Selected Dates:</h3>
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
                style={{
                    padding: "10px 20px",
                    backgroundColor:
                        selectedDates.length === 0 ? "#ccc" : "#0070f3",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor:
                        selectedDates.length === 0 ? "not-allowed" : "pointer",
                }}
                aria-label="Submit selected dates"
            >
                Submit Selected Dates
            </button>

            {/* Arrangements List */}
            <h3>Arrangements List:</h3>
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
    );
};

export default ApprovedArrangements;
