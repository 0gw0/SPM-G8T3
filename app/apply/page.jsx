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
		const { data, error } = await supabase.auth.getSession();

		if (error) {
			setError('Failed to get session');
			setLoading(false);
			return;
		}

		if (!data.session) {
			setError('No active session');
			setLoading(false);
			return;
		}

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
			setError(errorResult.error || 'Failed to fetch arrangements');
			setLoading(false);
			return;
		}

		const result = await response.json();
		setArrangements(result.data);
		setLoading(false);
	};

	useEffect(() => {
		fetchArrangements();
	}, []);

	const handleNewArrangement = (newArrangement) => {
		setArrangements((prevArrangements) => [
			...prevArrangements,
			newArrangement,
		]);
	};

	const handleArrangementsUpdate = (newArrangements) => {
		setArrangements(newArrangements);
	};

	console.log(arrangements);

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
							onNewArrangement={handleNewArrangement}
							onArrangementsUpdate={handleArrangementsUpdate}
						/>
					) : (
						<RecurringArrangementForm />
					)}
				</div>
			</div>
		</div>
	);
}
