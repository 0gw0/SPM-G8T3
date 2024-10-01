import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";


export const checkRolePermission = (handler) => async (req) => {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch employee data using the staff_id from user metadata
    const { data: employee, error } = await supabase
        .from("employee")
        .select("*")
        .eq("staff_id", user.user_metadata.staff_id)
        .single();

    if (error || !employee) {
        return NextResponse.json(
            { error: "Employee not found" },
            { status: 404 }
        );
    }

    // Add role from user metadata to the employee object
    employee.role = user.user_metadata.role;

    return handler(req, user, employee);
};

export const checkViewOrgPermission = (handler) => async (req) => {
    return checkRolePermission(async (req, user, employee) => {
        if (employee.role !== 1) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return handler(req, user, employee);
    })(req);
};

export const checkViewTeamPermission = (handler) => async (req) => {
    return checkRolePermission(async (req, user, employee) => {
        const supabase = createClient();
        const staff_id = employee.staff_id;
        const role = employee.role;

        // For Role 1 and Role 3 (Managers and Directors)
        if (role === 1 || role === 3) {
            // Get employees reporting to the current user (staff_id)
            const { data: managerTeamData, error: managerError } =
                await supabase
                    .from("employee")
                    .select("staff_id")
                    .eq("reporting_manager", staff_id);

            if (managerError || !managerTeamData) {
                return NextResponse.json(
                    { error: "Error fetching manager's team data" },
                    { status: 500 }
                );
            }

            // Get the current user's reporting manager and the employees under that manager
            const { data: reportingManagerData, error: reportingError } =
                await supabase
                    .from("employee")
                    .select("reporting_manager")
                    .eq("staff_id", staff_id)
                    .single();

            if (reportingError || !reportingManagerData) {
                return NextResponse.json(
                    { error: "Error fetching reporting manager's data" },
                    { status: 500 }
                );
            }

            const reportingManagerID = reportingManagerData.reporting_manager;

            // Get the employees who report to the same manager as the current user
            const { data: reportingManagerTeamData, error: teamError } =
                await supabase
                    .from("employee")
                    .select("staff_id")
                    .eq("reporting_manager", reportingManagerID);

            if (teamError || !reportingManagerTeamData) {
                return NextResponse.json(
                    { error: "Error fetching reporting manager's team data" },
                    { status: 500 }
                );
            }

            const managerTeamMemberIDs = managerTeamData.map(
                (member) => member.staff_id
            );
            const reportingManagerTeamMemberIDs = reportingManagerTeamData.map(
                (member) => member.staff_id
            );

            // Add the current user and the reporting manager to the relevant arrays
            managerTeamMemberIDs.push(staff_id);
            reportingManagerTeamMemberIDs.push(staff_id, reportingManagerID);

            return handler(req, user, employee, {
                managerTeamMemberIDs,
                reportingManagerTeamMemberIDs,
                role,
            });
        }

        // For Role 2 (Staff)
        if (role === 2) {
            // Get the reporting manager for the current user
            const { data: employeeData, error: employeeError } = await supabase
                .from("employee")
                .select("reporting_manager")
                .eq("staff_id", staff_id)
                .single();

            if (employeeError || !employeeData) {
                return NextResponse.json(
                    { error: "Error fetching employee's reporting manager" },
                    { status: 500 }
                );
            }

            const reportingManagerID = employeeData.reporting_manager;

            // Get all team members who report to the same manager
            const { data: teamData, error: teamError } = await supabase
                .from("employee")
                .select("staff_id")
                .eq("reporting_manager", reportingManagerID);

            if (teamError || !teamData) {
                return NextResponse.json(
                    { error: "Error fetching team data" },
                    { status: 500 }
                );
            }

            const teamMemberIDs = teamData.map((member) => member.staff_id);

            // Add current user and reporting manager to the list
            teamMemberIDs.push(reportingManagerID, staff_id);

            return handler(req, user, employee, {
                managerTeamMemberIDs: [],
                reportingManagerTeamMemberIDs: teamMemberIDs,
                role,
            });
        }

        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    })(req);
};

export const checkViewOwnPermission = (handler) => async (req) => {
    return checkRolePermission(async (req, user, employee) => {
        const { searchParams } = new URL(req.url);
        const employee_id = searchParams.get("employee_id");

        if (
            employee.role === 1 ||
            employee.staff_id === parseInt(employee_id) ||
            (employee.role === 3 &&
                employee.staff_id === employee.reporting_manager)
        ) {
            return handler(req, user, employee);
        }
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    })(req);
};
