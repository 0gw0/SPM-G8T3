import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import React from "react";

// Function to transform the employee's arrangements into calendar events
export function transformArrangementsToEvents(arrangements) {
    const events = [];

    arrangements.forEach((arrangement) => {
        if (
            arrangement.status &&
            arrangement.start_date &&
            arrangement.end_date
        ) {
            let startDate, endDate, bgColor, textColor;

            // Set dates based on arrangement type
            if (arrangement.type === "full-day") {
                startDate = `${arrangement.start_date}T09:00:00`;
                endDate = `${arrangement.end_date}T18:00:00`;
            } else if (arrangement.type === "morning") {
                startDate = `${arrangement.start_date}T09:00:00`;
                endDate = `${arrangement.end_date}T13:00:00`;
            } else if (arrangement.type === "afternoon") {
                startDate = `${arrangement.start_date}T14:00:00`;
                endDate = `${arrangement.end_date}T18:00:00`;
            } else {
                startDate = `${arrangement.start_date}T08:00:00`;
                endDate = `${arrangement.end_date}T18:00:00`;
            }

            // Set background color based on status and location
            if (arrangement.status === "approved") {
                bgColor = "green"; // Green for approved
            } else if (arrangement.status === "pending") {
                bgColor = "yellow"; // Yellow for pending
                textColor = "black"; // Black text for better contrast
            } else  {
                bgColor = "blue"; // Blue for office work
            } 

            // Add the main event
            events.push({
                id: arrangement.arrangement_id.toString(),
                title: arrangement.location === "home" ? "WFH" : "Office",
                start: startDate,
                end: endDate,
                backgroundColor: bgColor,
                textColor: textColor || "black", // Apply text color if specified
                allDay: false,
                extendedProps: {
                    status: arrangement.status,
                    description: arrangement.reason || "No reason provided",
                },
            });

            // Handle recurring events if applicable
            if (arrangement.recurrence_pattern) {
                const recurringEvents = generateRecurringEvents(
                    arrangement,
                    startDate,
                    endDate,
                    bgColor
                );
                events.push(...recurringEvents);
            }
        }
    });

    return events;
}

// Function to generate recurring events based on the recurrence pattern
function generateRecurringEvents(arrangement, startDate, endDate, bgColor) {
    const recurringEvents = [];
    const recurrenceStart = new Date(startDate);
    const recurrenceEnd = new Date(endDate);
    const threeMonthsLater = new Date(recurrenceStart);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3); // Recurrence window

    let intervalDays;
    switch (arrangement.recurrence_pattern) {
        case "weekly":
            intervalDays = 7;
            break;
        case "bi-weekly":
            intervalDays = 14;
            break;
        case "monthly":
            intervalDays = 30; // Approximate monthly recurrence
            break;
        default:
            intervalDays = null;
    }

    let recurrenceCount = 0;
    while (recurrenceStart < threeMonthsLater) {
        if (arrangement.recurrence_pattern === "monthly") {
            recurrenceStart.setMonth(recurrenceStart.getMonth() + 1);
            recurrenceEnd.setMonth(recurrenceEnd.getMonth() + 1);
        } else if (intervalDays) {
            recurrenceStart.setDate(recurrenceStart.getDate() + intervalDays);
            recurrenceEnd.setDate(recurrenceEnd.getDate() + intervalDays);
        }

        if (recurrenceStart < threeMonthsLater) {
            recurringEvents.push({
                id: `${arrangement.arrangement_id}-${recurrenceCount}`, // Unique ID
                title: arrangement.location === "home" ? "WFH" : "Office",
                start: new Date(recurrenceStart).toISOString(),
                end: new Date(recurrenceEnd).toISOString(),
                backgroundColor: bgColor,
                allDay: false,
                extendedProps: {
                    status: arrangement.status,
                    description: arrangement.reason || "No reason provided",
                },
            });
            recurrenceCount++;
        }
    }

    return recurringEvents;
}

const Calendar = ({ arrangements, isLoading }) => {
    const events = transformArrangementsToEvents(arrangements);

    const renderEventContent = (eventInfo) => {
        const { title, extendedProps } = eventInfo.event;
        const status = extendedProps?.status ? `(${extendedProps.status})` : "";

        return (
            <div>
                <b>{title}</b> {status}
            </div>
        );
    };

    return (
        <div style={{ position: "relative", width: "auto", height: "600px" }}>
            <FullCalendar
                plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    interactionPlugin,
                    listPlugin,
                ]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                }}
                height="auto"
                aspectRatio={1.35}
                events={events}
                eventContent={renderEventContent}
                loading={isLoading}
            />
        </div>
    );
};

export default Calendar;
