"use server";
import { checkViewTeamPermission } from "@/utils/rolePermissions";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const handler = async (req, user, employee, isManagerOrDirector) => {
    const supabase = createClient();
    const staff_id = employee.staff_id;

    // Check if employee is an MD (reports to themselves)
    const isMD = employee.staff_id === employee.reporting_manager;

    try {
        if (isManagerOrDirector) {

            // Fetch managed team employees
            const { data: managerEmployees, error: managerEmpError } =
                await supabase
                    .from("employee")
                    .select(
                        "staff_id, staff_fname, staff_lname, dept, position"
                    )
                    .eq("reporting_manager", staff_id);

            if (managerEmpError) {
                console.error(
                    "Error fetching managed team employees:",
                    managerEmpError
                );
                return NextResponse.json(
                    { error: "Failed to fetch managed team employees" },
                    { status: 500 }
                );
            }

            // For MD Jack Sim, only return the managed team view
            if (isMD) {
                const managedTeam = await fetchArrangementsByStaff(
                    supabase,
                    managerEmployees,
                    employee
                );

                return NextResponse.json({
                    managedTeam: managedTeam,
                    role: employee.role,
                });
            }

            // For non-MD managers/directors, continue with both views
            const managedTeam = await fetchArrangementsByStaff(
                supabase,
                managerEmployees,
                employee
            );

            // Fetch the reporting manager's information (if not MD)
            const { data: reportingManager, error: reportingManagerError } =
                await supabase
                    .from("employee")
                    .select(
                        "staff_id, staff_fname, staff_lname, dept, position"
                    )
                    .eq("staff_id", employee.reporting_manager)
                    .single();

            if (
                reportingManagerError &&
                reportingManagerError.code !== "PGRST116"
            ) {
                console.error(
                    "Error fetching reporting manager:",
                    reportingManagerError
                );
                return NextResponse.json(
                    { error: "Failed to fetch reporting manager" },
                    { status: 500 }
                );
            }

            // Fetch all employees under the same reporting manager (teammates)
            const { data: teammates, error: teammatesError } = await supabase
                .from("employee")
                .select("staff_id, staff_fname, staff_lname, dept, position")
                .eq("reporting_manager", employee.reporting_manager);

            if (teammatesError) {
                console.error("Error fetching teammates:", teammatesError);
                return NextResponse.json(
                    { error: "Failed to fetch teammates" },
                    { status: 500 }
                );
            }

            // Include all teammates, reporting manager, and the logged-in employee
            const reportingManagerTeam = await fetchArrangementsByStaff(
                supabase,
                reportingManager ? [...teammates, reportingManager] : teammates,
                employee
            );

            return NextResponse.json({
                managedTeam: managedTeam,
                reportingManagerTeam: reportingManagerTeam,
                role: employee.role,
            });
        }
        // role 2 employees
        else {

            // Fetch the reporting manager's information
            const { data: reportingManager, error: reportingManagerError } =
                await supabase
                    .from("employee")
                    .select(
                        "staff_id, staff_fname, staff_lname, dept, position"
                    )
                    .eq("staff_id", employee.reporting_manager)
                    .single();

            if (
                reportingManagerError &&
                reportingManagerError.code !== "PGRST116"
            ) {
                console.error(
                    "Error fetching reporting manager:",
                    reportingManagerError
                );
                return NextResponse.json(
                    { error: "Failed to fetch reporting manager" },
                    { status: 500 }
                );
            }

            // Fetch all teammates under the same reporting manager
            const { data: teammates, error: teammatesError } = await supabase
                .from("employee")
                .select("staff_id, staff_fname, staff_lname, dept, position")
                .eq("reporting_manager", employee.reporting_manager);

            if (teammatesError) {
                console.error("Error fetching teammates:", teammatesError);
                return NextResponse.json(
                    { error: "Failed to fetch teammates" },
                    { status: 500 }
                );
            }

            // Combine teammates with reporting manager
            const allTeamMembers = reportingManager
                ? [...teammates, reportingManager]
                : teammates;

            // Ensure the logged-in employee is included with teammates, with the employee's data first
            const teamArrangements = await fetchArrangementsByStaff(
                supabase,
                allTeamMembers,
                employee
            );


            return NextResponse.json({
                teamMemberArrangements: teamArrangements,
                role: employee.role,
            });
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Unexpected error occurred", details: error },
            { status: 500 }
        );
    }
};

// Helper function to fetch and group arrangements by staff_id
async function fetchArrangementsByStaff(supabase, employees, loggedInEmployee) {
    const staffIds = employees.map((emp) => emp.staff_id);

    const { data: arrangements, error } = await supabase
        .from("arrangement")
        .select(
            `
            arrangement_id,
            staff_id,
            date,
            start_date,
            end_date,
            recurrence_pattern,
            type,
            status,
            location,
            reason,
            manager_id,
            created_at,
            comments,
            employee:staff_id (
                staff_fname,
                staff_lname,
                dept,
                position
            )
        `
        )
        .in("staff_id", staffIds)
        .order("date", { ascending: true });

    if (error) {
        console.error("Error fetching arrangements:", error);
        return [];
    }

    // Remove duplicates based on staff_id
    const uniqueEmployees = [
        loggedInEmployee,
        ...employees.filter(
            (emp) => emp.staff_id !== loggedInEmployee.staff_id
        )
    ].filter((emp, index, self) => 
        index === self.findIndex((e) => e.staff_id === emp.staff_id)
    );

    // Ensure all employees are included, even with empty arrangements
    const groupedArrangements = uniqueEmployees.map((employee) => ({
        staff_id: employee.staff_id,
        staff_fname: employee.staff_fname,
        staff_lname: employee.staff_lname,
        dept: employee.dept,
        position: employee.position,
        arrangements:
            arrangements.filter((arr) => arr.staff_id === employee.staff_id) ||
            [],
    }));

    return groupedArrangements;
}

// Applying the permission handler
export const GET = checkViewTeamPermission(handler);
