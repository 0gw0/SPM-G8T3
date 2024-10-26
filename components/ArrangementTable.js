import React from 'react';
import { createClient } from '@/utils/supabase/client';

const ArrangementTable = ({ arrangements, onWithdraw }) => {
	const handleWithdraw = async (arrangementId) => {
		const supabase = createClient();

		try {
			const { data: sessionData, error: sessionError } =
				await supabase.auth.getSession();

			if (sessionError) {
				throw new Error(`Session error: ${sessionError.message}`);
			}

			const token = sessionData.session.access_token;

			const response = await fetch('/api/withdraw', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ arrangement_id: arrangementId }),
			});

			// Log the raw response text first
			const responseText = await response.text();
			console.log('Raw response:', responseText);

			// Try to parse as JSON if possible
			let result;
			try {
				result = JSON.parse(responseText);
			} catch (e) {
				console.error(
					'Failed to parse response as JSON:',
					responseText
				);
				throw new Error('Server returned an invalid response');
			}

			if (!response.ok) {
				throw new Error(
					result.error ||
						result.details ||
						'Failed to withdraw arrangement'
				);
			}

			alert(result.message || 'Arrangement withdrawn successfully');

			if (onWithdraw) {
				await onWithdraw();
			}
		} catch (error) {
			console.error('Withdrawal error:', error);
			alert(`Error withdrawing arrangement: ${error.message}`);
		}
	};

	const oneTimeArrangements = arrangements.filter(
		(arr) =>
			arr.recurrence_pattern === 'one-time' || !arr.recurrence_pattern
	);
	const recurringArrangements = arrangements.filter(
		(arr) => arr.recurrence_pattern && arr.recurrence_pattern !== 'one-time'
	);

	const OneTimeTable = ({ arrangements }) => (
		<table className="min-w-full bg-white border border-gray-300 mb-8">
			<thead className="bg-gray-100">
				<tr>
					<th className="py-2 px-4 border-b" colSpan="7">
						One-Time Arrangements
					</th>
				</tr>
				<tr>
					<th className="py-2 px-4 border-b">Employee</th>
					<th className="py-2 px-4 border-b">Department</th>
					<th className="py-2 px-4 border-b">Date</th>
					<th className="py-2 px-4 border-b">Type</th>
					<th className="py-2 px-4 border-b">Reason</th>
					<th className="py-2 px-4 border-b">Status</th>
					<th className="py-2 px-4 border-b">Actions</th>
				</tr>
			</thead>
			<tbody>
				{arrangements.map((arr, index) => (
					<tr
						key={`${arr.arrangement_id}-${index}`}
						className="hover:bg-gray-50"
					>
						<td className="py-2 px-4 border-b">
							{arr.employeeName}
						</td>
						<td className="py-2 px-4 border-b">{arr.department}</td>
						<td className="py-2 px-4 border-b">
							{new Date(arr.date).toLocaleDateString()}
						</td>
						<td className="py-2 px-4 border-b">{arr.type}</td>
						<td className="py-2 px-4 border-b">{arr.reason}</td>
						<td className="py-2 px-4 border-b">{arr.status}</td>
						<td className="py-2 px-4 border-b text-center">
							{arr.status === 'pending' && (
								<button
									onClick={() =>
										handleWithdraw(arr.arrangement_id)
									}
									className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
								>
									Request Withdrawal
								</button>
							)}
							{arr.status === 'approved' && (
								<button
									onClick={() =>
										handleWithdraw(arr.arrangement_id)
									}
									className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
								>
									Request Withdrawal
								</button>
							)}
							{arr.status === 'pending_withdrawal' && (
								<span className="text-yellow-600">
									Withdrawal Pending
								</span>
							)}
							{arr.status === 'withdrawal_approved' && (
								<span className="text-green-600">
									Withdrawal Approved
								</span>
							)}
							{arr.status === 'withdrawal_rejected' && (
								<span className="text-red-600">
									Withdrawal Rejected
								</span>
							)}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);

	const RecurringTable = ({ arrangements }) => (
		<table className="min-w-full bg-white border border-gray-300">
			<thead className="bg-gray-100">
				<tr>
					<th className="py-2 px-4 border-b" colSpan="8">
						Recurring Arrangements
					</th>
				</tr>
				<tr>
					<th className="py-2 px-4 border-b">Employee</th>
					<th className="py-2 px-4 border-b">Department</th>
					<th className="py-2 px-4 border-b">Start Date</th>
					<th className="py-2 px-4 border-b">End Date</th>
					<th className="py-2 px-4 border-b">Recurrence Pattern</th>
					<th className="py-2 px-4 border-b">Reason</th>
					<th className="py-2 px-4 border-b">Status</th>
					<th className="py-2 px-4 border-b">Actions</th>
				</tr>
			</thead>
			<tbody>
				{arrangements.map((arr, index) => (
					<tr
						key={`${arr.arrangement_id}-${index}`}
						className="hover:bg-gray-50"
					>
						<td className="py-2 px-4 border-b">
							{arr.employeeName}
						</td>
						<td className="py-2 px-4 border-b">{arr.department}</td>
						<td className="py-2 px-4 border-b">
							{new Date(arr.start_date).toLocaleDateString()}
						</td>
						<td className="py-2 px-4 border-b">
							{new Date(arr.end_date).toLocaleDateString()}
						</td>
						<td className="py-2 px-4 border-b">
							{arr.recurrence_pattern}
						</td>
						<td className="py-2 px-4 border-b">{arr.reason}</td>
						<td className="py-2 px-4 border-b">{arr.status}</td>
						<td className="py-2 px-4 border-b text-center">
							{arr.status === 'pending' && (
								<button
									onClick={() =>
										handleWithdraw(arr.arrangement_id)
									}
									className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
								>
									Request Withdrawal
								</button>
							)}
							{arr.status === 'approved' && (
								<button
									onClick={() =>
										handleWithdraw(arr.arrangement_id)
									}
									className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
								>
									Request Withdrawal
								</button>
							)}
							{arr.status === 'pending_withdrawal' && (
								<span className="text-yellow-600">
									Withdrawal Pending
								</span>
							)}
							{arr.status === 'withdrawal_approved' && (
								<span className="text-green-600">
									Withdrawal Approved
								</span>
							)}
							{arr.status === 'withdrawal_rejected' && (
								<span className="text-red-600">
									Withdrawal Rejected
								</span>
							)}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);

	return (
		<div>
			<OneTimeTable arrangements={oneTimeArrangements} />
			<RecurringTable arrangements={recurringArrangements} />
		</div>
	);
};

export default ArrangementTable;
