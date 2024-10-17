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

		// Check if the request is sending FormData or JSON
		const contentType = req.headers.get('content-type') || '';
		let datesDict, reason;

		if (contentType.includes('multipart/form-data')) {
			// If FormData, parse it using `formData()`
			const formData = await req.formData();
			const dates = formData.get('dates');
			reason = formData.get('reason');

			if (!dates || !reason) {
				return NextResponse.json(
					{ error: 'Missing dates or reason' },
					{ status: 400 }
				);
			}

			// Parse dates JSON string into an object
			datesDict = JSON.parse(dates);
		} else {
			// If JSON, parse it using `json()`
			const body = await req.json();
			datesDict = body.dates;
			reason = body.reason;
		}

		if (!datesDict || typeof datesDict !== 'object') {
			return NextResponse.json(
				{ error: 'Invalid dates dictionary' },
				{ status: 400 }
			);
		}

		// Fetch existing arrangements for the user
		const getRequestForExisting = new NextRequest(req.url, {
			method: 'GET',
			headers: req.headers,
		});

		const existingArrangementsResponse = await viewOwnHandler(
			getRequestForExisting
		);
		const existingArrangementsResult =
			await existingArrangementsResponse.json();

		if (!existingArrangementsResponse.ok) {
			console.error(
				'Error fetching existing arrangements:',
				existingArrangementsResult.error
			);
			return NextResponse.json(
				{ error: 'Failed to fetch existing arrangements' },
				{ status: existingArrangementsResponse.status }
			);
		}

		// Create a Set of dates the user already has arrangements for
		const existingDatesSet = new Set(
			existingArrangementsResult.data.map((arr) => arr.date)
		);

		const insertArrangements = [];
		const skippedDates = [];

		// Prepare new arrangements, skipping dates with existing arrangements
		for (const [date, status] of Object.entries(datesDict)) {
			if (existingDatesSet.has(date)) {
				// Arrangement already exists for this date, skip insertion
				skippedDates.push(date);
				continue;
			}

			// Prepare the new arrangement data
			insertArrangements.push({
				staff_id,
				date,
				recurrence_pattern: 'one-time',
				type: 'full-day', // Assuming 'type' is the status from datesDict
				status: 'pending', // Set initial status to 'pending' or as required
				location: 'home', // Set the location as per your requirements
				reason,
			});
		}

		// Insert the new arrangements if any
		if (insertArrangements.length > 0) {
			const { data: insertedData, error: insertError } = await supabase
				.from('arrangement')
				.insert(insertArrangements)
				.select(); // Include select() to get the inserted data

			if (insertError) {
				console.error('Error inserting new arrangements:', insertError);
				return NextResponse.json(
					{ error: 'Failed to insert new arrangements' },
					{ status: 500 }
				);
			}
		}

		// Retrieve the user's own arrangements after insertion using viewOwnHandler
		const getRequest = new NextRequest(req.url, {
			method: 'GET',
			headers: req.headers,
		});

		const updatedArrangementsResponse = await viewOwnHandler(getRequest);
		const updatedArrangementsResult =
			await updatedArrangementsResponse.json();

		console.log(
			'Updated output of viewOwnHandler:',
			updatedArrangementsResult
		);

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
			message:
				insertArrangements.length > 0
					? 'Application successful'
					: 'No new arrangements to insert',
			skippedDates,
			arrangements: updatedArrangementsResult.data || [],
			debugData: {
				existingArrangements: existingArrangementsResult.data,
				updatedArrangements: updatedArrangementsResult.data,
			},
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
