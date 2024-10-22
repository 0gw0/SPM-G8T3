'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client.js';
import RecurringArrangementForm from '@/components/RecurringArrangementForm';
import ArrangementTypeSelector from '@/components/ArrangementTypeSelector';
import ArrangementTable from '@/components/ArrangementTable';
import AdHocArrangementForm from '@/components/AdHocArrangementForm';
import { processArrangements } from '@/utils/dates';

export default function OwnArrangements() {
	const [arrangements, setArrangements] = useState([]);
	const [rawArrangements, setRawArrangements] = useState([]);
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
			setRawArrangements(result.data);

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

	const handleArrangementsUpdate = (newArrangements) => {
		setRawArrangements(newArrangements);
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
				<ArrangementTable arrangements={rawArrangements} />
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
							arrangements={arrangements}
							onArrangementsUpdate={handleArrangementsUpdate}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
