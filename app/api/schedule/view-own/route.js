import { checkViewOwnPermission } from "@/utils/rolePermissions";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const handler = async (req) => {
    console.log('view-own handler executed')
    const supabase = createClient();

    // Get the token from the Authorization header
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return NextResponse.json(
            { error: "Missing or invalid token" },
            { status: 403 }
        );
    }

    // Get the user's session using the token
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
        console.error("Error getting user:", userError);
        return NextResponse.json(
            { error: "Invalid session or token" },
            { status: 403 }
        );
    }

    const staff_id = user.user_metadata?.staff_id;

    if (!staff_id) {
        console.error("Staff ID not found in user metadata");
        return NextResponse.json(
            { error: "Staff ID not found in user metadata" },
            { status: 400 }
        );
    }

    // Fetch arrangements for this staff_id
    const { data: arrangements, error } = await supabase
        .from("arrangement")
        .select(
            `
            arrangement_id,
            staff_id,
            date,
            type,
            status,
            location,
            employee:staff_id (staff_fname, staff_lname, dept)
            `
        )
        .eq("staff_id", staff_id) // Filter by staff_id
        .order("date", { ascending: true });

    if (error) {
        console.error("Error fetching arrangements:", error);
        return NextResponse.json(
            { error: "Failed to fetch arrangements" },
            { status: 500 }
        );
    }

    // Process the arrangements data
    const processedArrangements = arrangements.map((arr) => ({
        ...arr,
        employeeName: `${arr.employee.staff_fname} ${arr.employee.staff_lname}`,
        department: arr.employee.dept,
    }));

    return NextResponse.json({
        message:
            processedArrangements.length === 0
                ? "This user has no existing arrangements"
                : "Own arrangements retrieved successfully",
        data: processedArrangements,
    });
};

export const GET = checkViewOwnPermission(handler);
module.exports = {
    GET: checkViewOwnPermission(handler)
  };
