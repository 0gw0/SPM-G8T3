import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

const ApplyCalendar = ({ arrangements }) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // 'YYYY-MM-DD'

    // Convert arrangements into FullCalendar events
    const events = arrangements.map((arrangement) => {
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

    // Function to add a class to past dates to grey them out
    const dayCellClassNames = (arg) => {
        const cellDateStr = arg.date.toISOString().split("T")[0]; // 'YYYY-MM-DD'

        if (cellDateStr < todayStr) {
            return ["disabled-date"]; // Add a custom class for disabled days
        }
        return [];
    };

    // Optional: Customize the event content to show status in List View
    const renderEventContent = (eventInfo) => {
        const { title, extendedProps } = eventInfo.event;
        const status = extendedProps?.status ? `(${extendedProps.status})` : "";

        return (
            <div>
                <b>{title}</b> {status}{" "}
                {/* Display the event type and status */}
            </div>
        );
    };

    return (
        <FullCalendar
            plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
                listPlugin,
            ]} // Include timeGridPlugin
            initialView="dayGridMonth"
            headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek", // Week, Day, and List views
            }}
            height="auto"
            aspectRatio={1.35} // Adjust the aspect ratio to prevent extended cells
            events={[...events]} // Merge events with default ones
            eventContent={renderEventContent} // Optional: Customize event content in list view
            selectable={true} // Enable date selection
            selectMirror={true} // Show a temporary event while selecting
            dayCellClassNames={dayCellClassNames} // Add class names to day cells
            selectAllow={(selectInfo) => {
                const selectedDateStr = selectInfo.start
                    .toISOString()
                    .split("T")[0];
                return selectedDateStr >= todayStr;
            }}
        />
    );
};

export default ApplyCalendar;
