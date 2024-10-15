import React from 'react';

const ArrangementTypeSelector = ({ arrangementType, setArrangementType }) => (
	<div className="my-4">
		<button
			onClick={() => setArrangementType('adhoc')}
			className={`mr-2 px-4 py-2 rounded ${
				arrangementType === 'adhoc'
					? 'bg-blue-500 text-white'
					: 'bg-gray-200'
			}`}
		>
			Ad-hoc
		</button>
		<button
			onClick={() => setArrangementType('recurring')}
			className={`px-4 py-2 rounded ${
				arrangementType === 'recurring'
					? 'bg-blue-500 text-white'
					: 'bg-gray-200'
			}`}
		>
			Recurring
		</button>
	</div>
);

export default ArrangementTypeSelector;
