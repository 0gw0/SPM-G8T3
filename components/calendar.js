import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { processArrangements } from '../utils/dates';

const Calendar = ({ arrangements, onDatesChange }) => {
	const getDateString = (date) => {
		const year = date.getFullYear();
		const month = ('0' + (date.getMonth() + 1)).slice(-2);
		const day = ('0' + date.getDate()).slice(-2);
		return `${year}-${month}-${day}`;
	};

	const today = new Date();
	const todayStr = getDateString(today);
	const maxDate = new Date(
		today.getFullYear() + 1,
		today.getMonth(),
		today.getDate()
	);
	const maxDateStr = getDateString(maxDate);

	const existingDatesSet = new Set(		
		arrangements	
			.filter(
				(arr) =>
					arr.status !== 'withdrawal_approved' &&
					arr.status !== 'pending_withdrawal'
	)
	.map((arr) => arr.date));

	const clickTimeout = useRef(null);
	const isSelecting = useRef(false);

	// Helper function to get event order based on type
	const getEventOrder = (type) => {
		switch (type) {
			case 'morning':
				return 1;
			case 'afternoon':
				return 2;
			case 'full-day':
				return 0;
			default:
				return 3;
		}
	};


	let processedArrangements = processArrangements(arrangements);

	const arrangementEvents = processedArrangements
		.map((arrangement) => {
			let classNames;

			if (
				arrangement.status === 'withdrawal_approved' ||
				arrangement.status === 'pending_withdrawal'
			) {
				return null;
			}

			switch (arrangement.status) {
				case 'approved':
					classNames = ['bg-green-500', 'text-white'];
					break;
				case 'rejected':
					classNames = ['bg-red-500', 'text-white'];
					break;
				case 'pending':
				default:
					classNames = ['bg-yellow-400', 'text-black'];
					break;
			}

			return {
				title: arrangement.type,
				start: arrangement.date,
				allDay: true,
				classNames,
				extendedProps: { status: arrangement.status },
				order: getEventOrder(arrangement.type),
				display: 'block',
			};
		})
		.filter((event) => event !== null);

	const dayCellClassNames = (arg) => {
		const cellDateStr = getDateString(arg.date);
		let classes = [];

		if (cellDateStr < todayStr || cellDateStr > maxDateStr) {
			classes.push('bg-gray-200 cursor-not-allowed');
		}
		if (existingDatesSet.has(cellDateStr)) {
			classes.push('border-2 border-blue-500');
		}
		return classes;
	};



	const handleDateClick = (dateClickInfo) => {
		if (isSelecting.current) return;

		const dateStr = getDateString(dateClickInfo.date);

		if (
			existingDatesSet.has(dateStr) ||
			dateStr < todayStr ||
			dateStr > maxDateStr
		) {
			alert(`Cannot select date ${dateStr}.`);
			return;
		}


	};

	const Legend = () => (
		<div className="flex justify-center items-center space-x-4 mb-4">
			<div className="flex items-center">
				<span className="inline-block w-5 h-5 bg-green-500 mr-2"></span>
				<span>Approved</span>
			</div>
			<div className="flex items-center">
				<span className="inline-block w-5 h-5 bg-red-500 mr-2"></span>
				<span>Rejected</span>
			</div>
			<div className="flex items-center">
				<span className="inline-block w-5 h-5 bg-yellow-400 mr-2"></span>
				<span>Pending</span>
			</div>
		</div>
	);

	return (
		<div className="max-w-4xl mx-auto p-4">
			<div className="border border-gray-200 shadow-lg rounded-lg overflow-hidden">
				<FullCalendar
					plugins={[dayGridPlugin, interactionPlugin]}
					initialView="dayGridMonth"
					headerToolbar={{
						left: 'prev,next today',
						center: 'title',
						right: 'dayGridMonth',
					}}
					height="auto"
					validRange={{ start: todayStr, end: maxDateStr }}
					events={[...arrangementEvents]}
					selectable={true}
					selectMirror={true}
					dayCellClassNames={dayCellClassNames}
					dateClick={handleDateClick}
					unselectAuto={false}
				/>
			</div>
			<Legend />
		</div>
	);
};

export default Calendar;
