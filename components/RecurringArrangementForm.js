import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function RecurringArrangementForm({
	onArrangementsUpdate,
	checkForOverlaps,
	onSuccess,
}) {
	const [formData, setFormData] = useState({
		start_date: '',
		end_date: '',
		recurrence_pattern: 'weekly',
		type: 'full-day',
		reason: '',
	});

	const [attachment, setAttachment] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const supabase = createClient();

	const isDateInPast = (dateString) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
		const inputDate = new Date(dateString);
		return inputDate < today;
	};

	const validateDates = () => {
		if (isDateInPast(formData.start_date)) {
			return 'Start date cannot be in the past';
		}
		if (formData.end_date && formData.start_date > formData.end_date) {
			return 'End date must be after start date';
		}
		return null;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prevData) => {
			const newData = { ...prevData, [name]: value };

			// If changing start date, ensure end date is valid
			if (name === 'start_date') {
				// If there's an end date and it's now before the new start date
				if (newData.end_date && newData.end_date < value) {
					newData.end_date = value; // Set end date to match start date
				}
			}

			return newData;
		});
		setError(null);
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

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			// Check dates first
			const dateError = validateDates();
			if (dateError) {
				setError(dateError);
				setIsSubmitting(false);
				return;
			}

			// Check for overlaps
			const overlapCheck = checkForOverlaps(formData);
			if (overlapCheck.hasOverlap) {
				setError(overlapCheck.message);
				setIsSubmitting(false);
				return;
			}

			const { data: sessionData, error: sessionError } =
				await supabase.auth.getSession();

			if (sessionError) throw new Error('Failed to get session');
			if (!sessionData.session) throw new Error('No active session');

			const token = sessionData.session.access_token;
			const employee_id = sessionData.session.user.user_metadata.staff_id;

			const data = new FormData();
			Object.entries(formData).forEach(([key, value]) => {
				data.append(key, value);
			});
			data.append('arrangementType', 'recurring');

			if (attachment) {
				data.append('attachment', attachment);
			}

			const response = await fetch('/api/schedule/apply', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: data,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to submit form.');
			}

			const result = await response.json();

			// Always send email notification
			await sendEmailNotification(employee_id, attachment);

			alert(result.message || 'Form submitted successfully.');

			if (result.arrangements) {
				onArrangementsUpdate(result.arrangements);
				onSuccess?.();
			}

			// Reset form
			setFormData({
				start_date: '',
				end_date: '',
				recurrence_pattern: 'weekly',
				type: 'full-day',
				reason: '',
			});
			setAttachment(null);
			setError(null);
		} catch (error) {
			console.error('Submission error:', error);
			setError(error.message || 'An error occurred during submission.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const sendEmailNotification = async (employee_id, pdf_attachment) => {
		try {
			let emailData = { employee_id };

			if (pdf_attachment) {
				const base64Attachment = await new Promise(
					(resolve, reject) => {
						const reader = new FileReader();
						reader.readAsDataURL(pdf_attachment);
						reader.onload = () =>
							resolve(reader.result.split(',')[1]);
						reader.onerror = (error) => reject(error);
					}
				);
				emailData.pdf_attachment = base64Attachment;
			}

			const response = await fetch('/api/send-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(emailData),
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

	const today = new Date().toISOString().split('T')[0];

	return (
		<form onSubmit={handleSubmit} className="mt-6 space-y-6">
			{error && (
				<div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
					{error}
				</div>
			)}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label
						htmlFor="start_date"
						className="text-sm font-medium text-gray-700"
					>
						Start Date
					</label>
					<input
						type="date"
						id="start_date"
						name="start_date"
						value={formData.start_date}
						onChange={handleChange}
						min={today} // Prevent selecting past dates in the datepicker
						required
						className="mt-1 block w-full border border-gray-300 rounded p-2"
					/>
				</div>
				<div>
					<label
						htmlFor="end_date"
						className="text-sm font-medium text-gray-700"
					>
						End Date
					</label>
					<input
						type="date"
						id="end_date"
						name="end_date"
						value={formData.end_date}
						onChange={handleChange}
						min={formData.start_date || today}
						required
						className={`mt-1 block w-full border rounded p-2 ${
							formData.start_date &&
							formData.end_date < formData.start_date
								? 'border-red-300'
								: 'border-gray-300'
						}`}
					/>
				</div>
			</div>
			<div>
				<label
					htmlFor="recurrence_pattern"
					className="text-sm font-medium text-gray-700"
				>
					Recurrence Pattern
				</label>
				<select
					id="recurrence_pattern"
					name="recurrence_pattern"
					value={formData.recurrence_pattern}
					onChange={handleChange}
					className="mt-1 block w-full border border-gray-300 rounded p-2"
				>
					<option value="weekly">Weekly</option>
					<option value="bi-weekly">Bi-weekly</option>
					<option value="monthly">Monthly</option>
				</select>
			</div>
			<div>
				<label
					htmlFor="type"
					className="text-sm font-medium text-gray-700"
				>
					Type
				</label>
				<select
					id="type"
					name="type"
					value={formData.type}
					onChange={handleChange}
					className="mt-1 block w-full border border-gray-300 rounded p-2"
				>
					<option value="full-day">Full-day</option>
					<option value="morning">Morning</option>
					<option value="afternoon">Afternoon</option>
				</select>
			</div>
			<div>
				<label
					htmlFor="reason"
					className="text-sm font-medium text-gray-700"
				>
					Reason
				</label>
				<textarea
					id="reason"
					name="reason"
					value={formData.reason}
					onChange={handleChange}
					required
					className="mt-1 block w-full border border-gray-300 rounded p-2"
					rows="3"
				/>
			</div>
			<div>
				<label
					htmlFor="attachment"
					className="text-sm font-medium text-gray-700"
				>
					Attachment (PDF only)
				</label>
				<input
					type="file"
					id="attachment"
					name="attachment"
					onChange={handleFileChange}
					accept=".pdf"
					className="mt-1 block w-full border border-gray-300 rounded p-2"
				/>
			</div>
			<div className="flex justify-end">
				<button
					type="submit"
					disabled={isSubmitting}
					className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none ${
						isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
					}`}
				>
					{isSubmitting ? 'Submitting...' : 'Submit'}
				</button>
			</div>
		</form>
	);
}
