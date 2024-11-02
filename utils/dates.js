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

/**
 * Checks if two arrangement types conflict
 * @param {string} type1 - First arrangement type
 * @param {string} type2 - Second arrangement type
 * @returns {boolean} True if arrangements conflict
 */
export const hasTypeConflict = (type1, type2) => {
	if (type1 === 'full-day' || type2 === 'full-day') return true;
	if (type1 === type2) return true;
	return false;
};

/**
 * Checks if a new recurring arrangement overlaps with existing arrangements
 * @param {Object} newArrangement - New arrangement to check
 * @param {Array} existingArrangements - Array of existing arrangements
 * @returns {Object} Object containing overlap status and message
 */
export const checkRecurringOverlap = (newArrangement, existingArrangements) => {
	const {
		start_date,
		end_date,
		recurrence_pattern,
		type: newType,
	} = newArrangement;

	// Generate all dates for the new arrangement
	const newDates = new Set(
		generateRecurringDates(start_date, end_date, recurrence_pattern)
	);

	// Filter for existing recurring arrangements only
	const recurringArrangements = existingArrangements.filter(
		(arr) => arr.recurrence_pattern !== 'one-time'
	);

	for (const existing of recurringArrangements) {
		// Skip if arrangement types don't conflict
		if (!hasTypeConflict(newType, existing.type)) continue;

		// Generate dates for existing recurring arrangement
		const existingDates = generateRecurringDates(
			existing.start_date || existing.date,
			existing.end_date || existing.date,
			existing.recurrence_pattern
		);

		// Check for any date overlap
		for (const date of existingDates) {
			if (newDates.has(date)) {
				return {
					hasOverlap: true,
					message: `This arrangement overlaps with an existing ${existing.type} arrangement on ${date}. Please choose different dates or adjust the arrangement type.`,
				};
			}
		}
	}

	return { hasOverlap: false };
};
