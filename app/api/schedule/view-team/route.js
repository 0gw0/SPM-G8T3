"use server";
import { checkViewTeamPermission } from "@/utils/rolePermissions";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const handler = async (req, user, employee) => {
    const supabase = createClient();
    const staff_id = employee.staff_id;
    const role = employee.role;

    console.log("Role received:", role);
    console.log("Employee ID:", staff_id);

    try {
        if (role === 1 || role === 3) {
            console.log("Fetching arrangements for Director or Manager...");

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

            const managedTeam = await fetchArrangementsByStaff(
                supabase,
                managerEmployees
            );

            console.log("Managed Team Data:", managedTeam);

            // Fetch complete details of the reporting manager
            const { data: reportingManager, error: reportingManagerError } =
                await supabase
                    .from("employee")
                    .select(
                        "staff_id, staff_fname, staff_lname, dept, position"
                    )
                    .eq("staff_id", employee.reporting_manager)
                    .single();

            if (reportingManagerError || !reportingManager) {
                console.error(
                    "Error fetching reporting manager details:",
                    reportingManagerError
                );
                return NextResponse.json(
                    { error: "Failed to fetch reporting manager details" },
                    { status: 500 }
                );
            }

            const reportingManagerTeam = await fetchArrangementsByStaff(
                supabase,
                [reportingManager]
            );

            console.log("Reporting Manager's Team Data:", reportingManagerTeam);

            return NextResponse.json({
                managedTeam: managedTeam,
                reportingManagerTeam: reportingManagerTeam,
                role: role,
            });
        } else if (role === 2) {
            console.log("Fetching arrangements for Employee...");

            const { data: reportingManager, error: reportingManagerError } =
                await supabase
                    .from("employee")
                    .select(
                        "staff_id, staff_fname, staff_lname, dept, position"
                    )
                    .eq("staff_id", employee.reporting_manager)
                    .single();

            if (reportingManagerError || !reportingManager) {
                console.error(
                    "Error fetching reporting manager details:",
                    reportingManagerError
                );
                return NextResponse.json(
                    { error: "Failed to fetch reporting manager details" },
                    { status: 500 }
                );
            }

            const teamArrangements = await fetchArrangementsByStaff(supabase, [
                { ...reportingManager },
                { ...employee },
            ]);

            console.log("Team Arrangements for Employee:", teamArrangements);

            return NextResponse.json({
                teamMemberArrangements: teamArrangements,
                role: role,
            });
        }

        console.error("Invalid role or role not handled.");
        return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Unexpected error occurred", details: error },
            { status: 500 }
        );
    }
};

// Helper function to fetch and group arrangements by staff_id
async function fetchArrangementsByStaff(supabase, employees) {
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

    const groupedArrangements = employees.map((employee) => ({
        staff_id: employee.staff_id,
        staff_fname: employee.staff_fname,
        staff_lname: employee.staff_lname,
        dept: employee.dept,
        position: employee.position,
        arrangements: arrangements.filter(
            (arr) => arr.staff_id === employee.staff_id
        ),
    }));

    return groupedArrangements;
}

export const GET = checkViewTeamPermission(handler);
