import { checkViewOwnPermission } from "@/utils/rolePermissions";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";


export const handler = async (req) => {
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
            start_date,
            end_date,
            recurrence_pattern,
            type,
            status,
            location,
            reason,
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

    // console.log("Arrangements:", arrangements);

    // let updatedArrangements = [];

    // // Process the arrangements data
    // for (const arrangement of arrangements) {
    //     if (arrangement.recurrence_pattern === "one-time") {
    //         updatedArrangements.push(arrangement);
    //     } else {
    //         const recurringDates = processArrangements(arrangement);
    //         updatedArrangements.push(...recurringDates);
    //     }
    // }

    // console.log("Updated Arrangements:", updatedArrangements);


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
    GET: checkViewOwnPermission(handler),
};
