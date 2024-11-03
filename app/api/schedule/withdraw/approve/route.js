import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
	try {
		const supabase = createClient();

		const token = req.headers.get('Authorization')?.replace('Bearer ', '');
		if (!token) {
			return NextResponse.json(
				{ error: 'Missing or invalid token' },
				{ status: 403 }
			);
		}

		// Get manager from token
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser(token);

		if (userError || !user) {
			return NextResponse.json(
				{ error: 'Invalid session or token.' },
				{ status: 403 }
			);
		}

		const manager_id = user.user_metadata?.staff_id;
		if (!manager_id) {
			return NextResponse.json(
				{ error: 'Staff ID not found in user metadata.' },
				{ status: 400 }
			);
		}

		const body = await req.json();
		const { arrangement_id, action, comments } = body;

		if (!arrangement_id || !action) {
			return NextResponse.json(
				{ error: 'Required fields are missing.' },
				{ status: 400 }
			);
		}

		// Get arrangement details including employee ID
		const { data: arrangement, error: fetchError } = await supabase
			.from('arrangement')
			.select('*, staff_id')
			.eq('arrangement_id', arrangement_id)
			.single();

		if (fetchError || !arrangement) {
			return NextResponse.json(
				{ error: 'Arrangement not found' },
				{ status: 404 }
			);
		}

		const newStatus =
			action === 'approve'
				? 'withdrawal_approved'
				: 'withdrawal_rejected';

		// Update arrangement status
		const { error: updateError } = await supabase
			.from('arrangement')
			.update({
				status: newStatus,
				comments: comments || `Withdrawal ${action}d by manager`,
			})
			.eq('arrangement_id', arrangement_id)
			.eq('manager_id', manager_id)
			.eq('status', 'pending_withdrawal');

		if (updateError) {
			return NextResponse.json(
				{ error: 'Failed to update arrangement status' },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			message: `Withdrawal request ${action}d successfully`,
		});
	} catch (error) {
		console.error('Unhandled error in POST /api/schedule/withdraw/approve:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error.message,
			},
			{ status: 500 }
		);
	}
}
