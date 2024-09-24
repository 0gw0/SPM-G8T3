import { NextResponse } from "next/server";
import { supabase } from "../../../supabaseClient";

export async function GET(request) {
  const employeeId = request.nextUrl.searchParams.get("employeeId");

  if (!employeeId) {
    return NextResponse.json(
      { error: "Employee ID is required." },
      { status: 400 }
    );
  }

  try {
    // Step 1: Fetch employee details
    const { data: employeeData, error: employeeError } = await supabase
      .from("employee")
      .select("role, reporting_manager")
      .eq("staff_id", employeeId)
      .single();

    if (employeeError || !employeeData)
      throw new Error("Error fetching employee data.");
    const { role, reporting_manager } = employeeData;

    let staffIds = [];

    // Step 2: Determine the scope of visibility based on role
    if (role === 1) {
      // Director
      // Step 2.1: Fetch all Role 3 managers directly reporting to this director
      const { data: managers, error: managerError } = await supabase
        .from("employee")
        .select("staff_id")
        .eq("reporting_manager", employeeId)
        .eq("role", 3);

      if (managerError) throw new Error("Error fetching managers.");

      // Include only managers and the director's own ID
      staffIds = managers.map((m) => m.staff_id).concat(employeeId);
    } else if (role === 3) {
      // Manager
      // Step 2.2: Fetch all Role 2 staff directly reporting to this manager
      const { data: staff, error: staffError } = await supabase
        .from("employee")
        .select("staff_id")
        .eq("reporting_manager", employeeId)
        .eq("role", 2);

      if (staffError) throw new Error("Error fetching staff.");

      // Include all team members and the manager's own ID
      staffIds = staff.map((s) => s.staff_id).concat(employeeId);
    } else if (role === 2) {
      // Staff/Executives
      // Step 2.3: Staff members can view their own and their manager's schedule
      staffIds = [employeeId, reporting_manager];
    } else {
      return NextResponse.json({ error: "Invalid role." }, { status: 403 });
    }

    // Step 3: Fetch arrangements for these staff members
    const { data: arrangements, error: arrangementError } = await supabase
      .from("arrangement")
      .select("*")
      .in("staff_id", staffIds)
      .order("date", { ascending: true });

    if (arrangementError) throw new Error("Error fetching arrangements.");

    // Step 4: Return the schedule data
    return NextResponse.json({ schedule: arrangements });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
