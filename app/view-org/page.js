import { checkViewOrgPermission } from '@/utils/rolePermissions';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

const handler = async (req, user, employee) => {
    const supabase = createClient();

    // Fetch all arrangements
    const { data: arrangements, error } = await supabase
        .from('arrangement')
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
            manager_ID,
            created_At,
            comments,
            employee:staff_id (staff_fname, staff_lname, dept, position)
            `
        )
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching arrangements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch arrangements' },
            { status: 500 }
        );
    }

    // Process the arrangements data if needed
    const processedArrangements = arrangements.map((arr) => ({
        ...arr,
        employeeName: `${arr.employee.staff_fname} ${arr.employee.staff_lname}`,
        department: arr.employee.dept,
        position: arr.employee.position,
    }));

    return NextResponse.json({
        message: 'Organization arrangements retrieved successfully',
        data: processedArrangements,
    });
};

export const GET = checkViewOrgPermission(handler);
