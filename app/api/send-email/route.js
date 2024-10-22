import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
	const supabase = createClient();
	try {
		const { employee_id, pdf_attachment } = await request.json();

		if (!employee_id) {
			return NextResponse.json(
				{ error: 'Employee ID is required' },
				{ status: 400 }
			);
		}

		// Fetch employee data
		const { data: employee, error: employeeError } = await supabase
			.from('employee')
			.select('reporting_manager, staff_fname, staff_lname')
			.eq('staff_id', employee_id)
			.single();

		if (employeeError) {
			return NextResponse.json(
				{ error: 'Failed to fetch employee data' },
				{ status: 500 }
			);
		}

		// Fetch manager data
		const { data: manager, error: managerError } = await supabase
			.from('employee')
			.select('email, staff_fname, staff_lname')
			.eq('staff_id', employee.reporting_manager)
			.single();

		if (managerError) {
			return NextResponse.json(
				{ error: 'Failed to fetch manager data' },
				{ status: 500 }
			);
		}

		const recipientEmail = process.env.RECIPIENT_EMAIL;
		if (!recipientEmail) {
			return NextResponse.json(
				{ error: 'Recipient email is not configured' },
				{ status: 500 }
			);
		}

		let attachmentInfo = pdf_attachment
			? '<p>Please review the attached PDF for details.</p>'
			: '<p>No attachment was provided with this request.</p>';

		const { data, error } = await resend.emails.send({
			from: 'AIO <HR@resend.dev>',
			to: [recipientEmail],
			subject: 'New Work Arrangement Request',
			html: `
                <p>Dear ${manager.staff_fname} ${manager.staff_lname},</p>
                <p>A new work arrangement request has been submitted by ${employee.staff_fname} ${employee.staff_lname} (Employee ID: ${employee_id}).</p>
                ${attachmentInfo}
                <p>Please review and respond to this request at your earliest convenience.</p>
                <p>Best regards,<br>HR Department</p>
                <p>This message was meant for</p>
                <hr>
                <p><small>This email was intended to be sent to: ${manager.email}</small></p>
                <p><small>Privacy Notice: This email contains confidential information and is intended only for the named recipient. If you have received this email in error, please notify the sender immediately and delete it from your system. Any unauthorized use, disclosure, or distribution of this information is strictly prohibited.</small></p>
            `,
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
