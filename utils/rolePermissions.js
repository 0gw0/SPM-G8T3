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

export const checkAllReportingManagers = (handler) => async (req) => {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch employee data using the staff_id from user metadata
    const { data: employee, error1 } = await supabase
        .from("employee")
        .select("*")
        .eq("staff_id", user.user_metadata.staff_id)
        .single();

    // Fetch employee data using the staff_id from user metadata
    const { data: managers, error2 } = await supabase
        .from("employee")
        .select("reporting_manager", { distinct: true });

    if (error1 || !employee) {
        return NextResponse.json(
            { error: "Employee not found" },
            { status: 404 }
        );
    }

    if (error2 || !employee) {
        return NextResponse.json(
            { error: "Reporting Managers not found" },
            { status: 404 }
        );
    }

    // Add role from user metadata to the employee object
    employee.role = user.user_metadata.role;

    return handler(req, user, employee, managers);
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

        console.log("employee_id:", employee_id);
        console.log("employee role: ",employee.role)
        console.log("employee.staff_id:", employee.staff_id)

        return handler(req, user, employee);

    })(req);
};

export const checkViewTeamPermission = (handler) => async (req) => {
    return checkRolePermission(async (req, user, employee) => {
        // Log the user metadata to ensure role is being passed correctly

        const role = employee.role;

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
    return checkAllReportingManagers(async (req, user, employee, managers) => {
        // Check if the user is one of the reporting managers
        const isManager = managers.some(
            (manager) =>
                manager.reporting_manager === user.user_metadata.staff_id
        );

        if (isManager) {
            // Allow access if the user is in the managers list
            return handler(req, user, employee, managers);
        }

        // If the user is not a manager, return forbidden
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    })(req);
};

export const checkApproveWithdrawalPermission = (handler) => async (req) => {
    return checkAllReportingManagers(async (req, user, employee, managers) => {
        // Check if the user is one of the reporting managers
        const isManager = managers.some(
            (manager) =>
                manager.reporting_manager === user.user_metadata.staff_id
        );

        if (isManager) {
            // Allow access if the user is in the managers list
            return handler(req, user, employee, managers);
        }

        // If the user is not a manager, return forbidden
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    })(req);
};

