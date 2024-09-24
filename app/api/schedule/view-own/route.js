import { NextResponse } from "next/server";
import { supabase } from "../../../supabaseClient";

export async function GET(request) {
  // own id will be in the url
  const employeeId = request.nextUrl.searchParams.get("employeeId");

  if (!employeeId) {
    return NextResponse.json(
      { error: "Employee ID is required." },
      { status: 400 }
    );
  }

  try {
    // Step 1: Fetch only the schedule for the given employeeId
    const { data: arrangements, error: arrangementError } = await supabase
      .from("arrangement")
      .select("*")
      .eq("staff_id", employeeId)
      .order("date", { ascending: true });

    if (arrangementError) throw new Error("Error fetching arrangements.");

    // Step 2: Return the schedule data
    return NextResponse.json({ schedule: arrangements });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
