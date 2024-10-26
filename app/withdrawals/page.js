'use client';

import { useEffect, useState } from 'react';
import WithdrawalApprovalTable from '@/components/WithdrawalApprovalTable';
import { createClient } from '@/utils/supabase/client';

export default function WithdrawalApprovalPage() {
	const [arrangements, setArrangements] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchArrangements = async () => {
		try {
			setLoading(true);
			const supabase = createClient();

			const { data: sessionData } = await supabase.auth.getSession();
			if (!sessionData.session) {
				throw new Error('No active session');
			}

			// Fetch arrangements pending withdrawal for the manager
			const response = await fetch('/api/withdraw/pending', {
				headers: {
					Authorization: `Bearer ${sessionData.session.access_token}`,
				},
			});

			if (!response.ok) {
				throw new Error('Failed to fetch arrangements');
			}

			const result = await response.json();
			setArrangements(result.data || []);
		} catch (error) {
			console.error('Error fetching arrangements:', error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchArrangements();
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<div className="text-gray-500">Loading...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<div className="text-red-500">Error: {error}</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">
				Withdrawal Approval Dashboard
			</h1>
			<WithdrawalApprovalTable
				arrangements={arrangements}
				onUpdateStatus={fetchArrangements}
			/>
		</div>
	);
}
