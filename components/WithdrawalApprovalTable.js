import React from 'react';
import { createClient } from '@/utils/supabase/client';

const WithdrawalApprovalTable = ({ arrangements, onUpdateStatus }) => {
	const handleApproval = async (arrangementId, action, comments = '') => {
		const supabase = createClient();

		try {
			const { data: sessionData, error: sessionError } =
				await supabase.auth.getSession();
			if (sessionError) throw new Error('Failed to get session');
			if (!sessionData.session) throw new Error('No active session');

			const token = sessionData.session.access_token;

			// First get the employee_id from the arrangement
			const { data: arrangement, error: arrangementError } =
				await supabase
					.from('arrangement')
					.select('staff_id')
					.eq('arrangement_id', arrangementId)
					.single();

			if (arrangementError) {
				console.error('Error fetching arrangement:', arrangementError);
				throw new Error('Failed to fetch arrangement details');
			}

			// Process the approval/rejection
			const response = await fetch('/api/withdraw/approve', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					arrangement_id: arrangementId,
					action,
					comments,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to process withdrawal request');
			}

			const result = await response.json();

			// Send email notification
			try {
				const emailResponse = await fetch('/api/send-email', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						type: 'withdrawalStatusUpdate',
						employee_id: arrangement.staff_id,
						arrangement_id: arrangementId,
						status: action === 'approve' ? 'approved' : 'rejected',
					}),
				});

				if (!emailResponse.ok) {
					console.error('Failed to send email notification');
				}
			} catch (emailError) {
				console.error('Error sending email:', emailError);
			}

			alert(
				result.message || `Withdrawal request ${action}d successfully`
			);

			if (onUpdateStatus) {
				onUpdateStatus();
			}
		} catch (error) {
			console.error('Error processing withdrawal:', error);
			alert(error.message || 'Failed to process withdrawal request');
		}
	};

	// Filter only pending withdrawal arrangements
	const pendingWithdrawals = arrangements.filter(
		(arr) => arr.status === 'pending_withdrawal'
	);

	return (
		<div className="mt-6">
			<h2 className="text-xl font-semibold mb-4">
				Pending Withdrawal Requests
			</h2>
			<table className="min-w-full bg-white border border-gray-300">
				<thead className="bg-gray-100">
					<tr>
						<th className="py-2 px-4 border-b">Employee</th>
						<th className="py-2 px-4 border-b">Department</th>
						<th className="py-2 px-4 border-b">Date</th>
						<th className="py-2 px-4 border-b">Type</th>
						<th className="py-2 px-4 border-b">Original Status</th>
						<th className="py-2 px-4 border-b">Reason</th>
						<th className="py-2 px-4 border-b">Actions</th>
					</tr>
				</thead>
				<tbody>
					{pendingWithdrawals.map((arr) => (
						<tr
							key={arr.arrangement_id}
							className="hover:bg-gray-50"
						>
							<td className="py-2 px-4 border-b">
								{arr.employeeName}
							</td>
							<td className="py-2 px-4 border-b">
								{arr.department}
							</td>
							<td className="py-2 px-4 border-b">
								{arr.date
									? new Date(arr.date).toLocaleDateString()
									: `${new Date(
											arr.start_date
									  ).toLocaleDateString()} - ${new Date(
											arr.end_date
									  ).toLocaleDateString()}`}
							</td>
							<td className="py-2 px-4 border-b">{arr.type}</td>
							<td className="py-2 px-4 border-b">
								{arr.previous_status || 'N/A'}
							</td>
							<td className="py-2 px-4 border-b">{arr.reason}</td>
							<td className="py-2 px-4 border-b space-x-2">
								<button
									onClick={() =>
										handleApproval(
											arr.arrangement_id,
											'approve'
										)
									}
									className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none"
								>
									Approve
								</button>
								<button
									onClick={() =>
										handleApproval(
											arr.arrangement_id,
											'reject'
										)
									}
									className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
								>
									Reject
								</button>
							</td>
						</tr>
					))}
					{pendingWithdrawals.length === 0 && (
						<tr>
							<td
								colSpan="7"
								className="py-4 text-center text-gray-500"
							>
								No pending withdrawal requests
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};

export default WithdrawalApprovalTable;
