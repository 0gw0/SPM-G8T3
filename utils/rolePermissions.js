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

export const checkViewTeamPermission = (handler) => async (req) => {
    return checkRolePermission(async (req, user, employee) => {
        // Log the user metadata to ensure role is being passed correctly
        console.log("User metadata:", user.user_metadata);
        console.log("Employee:", employee);

        const role = employee.role;
        console.log("Role received:", role);

        // Check permissions based on role
        if (role === 1 || role === 3) {
            // If the user is a Director or Manager, proceed with fetching their team arrangements
            return handler(req, user, employee, true);
        } else if (role === 2) {
            // If the user is a Staff, proceed with fetching their team arrangements
            return handler(req, user, employee, false);
        }

        // Fallback for any other role (shouldn't be reached due to permissions)
        console.error("Invalid role or role not handled.");
        return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    })(req);
};

export const checkApprovalPermission = (handler) => async (req) => {
    return checkRolePermission(async (req, user, employee) => {
        // Check if the employee is a regular user (role 2)
        if (employee.role === 2) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Check if the employee is a director (role 3) or manager (role 1)
        if (employee.role === 3 || employee.role === 1) {
            // Allow access to view data of those reporting to them
            return handler(req, user, employee);
        }

        // If the role does not match the permissions, return forbidden
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    })(req);
};

