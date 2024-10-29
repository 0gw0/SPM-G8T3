'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client.js';
import ApprovalTable from '../../components/approvalTable';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import GanttChart from '../../components/ganttChart';

const LoadingSpinner = () => (
	<div className="flex justify-center items-center h-24">
		<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
	</div>
);

export default function TeamArrangement() {
	const [arrangements, setArrangements] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const supabase = createClient();

	useEffect(() => {
		async function fetchArrangements() {
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

			const response = await fetch('/api/schedule/approval', {
				headers: {
					Authorization: `Bearer ${data.session.access_token}`,
				},
			});

			if (response.status === 403) {
				// Custom message for 403 Forbidden errors
				setError(
					'You do not have permission to view these arrangements.'
				);
				setLoading(false);
				return;
			}

			if (!response.ok) {
				setError('Failed to fetch arrangements');
				setLoading(false);
				return;
			}

			const result = await response.json();
			console.log('Fetched arrangements:', result);
			setArrangements(result.data);
			setLoading(false);
		}
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
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">
				Team Arrangement Request
			</h1>
			<Tabs>
				<TabList>
					<Tab>Approval Requests</Tab>
					<Tab>Team Schedule</Tab>
				</TabList>

				<TabPanel>
					<ApprovalTable
						arrangements={arrangements}
						isLoading={LoadingSpinner}
					/>
				</TabPanel>

				<TabPanel>
					<GanttChart
						arrangements={arrangements}
						isLoading={LoadingSpinner}
					/>
				</TabPanel>
			</Tabs>
		</div>
	);
}
