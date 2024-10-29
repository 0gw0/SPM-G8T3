"use server";
import { checkApprovalPermission } from "@/utils/rolePermissions";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET handler
const handler = async (req, user, employee) => {
    const supabase = createClient();

    if (!supabase) {
        console.error("Failed to create Supabase client");
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }

    const staff_id = employee.staff_id;
    const role = employee.role;

    console.log("Role received:", role);
    console.log("Employee ID:", staff_id);

    // Fetch all employees under the same reporting manager
    const { data: employees, error: empError } = await supabase
        .from("employee")
        .select(
            `
                staff_id,
                staff_fname,
                staff_lname,
                dept,
                position
            `
        )
        .eq("reporting_manager", staff_id);

    if (empError) {
        console.error("Error fetching employees:", empError);
        return NextResponse.json(
            { error: "Failed to fetch employees" },
            { status: 500 }
        );
    }

    // Fetch all arrangements with employee details
    const { data: arrangements, error: arrError } = await supabase
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
                staff_id
            )
        `
        )
        .order("date", { ascending: true });

    if (arrError) {
        console.error("Error fetching arrangements:", arrError);
        return NextResponse.json(
            { error: "Failed to fetch arrangements" },
            { status: 500 }
        );
    }

    // Create an object to group arrangements by staff_id
    const groupedArrangements = arrangements.reduce((acc, arr) => {
        const staffId = arr.staff_id;

        if (!acc[staffId]) {
            acc[staffId] = [];
        }

        acc[staffId].push({
            arrangement_id: arr.arrangement_id,
            date: arr.date,
            start_date: arr.start_date,
            end_date: arr.end_date,
            recurrence_pattern: arr.recurrence_pattern,
            type: arr.type,
            status: arr.status,
            location: arr.location,
            reason: arr.reason,
            manager_id: arr.manager_id,
            created_at: arr.created_at,
            comments: arr.comments,
        });

        return acc;
    }, {});

    // Process employees and merge their arrangements
    const processedArrangements = employees.map((employee) => ({
        staff_id: employee.staff_id,
        staff_fname: employee.staff_fname,
        staff_lname: employee.staff_lname,
        dept: employee.dept,
        position: employee.position,
        arrangements: groupedArrangements[employee.staff_id] || [], // Empty array if no arrangements
    }));

    return NextResponse.json({
        message: "Organization arrangements retrieved successfully",
        data: processedArrangements,
    });
};

// PUT handler
const putHandler = async (req, user, employee) => {
    const supabase = createClient();

    if (!supabase) {
        console.error("Failed to create Supabase client");
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }

    const body = await req.json();
    const { arrangement_id, status, comments } = body;

    // Validate input
    if (!arrangement_id || !status) {
        return NextResponse.json(
            { error: "Missing arrangement_id or status" },
            { status: 400 }
        );
    }

    // If status is 'rejected', comments are required
    if (status === "rejected" && (!comments || comments.trim() === "")) {
        return NextResponse.json(
            { error: "Comments are required when rejecting an arrangement." },
            { status: 400 }
        );
    }

    // Fetch the arrangement to verify existence and manager authorization
    const { data: arrangement, error: fetchError } = await supabase
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
                staff_id
            )
        `
        )
        .eq("arrangement_id", arrangement_id)
        .single();

    if (fetchError || !arrangement) {
        console.error("Error fetching arrangement:", fetchError);
        return NextResponse.json(
            { error: "Arrangement not found" },
            { status: 404 }
        );
    }

    // Check if the current employee is the manager for this arrangement
    if (arrangement.manager_id !== employee.staff_id) {
        return NextResponse.json(
            { error: "Not authorized to update this arrangement" },
            { status: 403 }
        );
    }

    // Ensure the arrangement is still pending
    if (arrangement.status !== "pending") {
        return NextResponse.json(
            { error: "Only pending arrangements can be updated" },
            { status: 400 }
        );
    }

    // Prepare update data
    const updateData = { status };

    if (status === "rejected") {
        updateData.comments = comments;
    } else if (status === "approved") {
        updateData.comments = null; // Clear comments if any
    }

    // Update the arrangement status and comments
    const { data: updatedArrangement, error: updateError } = await supabase
        .from("arrangement")
        .update(updateData)
        .eq("arrangement_id", arrangement_id)
        .single();

    if (updateError) {
        console.error("Error updating arrangement:", updateError);
        return NextResponse.json(
            { error: "Failed to update arrangement" },
            { status: 500 }
        );
    }

    return NextResponse.json({
        message: `Arrangement ${arrangement_id} status updated to ${status}`,
        data: updatedArrangement,
    });
};

export const GET = checkApprovalPermission(handler);
export const PUT = checkApprovalPermission(putHandler);

/*
  Example output:
  
  [
    {
      "staff_id": "1",
      "staff_fname": "John",
      "staff_lname": "Doe",
      "dept": "Finance",
      "position": "Manager",
      "arrangements": [
        {
          "arrangement_id": "123",
          "date": "2024-10-10",
          "start_date": "2024-10-10 09:00",
          "end_date": "2024-10-10 17:00",
          "recurrence_pattern": "weekly",
          "type": "WFH",
          "status": "approved",
          "location": "Home",
          "reason": "Medical",
          "manager_id": "999",
          "created_at": "2024-09-01",
          "comments": "Doctor's note provided"
        }
      ]
    },
    {
      "staff_id": "2",
      "staff_fname": "Jane",
      "staff_lname": "Smith",
      "dept": "HR",
      "position": "Assistant",
      "arrangements": []  // Empty array since Jane has no arrangements
    }
  ]
*/
