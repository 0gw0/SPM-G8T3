
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
);


export async function GET(request, { params }) {
    // Using dynamic employee ID from params or hardcode it for now
    const employee_id = params.employeeID || "140002"; 

    console.log("Employee ID:", employee_id);

    if (!employee_id) {
        console.error("Employee ID is missing.");
        return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    try {
        // Fetch employee's approved and pending arrangements from the database
        const { data, error } = await supabase
            .from('arrangement')
            .select(`
                arrangement_id,
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
                comments
            `)
            .eq('staff_id', employee_id)
            .order('date', { ascending: true });

        // Log the error if there's an issue with the query
        if (error) {
            console.error("Supabase Query Error:", error);
            return NextResponse.json({ error: 'Failed to fetch arrangements' }, { status: 500 });
        }

        // If no data found for the employee
        if (data.length === 0) {
            return NextResponse.json({ message: 'No arrangements found for this employee' }, { status: 404 });
        }

        console.log("Fetched data from Supabase:", data);
        // Return the fetched arrangements
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        // Handle any other errors
        console.error('Server Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
