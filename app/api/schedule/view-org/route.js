import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('arrangement')
            .select(`
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
                employee: staff_id(staff_fname, staff_lname, dept, position)
            `)
            .eq('status', 'approved')
            .order('date', { ascending: true });

        if (error) {
            throw error;
        }

        // Map to desired output structure
        const formattedData = data.map(arrangement => ({
            arrangement_id: arrangement.arrangement_id,
            staff_id: arrangement.staff_id,
            date: arrangement.date,
            start_date: arrangement.start_date,
            end_date: arrangement.end_date || null,
            recurrence_pattern: arrangement.recurrence_pattern,
            type: arrangement.type,
            status: arrangement.status,
            location: arrangement.location,
            reason: arrangement.reason,
            manager_id: arrangement.manager_id,
            created_at: arrangement.created_at,
            comments: arrangement.comments || null,
            employee: {
                staff_fname: arrangement.employee?.staff_fname || 'Unknown',
                staff_lname: arrangement.employee?.staff_lname || 'Employee',
                dept: arrangement.employee?.dept || 'N/A',
                position: arrangement.employee?.position || 'N/A',
            }
        }));

        return new Response(JSON.stringify(formattedData), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Error fetching approved arrangements:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch approved arrangements' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}
