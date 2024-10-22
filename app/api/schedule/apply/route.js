import { NextResponse, NextRequest } from 'next/server';
import { handler as viewOwnHandler } from '../view-own/route.js';
import { checkViewOwnPermission } from '@/utils/rolePermissions';
import { createClient } from '@/utils/supabase/server';

export const POST = checkViewOwnPermission(async (req) => {
	try {
		const supabase = createClient();

		// Extract the token from the Authorization header
		const token = req.headers.get('Authorization')?.replace('Bearer ', '');
		if (!token) {
			return NextResponse.json(
				{ error: 'Missing or invalid token' },
				{ status: 403 }
			);
		}

		// Get the user's session using the token
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser(token);

		if (userError || !user) {
			console.error('Error getting user:', userError);
			return NextResponse.json(
				{ error: 'Invalid session or token' },
				{ status: 403 }
			);
		}

		const staff_id = user.user_metadata?.staff_id;
		if (!staff_id) {
			console.error('Staff ID not found in user metadata');
			return NextResponse.json(
				{ error: 'Staff ID not found in user metadata' },
				{ status: 400 }
			);
		}

		// Parse the request body
		const formData = await req.formData();
		const arrangementType = formData.get('arrangementType');

		let insertArrangements = [];

		if (arrangementType === 'adhoc') {
			// Process ad-hoc arrangements
			const dates = JSON.parse(formData.get('dates'));
			const reason = formData.get('reason');

			for (const [date, type] of Object.entries(dates)) {
				insertArrangements.push({
					staff_id,
					date,
					recurrence_pattern: 'one-time',
					type,
					status: 'pending',
					location: 'home',
					reason,
				});
			}
		} else if (arrangementType === 'recurring') {
			// Process recurring arrangement
			const start_date = formData.get('start_date');
			const end_date = formData.get('end_date');
			const recurrence_pattern = formData.get('recurrence_pattern');
			const type = formData.get('type');
			const reason = formData.get('reason');

			insertArrangements.push({
				staff_id,
				date: start_date, // Use start_date as the initial date
				start_date,
				end_date,
				recurrence_pattern,
				type,
				status: 'pending',
				location: 'home',
				reason,
			});
		} else {
			return NextResponse.json(
				{ error: 'Invalid arrangement type' },
				{ status: 400 }
			);
		}

		// Insert the new arrangement(s)
		const { data: insertedData, error: insertError } = await supabase
			.from('arrangement')
			.insert(insertArrangements)
			.select();

		if (insertError) {
			console.error('Error inserting new arrangement:', insertError);
			return NextResponse.json(
				{ error: 'Failed to insert new arrangement' },
				{ status: 500 }
			);
		}

		// Retrieve the user's own arrangements after insertion using viewOwnHandler
		const getRequest = new NextRequest(req.url, {
			method: 'GET',
			headers: req.headers,
		});

		const updatedArrangementsResponse = await viewOwnHandler(getRequest);
		const updatedArrangementsResult =
			await updatedArrangementsResponse.json();

		if (!updatedArrangementsResponse.ok) {
			console.error(
				'Error fetching arrangements:',
				updatedArrangementsResult.error
			);
			return NextResponse.json(
				{ error: 'Failed to fetch arrangements' },
				{ status: updatedArrangementsResponse.status }
			);
		}

		return NextResponse.json({
			message: 'Application successful',
			arrangements: updatedArrangementsResult.data || [],
		});
	} catch (error) {
		console.error('Unhandled error in POST /api/schedule/apply:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
});

export const GET = checkViewOwnPermission(async (req) => {
	// Existing GET handler code (if you want to keep the GET method)
	const getRequest = new NextRequest(req.url, {
		method: 'GET',
		headers: req.headers,
	});

	const response = await viewOwnHandler(getRequest);
	const result = await response.json();

	if (!response.ok) {
		console.error('Error fetching arrangements:', result.error);
		return NextResponse.json(
			{ error: 'Failed to fetch arrangements' },
			{ status: response.status }
		);
	}

	return NextResponse.json({
		message: result.message,
		data: result.data,
	});
});
