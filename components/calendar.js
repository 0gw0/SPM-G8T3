import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

const Calendar = () => {
    // Handler to dynamically grey out previous days
    const dayCellDidMount = (info) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to 00:00 for comparison
        const cellDate = new Date(info.date);
        cellDate.setHours(0, 0, 0, 0); // Reset time to 00:00 for comparison

        if (cellDate < today) {
            info.el.style.backgroundColor = "#e0e0e0"; // Grey out past days
            info.el.style.pointerEvents = "none"; // Disable interaction with past dates
        }
    };

    // Handler to prevent selection of past dates
    const selectAllow = (selectInfo) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to 00:00 for comparison

        const startDate = new Date(selectInfo.start);
        startDate.setHours(0, 0, 0, 0); // Reset time to 00:00 for comparison

        return startDate >= today; // Allow selection only if the start date is today or in the future
    };

    return (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            height="auto"
            aspectRatio={1.5}
            views={{
                listWeek: {
                    buttonText: "List",
                },
            }}
            // Attach the dayCellDidMount function to dynamically disable past dates
            dayCellDidMount={dayCellDidMount}
            // Prevent users from selecting past dates
            selectAllow={selectAllow}
        />
    );
};

export default Calendar;
