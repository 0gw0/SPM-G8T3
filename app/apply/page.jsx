'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client.js';
import RecurringArrangementForm from '@/components/RecurringArrangementForm';
import ArrangementTypeSelector from '@/components/ArrangementTypeSelector';
import ArrangementTable from '@/components/ArrangementTable';
import AdHocArrangementForm from '@/components/AdHocArrangementForm';

export default function OwnArrangements() {
	const [arrangements, setArrangements] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [arrangementType, setArrangementType] = useState('adhoc');
	const supabase = createClient();

	const fetchArrangements = async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase.auth.getSession();

			if (error) throw new Error('Failed to get session');
			if (!data.session) throw new Error('No active session');

			const token = data.session.access_token;
			const user = data.session.user;
			const employee_id = user.user_metadata.staff_id;

			const response = await fetch(
				`/api/schedule/apply?employee_id=${employee_id}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				const errorResult = await response.json();
				throw new Error(
					errorResult.error || 'Failed to fetch arrangements'
				);
			}

			const result = await response.json();
			const processedArrangements = processArrangements(result.data);
			setArrangements(processedArrangements);
		} catch (error) {
			console.error('Error in fetchArrangements:', error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchArrangements();
	}, []);

	const processArrangements = (arrangementsData) => {
		return arrangementsData.flatMap((arrangement) => {
			if (arrangement.recurrence_pattern === 'one-time') {
				return [arrangement];
			} else {
				return generateRecurringDates(arrangement);
			}
		});
	};

	const generateRecurringDates = (arrangement) => {
		const { start_date, end_date, recurrence_pattern, type } = arrangement;
		const dates = [];
		let currentDate = new Date(start_date);
		const endDate = new Date(end_date);

		while (currentDate <= endDate) {
			dates.push({
				...arrangement,
				date: currentDate.toISOString().split('T')[0],
				type,
			});

			switch (recurrence_pattern) {
				case 'weekly':
					currentDate.setDate(currentDate.getDate() + 7);
					break;
				case 'bi-weekly':
					currentDate.setDate(currentDate.getDate() + 14);
					break;
				case 'monthly':
					currentDate.setMonth(currentDate.getMonth() + 1);
					break;
			}
		}

		return dates;
	};

	const handleArrangementsUpdate = (newArrangements) => {
		const processedArrangements = processArrangements(newArrangements);
		setArrangements(processedArrangements);
	};

	if (loading) return <div className="text-center mt-8">Loading...</div>;
	if (error)
		return <div className="text-center mt-8 text-red-500">{error}</div>;

	return (
		<div className="container mx-auto mt-8 p-4">
			<h1 className="text-2xl font-bold mb-4">Own Arrangements</h1>
			<div className="overflow-x-auto">
				<ArrangementTable arrangements={arrangements} />
				<ArrangementTypeSelector
					arrangementType={arrangementType}
					setArrangementType={setArrangementType}
				/>
				<div className="mt-4">
					{arrangementType === 'adhoc' ? (
						<AdHocArrangementForm
							arrangements={arrangements}
							onArrangementsUpdate={handleArrangementsUpdate}
						/>
					) : (
						<RecurringArrangementForm
							onArrangementsUpdate={handleArrangementsUpdate}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
