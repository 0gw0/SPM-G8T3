/**
 * Generates an array of dates based on a recurrence pattern
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} pattern - Recurrence pattern ('weekly', 'bi-weekly', or 'monthly')
 * @param {Object} [arrangement] - Optional arrangement object to merge with each date
 * @returns {Array} Array of dates or arrangement objects
 */
export const generateRecurringDates = (
	startDate,
	endDate,
	pattern,
	arrangement = null
) => {
	const dates = [];
	let currentDate = new Date(startDate);
	const finalDate = new Date(endDate);

	while (currentDate <= finalDate) {
		if (arrangement) {
			dates.push({
				...arrangement,
				date: currentDate.toISOString().split('T')[0],
			});
		} else {
			dates.push(currentDate.toISOString().split('T')[0]);
		}

		switch (pattern) {
			case 'weekly':
				currentDate.setDate(currentDate.getDate() + 7);
				break;
			case 'bi-weekly':
				currentDate.setDate(currentDate.getDate() + 14);
				break;
			case 'monthly':
				currentDate.setMonth(currentDate.getMonth() + 1);
				break;
		}
	}

	return dates;
};

/**
 * Processes arrangements by expanding recurring arrangements into individual dates
 * @param {Array} arrangementsData - Array of arrangement objects
 * @returns {Array} Processed arrangements
 */
export const processArrangements = (arrangementsData) => {
	return arrangementsData.flatMap((arrangement) => {
		if (arrangement.recurrence_pattern === 'one-time') {
			return [arrangement];
		}
		return generateRecurringDates(
			arrangement.start_date,
			arrangement.end_date,
			arrangement.recurrence_pattern,
			arrangement
		);
	});
};
