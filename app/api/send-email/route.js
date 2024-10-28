import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const recipientEmail = process.env.RECIPIENT_EMAIL;

// Email template functions
const emailTemplates = {
	newArrangement: (manager, employee, arrangementDetails) => ({
		subject: 'New Work Arrangement Request',
		html: `
		<p>Dear ${manager.staff_fname} ${manager.staff_lname},</p>
		<p>A new work arrangement request has been submitted by ${employee.staff_fname} ${employee.staff_lname} (Employee ID: ${employee.staff_id}).</p>
		<p>Arrangement Details:</p>
		<ul>
			<li>Type: ${arrangementDetails.type}</li>
			<li>Date: ${arrangementDetails.date}</li>
			<li>Location: ${arrangementDetails.location}</li>
		</ul>
		<p>Please review and respond to this request at your earliest convenience.</p>
		<p>Best regards,<br>HR Department</p>
		<hr>
		<p><small>This email was intended to be sent to: ${manager.email}</small></p>
    `,
	}),

	withdrawalRequest: (manager, employee, arrangementDetails) => ({
		subject: 'Arrangement Withdrawal Request',
		html: `
		<p>Dear ${manager.staff_fname} ${manager.staff_lname},</p>
		<p>${employee.staff_fname} ${employee.staff_lname} has requested to withdraw their work arrangement.</p>
		<p>Original Arrangement Details:</p>
		<ul>
			<li>Arrangement ID: ${arrangementDetails.arrangement_id}</li>
			<li>Type: ${arrangementDetails.type}</li>
			<li>Date: ${arrangementDetails.date}</li>
		</ul>
		<p>Please review this withdrawal request.</p>
		<p>Best regards,<br>HR Department</p>
		<hr>
		<p><small>This email was intended to be sent to: ${manager.email}</small></p>
    `,
	}),

	statusUpdate: (employee, arrangementDetails, status) => ({
		subject: `Work Arrangement ${
			status.charAt(0).toUpperCase() + status.slice(1)
		}`,
		html: `
		<p>Dear ${employee.staff_fname} ${employee.staff_lname},</p>
		<p>Your work arrangement request has been ${status}.</p>
		<p>Arrangement Details:</p>
		<ul>
			<li>Arrangement ID: ${arrangementDetails.arrangement_id}</li>
			<li>Type: ${arrangementDetails.type}</li>
			<li>Date: ${arrangementDetails.date}</li>
			${
				arrangementDetails.comments
					? `<li>Comments: ${arrangementDetails.comments}</li>`
					: ''
			}
		</ul>
		<p>Best regards,<br>HR Department</p>
		<hr>
		<p><small>This email was intended to be sent to: ${employee.email}</small></p>
    `,
	}),

	withdrawalStatusUpdate: (employee, arrangementDetails, status) => ({
		subject: `Arrangement Withdrawal Request ${
			status.charAt(0).toUpperCase() + status.slice(1)
		}`,
		html: `
		<p>Dear ${employee.staff_fname} ${employee.staff_lname},</p>
		<p>Your arrangement withdrawal request has been ${status}.</p>
		<p>Arrangement Details:</p>
		<ul>
			<li>Arrangement ID: ${arrangementDetails.arrangement_id}</li>
			<li>Type: ${arrangementDetails.type}</li>
			<li>Date: ${arrangementDetails.date}</li>
			${
				arrangementDetails.comments
					? `<li>Comments: ${arrangementDetails.comments}</li>`
					: ''
			}
		</ul>
		<p>Best regards,<br>HR Department</p>
		<hr>
		<p><small>This email was intended to be sent to: ${employee.email}</small></p>
    `,
	}),
};

export async function POST(request) {
	const supabase = createClient();

	try {
		const { type, employee_id, arrangement_id, pdf_attachment, status } =
			await request.json();

		if (!employee_id || !type) {
			return NextResponse.json(
				{ error: 'Employee ID and email type are required' },
				{ status: 400 }
			);
		}

		// Fetch employee data
		const { data: employee, error: employeeError } = await supabase
			.from('employee')
			.select('*')
			.eq('staff_id', employee_id)
			.single();

		if (employeeError) {
			return NextResponse.json(
				{ error: 'Failed to fetch employee data' },
				{ status: 500 }
			);
		}

		// Fetch arrangement details if arrangement_id is provided
		let arrangementDetails = {};
		if (arrangement_id) {
			const { data: arrangement, error: arrangementError } =
				await supabase
					.from('arrangement')
					.select('*')
					.eq('arrangement_id', arrangement_id)
					.single();

			if (arrangementError) {
				return NextResponse.json(
					{ error: 'Failed to fetch arrangement data' },
					{ status: 500 }
				);
			}
			arrangementDetails = arrangement;
		}

		// Fetch manager data if needed
		let manager = {};
		if (employee.reporting_manager) {
			const { data: managerData, error: managerError } = await supabase
				.from('employee')
				.select('*')
				.eq('staff_id', employee.reporting_manager)
				.single();

			if (managerError) {
				return NextResponse.json(
					{ error: 'Failed to fetch manager data' },
					{ status: 500 }
				);
			}
			manager = managerData;
		}

		// Select email template based on type
		let emailContent;
		switch (type) {
			case 'newArrangement':
				emailContent = emailTemplates.newArrangement(
					manager,
					employee,
					arrangementDetails
				);
				break;
			case 'withdrawalRequest':
				emailContent = emailTemplates.withdrawalRequest(
					manager,
					employee,
					arrangementDetails
				);
				break;
			case 'statusUpdate':
				emailContent = emailTemplates.statusUpdate(
					employee,
					arrangementDetails,
					status
				);
				break;
			case 'withdrawalStatusUpdate':
				emailContent = emailTemplates.withdrawalStatusUpdate(
					employee,
					arrangementDetails,
					status
				);
				break;
			default:
				return NextResponse.json(
					{ error: 'Invalid email type' },
					{ status: 400 }
				);
		}

		// Send email
		const { data, error } = await resend.emails.send({
			from: 'AIO <HR@resend.dev>',
			to: [recipientEmail],
			subject: emailContent.subject,
			html: emailContent.html,
			attachments: pdf_attachment
				? [
						{
							filename: 'arrangement_details.pdf',
							content: Buffer.from(pdf_attachment, 'base64'),
						},
				  ]
				: [],
		});

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ message: 'Email sent successfully', data });
	} catch (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
