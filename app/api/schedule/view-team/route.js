"use server";
import { checkViewTeamPermission } from "@/utils/rolePermissions";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const handler = async (
    req,
    user,
    employee,
    { managerTeamMemberIDs, reportingManagerTeamMemberIDs, role }
) => {
    const supabase = createClient();

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return NextResponse.json(
            { error: "Missing or invalid token" },
            { status: 403 }
        );
    }

    const {
        data: { user: tokenUser },
        error: tokenError,
    } = await supabase.auth.getUser(token);
    if (tokenError || !tokenUser) {
        return NextResponse.json(
            { error: "Invalid session or token" },
            { status: 403 }
        );
    }

    try {
        if (role === 1 || role === 3) {
            console.log("Fetching arrangements for Role 1 or 3...");

            // Fetch managed team arrangements using the 'staff_id' relation
            const {
                data: managerTeamArrangements,
                error: managerArrangementsError,
            } = await supabase
                .from("arrangement")
                .select(
                    `
          arrangement_id,
          staff_id,
          date,
          start_date,
          end_date,
          type,
          status,
          location,
          reason,
          recurrence_pattern,
          comments,
          employee!arrangement_staff_id_fkey (
            staff_id,
            staff_fname,
            staff_lname,
            position
          )
        `
                )
                .in("staff_id", managerTeamMemberIDs);

            if (managerArrangementsError) {
                console.error(
                    "Error fetching manager team arrangements:",
                    managerArrangementsError
                );
                return NextResponse.json(
                    {
                        message: "Error fetching manager's team arrangements",
                        error: managerArrangementsError,
                    },
                    { status: 500 }
                );
            }

            // Fetch reporting manager team arrangements using the 'staff_id' relation
            const {
                data: reportingManagerTeamArrangements,
                error: reportingManagerArrangementsError,
            } = await supabase
                .from("arrangement")
                .select(
                    `
          arrangement_id,
          staff_id,
          date,
          start_date,
          end_date,
          type,
          status,
          location,
          reason,
          recurrence_pattern,
          comments,
          employee!arrangement_staff_id_fkey (
            staff_id,
            staff_fname,
            staff_lname,
            position
          )
        `
                )
                .in("staff_id", reportingManagerTeamMemberIDs);

            if (reportingManagerArrangementsError) {
                console.error(
                    "Error fetching reporting manager's team arrangements:",
                    reportingManagerArrangementsError
                );
                return NextResponse.json(
                    {
                        message:
                            "Error fetching reporting manager's team arrangements",
                        error: reportingManagerArrangementsError,
                    },
                    { status: 500 }
                );
            }

            const finalData = {
                managedTeam: managerTeamArrangements,
                reportingManagerTeam: reportingManagerTeamArrangements,
            };

            console.log("Successfully fetched Role 1/3 data");
            return NextResponse.json(finalData, { status: 200 });
        }

        if (role === 2) {
            console.log("Fetching arrangements for Role 2...");

            const { data: teamArrangements, error: teamArrangementsError } =
                await supabase
                    .from("arrangement")
                    .select(
                        `
          arrangement_id,
          staff_id,
          date,
          start_date,
          end_date,
          type,
          status,
          location,
          reason,
          recurrence_pattern,
          comments,
          employee!arrangement_staff_id_fkey (
            staff_id,
            staff_fname,
            staff_lname,
            position
          )
        `
                    )
                    .in("staff_id", reportingManagerTeamMemberIDs);

            if (teamArrangementsError) {
                console.error(
                    "Error fetching team arrangements for Role 2:",
                    teamArrangementsError
                );
                return NextResponse.json(
                    {
                        message: "Error fetching team arrangements for Role 2",
                        error: teamArrangementsError,
                    },
                    { status: 500 }
                );
            }

            const finalData = {
                teamMemberArrangements: teamArrangements,
            };

            console.log("Successfully fetched Role 2 data");
            return NextResponse.json(finalData, { status: 200 });
        }

        return NextResponse.json({ message: "Invalid role", status: 403 });
    } catch (error) {
        console.error("Unexpected error occurred:", error);
        return NextResponse.json(
            { message: "Unexpected error occurred", error },
            { status: 500 }
        );
    }
};

export const GET = checkViewTeamPermission(handler);
