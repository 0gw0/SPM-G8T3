"use client"

import React from "react";
import Calendar from "@/components/calendar"; // Adjust the import path based on your folder structure

const OwnSchedule = () => {
    return (
        <div>
            <h1>My Schedule</h1>
            {/* Render the calendar component */}
            <Calendar />
        </div>
    );
};

export default OwnSchedule;
