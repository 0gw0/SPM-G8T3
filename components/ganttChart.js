import { Scheduler } from "@bitnoi.se/react-scheduler";
import React from "react";

const GanttChart = ({ arrangements, isLoading }) => {
  const transformedData = arrangements.map((arrangement) => ({
    id: arrangement.arrangement_id.toString(),  // Use arrangement_id as unique id (ensure it's a string)
    label: {
      icon: null, // Set icon to null as required
      title: `${arrangement.employee.staff_fname} ${arrangement.employee.staff_lname}`, // Full name as title
      subtitle: arrangement.employee.dept, // Use dept as subtitle
    },
    data: [
      {
        id: arrangement.arrangement_id.toString(), // Use arrangement_id again (ensure it's a string)
        startDate: new Date(arrangement.start_date), // Convert date string to Date object
        endDate: arrangement.end_date ? new Date(arrangement.end_date) : new Date(arrangement.start_date), // Handle null end_date
        occupancy: null, // Set occupancy to null
        title: arrangement.reason, // Set the title from the reason
        subtitle: arrangement.location, // Use location as subtitle
        description: arrangement.comments, // Optional: add comments as a description
        bgColor: "rgb(254,165,177)", // Fixed background color
      }
    ]
  }));

  return (
    <Scheduler
      // Decide when to show loading indicators
      isLoading={isLoading}
      // Your data
      data={transformedData}
      // Callback when user clicks on one of the grid's tile
      onItemClick={(clickedItem) => console.log(clickedItem)}
      // Filter function that lets you handle filtering on your end
      onFilterData={() => {
        // Filter your data logic
      }}
      // Callback when user clicks clearing filter button
      onClearFilterData={() => {
        // Clear all your filters logic
      }}
      config={{
        /* 
          Change filter button state based on your filters
          < 0 - filter button invisible,
          0 - filter button visible, no filter applied, clear filters button invisible,
          > 0 - filter button visible, filters applied (clear filters button will be visible)
        */
        filterButtonState: 0,
        // Decide start zoom variant (0 - weeks, 1 - days)
        zoom: 0,
        // Select language for scheduler
        lang: "en",
        // Decide how many resources show per one page
        maxRecordsPerPage: 20,
      }}
    />
  );
}

export default GanttChart;
