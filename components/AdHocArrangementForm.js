import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client.js';
import ApplyCalendar from '@/components/applycalendar';

const AdHocArrangementForm = ({ arrangements, onNewArrangement }) => {
	const [datesDict, setDatesDict] = useState({});
	const [reason, setReason] = useState('');
	const [attachment, setAttachment] = useState(null);
	const [isApplying, setIsApplying] = useState(false);
	const supabase = createClient();

	const handleDatesChange = (newDatesDict) => {
		setDatesDict(newDatesDict);
	};

	const handleTypeChange = (date, type) => {
		setDatesDict((prev) => ({
			...prev,
			[date]: type,
		}));
	};

	const handleDateRemove = (dateToRemove) => {
		setDatesDict((prev) => {
			const newDatesDict = { ...prev };
			delete newDatesDict[dateToRemove];
			return newDatesDict;
		});
	};

	const handleReasonChange = (e) => {
		setReason(e.target.value);
	};

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file && file.type === 'application/pdf') {
			setAttachment(file);
		} else {
			alert('Only PDF files are allowed.');
			e.target.value = '';
		}
	};

	const handleApply = async () => {
		if (Object.keys(datesDict).length === 0) {
			alert('Please select at least one date before applying.');
			return;
		}

		if (!reason) {
			alert('Please provide a reason for the arrangement.');
			return;
		}

		setIsApplying(true);

		try {
			const { data, error } = await supabase.auth.getSession();

			if (error) throw new Error('Failed to get session');
			if (!data.session) throw new Error('No active session');

			const token = data.session.access_token;
			const user = data.session.user;
			const employee_id = user.user_metadata.staff_id;

			const requestBody = new FormData();
			requestBody.append('dates', JSON.stringify(datesDict));
			requestBody.append('reason', reason);

			const response = await fetch(
				`/api/schedule/apply?employee_id=${employee_id}`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: requestBody,
				}
			);

			if (!response.ok) {
				const errorResult = await response.json();
				throw new Error(errorResult.error || 'Failed to apply for WFH');
			}

			const result = await response.json();

			if (attachment) {
				await sendEmailNotification(employee_id, attachment);
			}

			onNewArrangement(result.arrangements[0]);
			alert(result.message || 'Arrangements applied successfully');

			setDatesDict({});
			setReason('');
			setAttachment(null);
		} catch (error) {
			console.error('Error in handleApply:', error);
			alert(error.message || 'An error occurred while applying for WFH');
		} finally {
			setIsApplying(false);
		}
	};

	const sendEmailNotification = async (employee_id, pdf_attachment) => {
		try {
			const base64Attachment = await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.readAsDataURL(pdf_attachment);
				reader.onload = () => resolve(reader.result.split(',')[1]);
				reader.onerror = (error) => reject(error);
			});

			const response = await fetch('/api/send-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					employee_id,
					pdf_attachment: base64Attachment,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || 'Failed to send email notification'
				);
			}

			return await response.json();
		} catch (error) {
			console.error('Error in sendEmailNotification:', error);
			throw error;
		}
	};

	// Sort the dates in ascending order
	const sortedDates = Object.entries(datesDict).sort(
		(a, b) => new Date(a[0]) - new Date(b[0])
	);

	return (
		<>
			<ApplyCalendar
				arrangements={arrangements}
				selectedDates={datesDict}
				onDatesChange={handleDatesChange}
			/>

			<div className="mt-4">
				<h2 className="text-xl font-bold mb-2">Selected Dates:</h2>
				{sortedDates.length > 0 ? (
					<ul className="list-none p-0">
						{sortedDates.map(([date, type]) => (
							<li key={date} className="mb-2 flex items-center">
								<span className="mr-2">
									{new Date(date).toLocaleDateString()}
								</span>
								<select
									value={type}
									onChange={(e) =>
										handleTypeChange(date, e.target.value)
									}
									className="mr-2 p-1 border rounded"
								>
									<option value="full-day">Full-day</option>
									<option value="morning">Morning</option>
									<option value="afternoon">Afternoon</option>
								</select>
								<button
									onClick={() => handleDateRemove(date)}
									className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
									aria-label="Remove date"
								>
									&#x2715;
								</button>
							</li>
						))}
					</ul>
				) : (
					<p>No dates selected.</p>
				)}
			</div>

			<div className="flex flex-col mt-4">
				<label
					htmlFor="reason"
					className="text-sm font-medium text-gray-700"
				>
					Reason
				</label>
				<textarea
					id="reason"
					name="reason"
					value={reason}
					onChange={handleReasonChange}
					className="mt-1 block w-full border border-gray-300 rounded p-2"
					rows="3"
					placeholder="Enter your reason here"
				/>
			</div>

			<div className="flex flex-col mt-4">
				<label
					htmlFor="attachment"
					className="text-sm font-medium text-gray-700"
				>
					Upload Attachment (PDF only)
				</label>
				<input
					type="file"
					id="attachment"
					name="attachment"
					accept="application/pdf"
					onChange={handleFileChange}
					className="mt-1 block w-full border border-gray-300 rounded p-2"
				/>
			</div>

			<button
				onClick={handleApply}
				disabled={isApplying}
				className={`mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none ${
					isApplying ? 'opacity-50 cursor-not-allowed' : ''
				}`}
			>
				{isApplying ? 'Applying...' : 'Apply for WFH'}
			</button>
		</>
	);
};

export default AdHocArrangementForm;