'use client';

import { useEffect, useState } from 'react';
import WithdrawalApprovalTable from '@/components/WithdrawalApprovalTable';
import { createClient } from '@/utils/supabase/client';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

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

			if (response.status === 403) {
                // Custom message for 403 Forbidden errors
                setError(
                    "You do not have permission to view these arrangements."
                );
                setLoading(false);
                return;
            }

			if (!response.ok) {
                setError("Failed to fetch arrangements");
                setLoading(false);
                return;
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

	if (loading)
        return (
            <div className="text-center mt-8">
                <LoadingSpinner />
            </div>
        );

	if (error)
        return <div className="text-center mt-8 text-red-500">{error}</div>;

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
