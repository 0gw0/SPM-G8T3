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

		const staff_id = user.user_metadata?.staff_id;
		if (!staff_id) {
			return NextResponse.json(
				{ error: 'Staff ID not found in user metadata' },
				{ status: 400 }
			);
		}

		const body = await req.json();
		const { arrangement_id } = body;

		// Get arrangement details including manager info
		const { data: arrangement, error: fetchError } = await supabase
			.from('arrangement')
			.select(
				`
                *,
                manager:manager_id(
                    staff_id,
                    staff_fname,
                    staff_lname,
                    email
                )
            `
			)
			.eq('arrangement_id', arrangement_id)
			.eq('staff_id', staff_id)
			.not(
				'status',
				'in',
				'("pending_withdrawal","withdrawal_approved","withdrawal_rejected")'
			)
			.single();

		if (fetchError || !arrangement) {
			return NextResponse.json(
				{
					error: 'Arrangement not found or not eligible for withdrawal',
				},
				{ status: 404 }
			);
		}

		// Update the arrangement status to 'pending_withdrawal'
		const { error: updateError } = await supabase
			.from('arrangement')
			.update({
				status: 'pending_withdrawal',
				comments: body.reason || 'Withdrawal requested by employee',
			})
			.eq('arrangement_id', arrangement_id)
			.eq('staff_id', staff_id);

		if (updateError) {
			return NextResponse.json(
				{ error: 'Failed to submit withdrawal request' },
				{ status: 500 }
			);
		}

		// Fetch updated arrangements list
		const { data: updatedArrangements, error: listError } = await supabase
			.from('arrangement')
			.select('*')
			.eq('staff_id', staff_id)
			.order('date', { ascending: true });

		return NextResponse.json({
			message:
				'Withdrawal request submitted successfully. Awaiting manager approval.',
			data: updatedArrangements,
		});
	} catch (error) {
		console.error('Unhandled error in POST /api/withdraw:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error.message,
			},
			{ status: 500 }
		);
	}
}
