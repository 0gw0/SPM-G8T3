jest.setTimeout(5000);
import { NextResponse, NextRequest } from 'next/server';
import { handler as viewOwnHandler } from '../view-own/route.js';
import { checkViewOwnPermission } from '@/utils/rolePermissions';
import { createClient } from '@/utils/supabase/server';
import { generateRecurringDates } from '@/utils/dates';

const doArrangementsConflict = (type1, type2) => {
	if (type1 === 'full-day' || type2 === 'full-day') return true;
	if (type1 === 'morning' && type2 === 'morning') return true;
	if (type1 === 'afternoon' && type2 === 'afternoon') return true;
	return false;
};

export const POST = checkViewOwnPermission(async (req) => {
	let arrangementsToDelete = [];

	try {
		const supabase = createClient();
		//validation
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

		// Fetch the employee's reporting manager
		const { data: employeeData, error: employeeError } = await supabase
			.from('employee')
			.select('reporting_manager')
			.eq('staff_id', staff_id)
			.single();

		if (employeeError) {
			console.error('Error fetching employee data:', employeeError);
			return NextResponse.json(
				{ error: 'Failed to fetch employee data' },
				{ status: 500 }
			);
		}

		if (!employeeData?.reporting_manager) {
			console.error('No reporting manager found for employee');
			return NextResponse.json(
				{ error: 'No reporting manager assigned' },
				{ status: 400 }
			);
		}

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
					start_date: date,
					end_date: date,
					recurrence_pattern: 'one-time',
					type,
					status: 'pending',
					location: 'home',
					reason,
					manager_id: employeeData.reporting_manager,
				});
			}
		} else if (arrangementType === 'recurring') {
			try {
				const start_date = formData.get('start_date');
				const end_date = formData.get('end_date');
				const recurrence_pattern = formData.get('recurrence_pattern');
				const type = formData.get('type');
				const reason = formData.get('reason');

				const recurringDates = generateRecurringDates(
					start_date,
					end_date,
					recurrence_pattern
				);


				const { data: existingArrangements, error: fetchError } =
					await supabase
						.from('arrangement')
						.select('arrangement_id, date, type')
						.eq('staff_id', staff_id)
						.eq('recurrence_pattern', 'one-time')
						.in('date', recurringDates);


				if (fetchError) {
					throw new Error(
						`Failed to fetch existing arrangements: ${fetchError.message}`
					);
				}else{
					console.log("No error fetching existing arrangements")
				}


				arrangementsToDelete = (existingArrangements || [])
				.filter((existing) => doArrangementsConflict(existing.type, type))
				.map((arr) => arr.arrangement_id);
			


				if (arrangementsToDelete.length > 0) {
					const { error: deleteError } = await supabase
						.from('arrangement')
						.delete()
						.in('arrangement_id', arrangementsToDelete);

					if (deleteError) {
						throw new Error(
							`Failed to delete conflicting arrangements: ${deleteError.message}`
						);
					}
				}


				insertArrangements.push({
					staff_id,
					date: start_date,
					start_date,
					end_date,
					recurrence_pattern,
					type,
					status: 'pending',
					location: 'home',
					reason,
					manager_id: employeeData.reporting_manager,
				});


			} catch (recurringError) {
				console.error(
					'Error processing recurring arrangement:',
					recurringError
				);
				return NextResponse.json(
					{ error: recurringError.message },
					{ status: 500 }
				);
			}
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

		const newArrangementIds = insertedData.map((arr) => arr.arrangement_id);

		// Retrieve updated arrangements
		const getRequest = new NextRequest(req.url, {
			method: 'GET',
			headers: req.headers,
		});

		const updatedArrangementsResponse = await viewOwnHandler(getRequest);
		const updatedArrangementsResult =
			await updatedArrangementsResponse.json();
		
		if (!updatedArrangementsResponse.ok) {
			console.error(
				'Error fetching updated arrangements:',
				updatedArrangementsResult.error
			);
			return NextResponse.json(
				{ error: 'Failed to fetch updated arrangements' },
				{ status: updatedArrangementsResponse.status }
			);
		}

		return NextResponse.json({
			message: 'Application successful',
			arrangements: updatedArrangementsResult.data || [],
			deletedArrangements: arrangementsToDelete.length,
			newArrangementIds: newArrangementIds,
		});
	} catch (error) {
		console.error('Unhandled error in POST /api/schedule/apply:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error.message,
			},
			{ status: 500 }
		);
	}
});

export const GET = checkViewOwnPermission(async (req) => {
	const getRequest = new NextRequest(req.url, {
		method: 'GET',
		headers: req.headers,
	});


	const response = await viewOwnHandler(getRequest);
	const result = await response.json();

	console.log("response:", response);
	console.log("result:", result);


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
