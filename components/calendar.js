import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";  
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

const Calendar = ({ arrangements }) => {
    // Convert arrangements into FullCalendar events
    const events = arrangements.map(arrangement => {
        let backgroundColor = '';
        let textColor = '';

        if (arrangement.status === "approved") {
            backgroundColor = "green"; // Green for approved arrangements
        } else if (arrangement.status === "pending") {
            backgroundColor = "yellow"; // Yellow for pending arrangements
            textColor = "black"; // Black text for pending
        }

        return {
            title: arrangement.type,   // Display the arrangement type as the event title
            start: arrangement.date,   // Set the date of the event
            allDay: true,              // It's an all-day event
            backgroundColor: backgroundColor, // Set background color based on status
            textColor: textColor,      // Set text color based on status
            extendedProps: {
                status: arrangement.status // Add status as an extended prop for custom display
            }
        };
    });

    // Add default "Work in Office" events from today to one month in advance
    const defaultWorkInOfficeEvents = [];
    const today = new Date();
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(today.getMonth() + 1); // Set one month in advance

    for (let d = new Date(today); d <= oneMonthLater; d.setDate(d.getDate() + 1)) {
        // Check if the current date already has an arrangement
        const eventExists = events.some(event => new Date(event.start).toDateString() === d.toDateString());

        if (!eventExists) {
            defaultWorkInOfficeEvents.push({
                title: "Work in Office",
                start: new Date(d),
                allDay: true,
                backgroundColor: '', // Use default color
            });
        }
    }

    // Optional: Customize the event content to show status in List View
    const renderEventContent = (eventInfo) => {
        const { title, extendedProps } = eventInfo.event;
        const status = extendedProps?.status ? `(${extendedProps.status})` : '';

        return (
            <div>
                <b>{title}</b> {status} {/* Display the event type and status */}
            </div>
        );
    };

    return (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}  // Include timeGridPlugin
            initialView="dayGridMonth"
            headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",  // Week, Day, and List views
            }}
            height="auto"
            aspectRatio={1.35} // Adjust the aspect ratio to prevent extended cells
            events={[...events, ...defaultWorkInOfficeEvents]} // Merge events with default ones
            eventContent={renderEventContent}  // Optional: Customize event content in list view
        />
    );
};

export default Calendar;
