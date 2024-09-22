import { NextResponse } from "next/server";

export async function GET() {
    // This is where you'd put any backend logic
    // For example, you might fetch data from a database here
    const message = "Example 2!";

    return NextResponse.json({ message });
}
