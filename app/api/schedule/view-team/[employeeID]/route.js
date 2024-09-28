import { supabase } from "../../../../../supabaseClient";
import { NextResponse } from "next/server";

// Handling GET requests
export async function GET(request, { params }) {
  // Extract the employeeID from the dynamic route parameters
  const { employeeID } = params;

  if (!employeeID) {
    return NextResponse.json(
      { message: "Employee ID is required" },
      { status: 400 }
    );
  }

  try {
    // Retrieve the reporting manager for the given employeeID
    const { data: employeeData, error: employeeError } = await supabase
      .from("employee")
      .select("reporting_manager")
      .eq("staff_id", employeeID)
      .single();

    if (employeeError || !employeeData) {
      return NextResponse.json(
        {
          message: "Employee not found or error retrieving data",
          error: employeeError,
        },
        { status: 404 }
      );
    }

    const reportingManagerID = employeeData.reporting_manager;

    // Retrieve all employees with the same reporting manager
    const { data: teamData, error: teamError } = await supabase
      .from("employee")
      .select("staff_id, staff_fname, staff_lname, position")
      .eq("reporting_manager", reportingManagerID);

    if (teamError || teamData.length === 0) {
      return NextResponse.json(
        {
          message: "No team members found or error retrieving data",
          error: teamError,
        },
        { status: 404 }
      );
    }

    // Extract the IDs of the team members
    const teamMemberIDs = teamData.map((member) => member.staff_id);

    // Fetch work arrangements from the Supabase database for all team members
    const { data: arrangements, error: arrangementsError } = await supabase
      .from("arrangement")
      .select("*")
      .in("staff_id", teamMemberIDs);

    if (arrangementsError) {
      return NextResponse.json(
        {
          message: "Error fetching work arrangements",
          error: arrangementsError,
        },
        { status: 500 }
      );
    }

    // Merge employee details with arrangements
    const enrichedArrangements = arrangements.map((arrangement) => {
      const employee = teamData.find(
        (member) => member.staff_id === arrangement.staff_id
      );
      return {
        ...arrangement,
        employee: {
          staff_fname: employee.staff_fname,
          staff_lname: employee.staff_lname,
          position: employee.position,
        },
      };
    });

    // Respond with the enriched arrangements
    return NextResponse.json(enrichedArrangements, { status: 200 });
  } catch (error) {
    // Handle any unexpected errors
    return NextResponse.json(
      { message: "Unexpected error occurred", error },
      { status: 500 }
    );
  }
}
