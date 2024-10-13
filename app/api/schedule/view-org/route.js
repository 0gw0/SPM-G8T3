import { checkViewOrgPermission } from "@/utils/rolePermissions";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const handler = async (req) => {
    const supabase = createClient();

    // Fetch all employees
    const { data: employees, error: empError } = await supabase.from("employee")
        .select(`
            staff_id,
            staff_fname,
            staff_lname,
            dept,
            position
        `);

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

export const GET = checkViewOrgPermission(handler);

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
