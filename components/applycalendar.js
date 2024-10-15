import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const ApplyCalendar = ({ arrangements, onDatesChange }) => {
    const getDateString = (date) => {
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const day = ("0" + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const todayStr = getDateString(today);
    const maxDate = new Date(
        today.getFullYear() + 1,
        today.getMonth(),
        today.getDate()
    );
    const maxDateStr = getDateString(maxDate);

    const [selectedDates, setSelectedDates] = useState([]);
    const existingDatesSet = new Set(arrangements.map((arr) => arr.date));

    const clickTimeout = useRef(null);

    const selectedDateEvents = selectedDates.map((date) => ({
        title: "Selected",
        start: date,
        allDay: true,
        backgroundColor: "blue",
        textColor: "white",
    }));

    const arrangementEvents = arrangements.map((arrangement) => {
        const backgroundColor =
            arrangement.status === "approved" ? "green" : "yellow";
        const textColor = arrangement.status === "pending" ? "black" : "white";

        return {
            title: arrangement.type,
            start: arrangement.date,
            allDay: true,
            backgroundColor,
            textColor,
            extendedProps: { status: arrangement.status },
        };
    });

    const dayCellClassNames = (arg) => {
        const cellDateStr = getDateString(arg.date);
        let classes = [];

        if (cellDateStr < todayStr || cellDateStr > maxDateStr) {
            classes.push("disabled-date");
        }
        if (existingDatesSet.has(cellDateStr)) {
            classes.push("existing-arrangement");
        }
        return classes;
    };

    const handleDateSelect = (selectInfo) => {
        clearTimeout(clickTimeout.current);

        const { start, end } = selectInfo;
        const endDate = new Date(end.getTime() - 1);

        let dates = [];
        let currentDate = new Date(start);

        while (currentDate <= endDate) {
            const dateStr = getDateString(currentDate);

            if (
                existingDatesSet.has(dateStr) ||
                dateStr < todayStr ||
                dateStr > maxDateStr
            ) {
                alert(`Invalid selection: ${dateStr}`);
                return;
            }
            dates.push(dateStr);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        setSelectedDates(dates); // Clear previous and set new range
        selectInfo.view.calendar.unselect();
    };

    const handleDateClick = (dateClickInfo) => {
        const dateStr = getDateString(dateClickInfo.date);

        if (
            existingDatesSet.has(dateStr) ||
            dateStr < todayStr ||
            dateStr > maxDateStr
        ) {
            alert(`Cannot select date ${dateStr}.`);
            return;
        }

        clickTimeout.current = setTimeout(() => {
            setSelectedDates([dateStr]); // Clear previous and set new single date
        }, 100);
    };

    useEffect(() => {
        if (onDatesChange) {
            const datesDict = {};
            selectedDates.forEach((date) => {
                datesDict[date] = "Full-day-WFH";
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
                right: "dayGridMonth",
            }}
            height="auto"
            validRange={{ start: todayStr, end: maxDateStr }}
            events={[...arrangementEvents, ...selectedDateEvents]}
            selectable={true}
            selectMirror={true}
            dayCellClassNames={dayCellClassNames}
            select={handleDateSelect}
            dateClick={handleDateClick}
            unselectAuto={false}
        />
    );
};

export default ApplyCalendar;
