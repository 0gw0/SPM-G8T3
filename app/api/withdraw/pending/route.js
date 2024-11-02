import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkApproveWithdrawalPermission } from "@/utils/rolePermissions";

const withdrawHandler = async function GET(req) {
	try {
		const supabase = createClient();

		// Verify token
		const token = req.headers.get('Authorization')?.replace('Bearer ', '');
		if (!token) {
			return NextResponse.json(
				{ error: 'Missing or invalid token' },
				{ status: 403 }
			);
		}

		// Get user (manager) from token
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser(token);

		if (userError || !user) {
			return NextResponse.json(
				{ error: 'Invalid session or token' },
				{ status: 403 }
			);
		}

		const manager_id = user.user_metadata?.staff_id;
		if (!manager_id) {
			return NextResponse.json(
				{ error: 'Staff ID not found in user metadata' },
				{ status: 400 }
			);
		}

		// Fetch arrangements pending withdrawal for this manager
		const { data: arrangements, error: fetchError } = await supabase
			.from('arrangement')
			.select(
				`
                *,
                employee:staff_id (
                    staff_fname,
                    staff_lname,
                    dept,
                    email
                )
            `
			)
			.eq('manager_id', manager_id)
			.eq('status', 'pending_withdrawal')
			.order('created_at', { ascending: false });

		if (fetchError) {
			return NextResponse.json(
				{ error: 'Failed to fetch arrangements' },
				{ status: 500 }
			);
		}

		// Format the data for frontend use
		const formattedArrangements = arrangements.map((arr) => ({
			...arr,
			employeeName: `${arr.employee.staff_fname} ${arr.employee.staff_lname}`,
			department: arr.employee.dept,
		}));

		return NextResponse.json({
			data: formattedArrangements,
		});
	} catch (error) {
		console.error('Unhandled error in GET /api/withdraw/pending:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error.message,
			},
			{ status: 500 }
		);
	}
}

export const GET = checkApproveWithdrawalPermission(withdrawHandler);