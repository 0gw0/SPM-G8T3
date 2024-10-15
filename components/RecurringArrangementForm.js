import { useState } from "react";

export default function RecurringArrangementForm() {
    const [formData, setFormData] = useState({
        staff_id: "",
        start_date: "",
        end_date: "",
        recurrence_pattern: "weekly",
        type: "regular",
        status: "pending",
        location: "office",
        reason: "",
        manager_ID: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form data submitted:", formData);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Start and End Date (side-by-side) */}
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
                        required
                        className="mt-1 block w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
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
                        required
                        className="mt-1 block w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Recurrence Pattern */}
            <div className="flex flex-col">
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
                    className="mt-1 block w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>

            {/* Arrangement Type */}
            <div className="flex flex-col">
                <label
                    htmlFor="type"
                    className="text-sm font-medium text-gray-700"
                >
                    Arrangement Type
                </label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="full-day">Full-day</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                </select>
            </div>

            {/* Reason */}
            <div className="flex flex-col">
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
                    className="mt-1 block w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Submit
                </button>
            </div>
        </form>
    );
}
