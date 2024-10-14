import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const ApplyCalendar = ({ arrangements, onDatesChange }) => {
    // Helper function to get date string in 'YYYY-MM-DD' format (local timezone)
    const getDateString = (date) => {
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are zero-based
        const day = ("0" + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const todayStr = getDateString(today);

    // Define the maximum selectable date (exactly 1 year from today)
    const maxDate = new Date(
        today.getFullYear() + 1,
        today.getMonth(),
        today.getDate()
    );
    const maxDateStr = getDateString(maxDate);

    // State to keep track of selected dates
    const [selectedDates, setSelectedDates] = useState([]);

    // Create a set of dates that already have arrangements
    const existingDatesSet = new Set(arrangements.map((arr) => arr.date));

    // Convert selected dates into events to highlight them in the calendar
    const selectedDateEvents = selectedDates.map((date) => ({
        title: "Selected",
        start: date,
        allDay: true,
        backgroundColor: "blue",
        textColor: "white",
    }));

    // Convert arrangements into FullCalendar events
    const arrangementEvents = arrangements.map((arrangement) => {
        let backgroundColor = "";
        let textColor = "";

        if (arrangement.status === "approved") {
            backgroundColor = "green"; // Green for approved arrangements
        } else if (arrangement.status === "pending") {
            backgroundColor = "yellow"; // Yellow for pending arrangements
            textColor = "black"; // Black text for pending
        }

        return {
            title: arrangement.type, // Display the arrangement type as the event title
            start: arrangement.date, // Set the date of the event
            allDay: true, // It's an all-day event
            backgroundColor: backgroundColor, // Set background color based on status
            textColor: textColor, // Set text color based on status
            extendedProps: {
                status: arrangement.status, // Add status as an extended prop for custom display
            },
        };
    });

    // Function to add classes to day cells
    const dayCellClassNames = (arg) => {
        const date = arg.date;
        const cellDateStr = getDateString(date);
        let classes = [];

        if (cellDateStr < todayStr || cellDateStr > maxDateStr) {
            classes.push("disabled-date"); // Add a custom class for disabled days
        }

        if (existingDatesSet.has(cellDateStr)) {
            classes.push("existing-arrangement"); // Custom class for dates with existing arrangements
        }

        return classes;
    };

    // Handle date selection (range selection)
    const handleDateSelect = (selectInfo) => {
        let startDate = selectInfo.start;
        let endDate = new Date(selectInfo.end.getTime() - 1); // Adjust end date

        let dates = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            let dateStr = getDateString(currentDate);

            if (dateStr < todayStr || dateStr > maxDateStr) {
                alert(
                    `Cannot select date ${dateStr} as it is outside the allowed range.`
                );
            } else if (existingDatesSet.has(dateStr)) {
                alert(
                    `Cannot select date ${dateStr} as it already has an arrangement.`
                );
            } else {
                dates.push(dateStr);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        setSelectedDates((prevDates) => {
            let newDates = [...prevDates];
            dates.forEach((date) => {
                if (!newDates.includes(date)) {
                    newDates.push(date);
                }
            });
            return newDates;
        });

        selectInfo.view.calendar.unselect(); // Clear the selection
    };

    // Handle date click (select/unselect individual dates)
    const handleDateClick = (dateClickInfo) => {
        let date = dateClickInfo.date;
        let dateStr = getDateString(date);

        if (dateStr < todayStr || dateStr > maxDateStr) {
            alert(
                `Cannot select date ${dateStr} as it is outside the allowed range.`
            );
            return;
        }

        if (existingDatesSet.has(dateStr)) {
            alert(
                `Cannot select date ${dateStr} as it already has an arrangement.`
            );
            return;
        }

        setSelectedDates((prevDates) => {
            if (prevDates.includes(dateStr)) {
                // Date is already selected, unselect it
                return prevDates.filter((date) => date !== dateStr);
            } else {
                // Date is not selected, select it
                return [...prevDates, dateStr];
            }
        });
    };

    // Pass selected dates back to parent component
    useEffect(() => {
        if (onDatesChange) {
            // Convert selectedDates array to datesDict
            let datesDict = {};
            selectedDates.forEach((date) => {
                datesDict[date] = "Full-day-WFH"; // Default status or allow user to choose
            });
            onDatesChange(datesDict);
        }
    }, [selectedDates, onDatesChange]);

    return (
        <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth", // Simplified for clarity
            }}
            height="auto"
            validRange={{
                start: todayStr,
                end: maxDateStr,
            }}
            events={[...arrangementEvents, ...selectedDateEvents]}
            selectable={true}
            selectMirror={true}
            selectMinDistance={1}
            dayCellClassNames={dayCellClassNames}
            selectAllow={(selectInfo) => {
                let startDate = selectInfo.start;
                let endDate = new Date(selectInfo.end.getTime() - 1); // Adjust end date

                let currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    let dateStr = getDateString(currentDate);
                    if (
                        existingDatesSet.has(dateStr) ||
                        dateStr < todayStr ||
                        dateStr > maxDateStr
                    ) {
                        return false;
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                return true;
            }}
            select={handleDateSelect}
            dateClick={handleDateClick}
            unselectAuto={false} // Prevent auto-unselect after selection
        />
    );
};

export default ApplyCalendar;
