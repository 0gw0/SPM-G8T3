import { checkViewOwnPermission } from "@/utils/rolePermissions";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const handler = async (req) => {
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

const createArrangement = async (req) => {
    const supabase = createClient();

    testing_dates = {
        dates: {
            "2024-10-08": "AM-WFH",
            "2024-10-09": "Full-day-WFH",
        },
    };

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

    try {
        body = await req.json();
    } catch (error) {
        console.error("Error parsing request body:", error);
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }

    const datesDict = testing_dates.dates; // Assuming the dates dictionary is in body.dates

    if (!datesDict || typeof datesDict !== "object") {
        return NextResponse.json(
            { error: "Invalid dates dictionary" },
            { status: 400 }
        );
    }

    const insertArrangements = [];

    for (const [date, status] of Object.entries(datesDict)) {
        // First, check if an arrangement already exists for this date and staff_id
        const { data: existingArrangements, error: fetchError } = await supabase
            .from("arrangement")
            .select("arrangement_id")
            .eq("staff_id", staff_id)
            .eq("date", date);

        if (fetchError) {
            console.error("Error checking existing arrangement:", fetchError);
            return NextResponse.json(
                { error: "Failed to check existing arrangements" },
                { status: 500 }
            );
        }

        if (existingArrangements && existingArrangements.length > 0) {
            // Arrangement already exists, skip insertion
            continue;
        }

        // Prepare the new arrangement data
        insertArrangements.push({
            staff_id,
            date,
            status,
            // Include other fields like 'type' or 'location' if necessary
        });
    }

    if (insertArrangements.length === 0) {
        return NextResponse.json({
            message: "No new arrangements to insert",
        });
    }

    // Insert the new arrangements
    const { data: insertedData, error: insertError } = await supabase
        .from("arrangement")
        .insert(insertArrangements)
        .select(); // Include select() to get the inserted data

    if (insertError) {
        console.error("Error inserting new arrangements:", insertError);
        return NextResponse.json(
            { error: "Failed to insert new arrangements" },
            { status: 500 }
        );
    }

    return NextResponse.json({
        message: "New arrangements inserted successfully",
        data: insertedData,
    });
};

export const GET = checkViewOwnPermission(handler);
export const POST = checkViewOwnPermission(createArrangement);
