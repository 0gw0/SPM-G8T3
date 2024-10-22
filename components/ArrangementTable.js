import React from 'react';

const ArrangementTable = ({ arrangements }) => {
	const oneTimeArrangements = arrangements.filter(
		(arr) => arr.recurrence_pattern === 'one-time'
	);
	const recurringArrangements = arrangements.filter(
		(arr) => arr.recurrence_pattern === 'recurring'
	);

	const OneTimeTable = ({ arrangements }) => (
		<table className="min-w-full bg-white border border-gray-300 mb-8">
			<thead className="bg-gray-100">
				<tr>
					<th className="py-2 px-4 border-b" colSpan="6">
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
					</tr>
				))}
			</tbody>
		</table>
	);

	const RecurringTable = ({ arrangements }) => (
		<table className="min-w-full bg-white border border-gray-300">
			<thead className="bg-gray-100">
				<tr>
					<th className="py-2 px-4 border-b" colSpan="6">
						Recurring Arrangements
					</th>
				</tr>
				<tr>
					<th className="py-2 px-4 border-b">Employee</th>
					<th className="py-2 px-4 border-b">Department</th>
					<th className="py-2 px-4 border-b">Start Date</th>
					<th className="py-2 px-4 border-b">End Date</th>
					<th className="py-2 px-4 border-b">Reason</th>
					<th className="py-2 px-4 border-b">Status</th>
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
							{arr.start_date
								? new Date(arr.start_date).toLocaleDateString()
								: 'N/A'}
						</td>
						<td className="py-2 px-4 border-b">
							{arr.end_date
								? new Date(arr.end_date).toLocaleDateString()
								: 'N/A'}
						</td>
						<td className="py-2 px-4 border-b">{arr.reason}</td>
						<td className="py-2 px-4 border-b">{arr.status}</td>
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
