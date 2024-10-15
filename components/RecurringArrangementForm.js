import { useState } from "react";

export default function RecurringArrangementForm() {
    const [formData, setFormData] = useState({
        staff_id: "",
        start_date: "",
        end_date: "",
        recurrence_pattern: "weekly",
        type: "Full-day",
        status: "pending",
        location: "home",
        reason: "",
        manager_ID: "",
    });

    const [attachment, setAttachment] = useState(null); // Store the PDF attachment

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            setAttachment(file); // Set only if the file is a PDF
        } else {
            alert("Only PDF files are allowed.");
            e.target.value = ""; // Reset the input if not a PDF
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Create a FormData object to send the file along with other form data
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value);
        });

        if (attachment) {
            data.append("attachment", attachment); // Append the PDF file
        }

        try {
            const response = await fetch("/api/schedule/recurring", {
                method: "POST",
                body: data,
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("Error:", error);
                alert("Failed to submit form.");
                return;
            }

            const result = await response.json();
            console.log("Form submitted successfully:", result);
            alert(result.message || "Form submitted successfully.");
        } catch (error) {
            console.error("Submission error:", error);
            alert("An error occurred during submission.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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
                        required
                        className="mt-1 block w-full border border-gray-300 rounded p-2"
                    />
                </div>
            </div>

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
                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>

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
                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                >
                    <option value="full-day">Full-day</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                </select>
            </div>

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
                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                    rows="3"
                />
            </div>

            {/* PDF Attachment Input */}
            <div className="flex flex-col">
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

            <div className="flex justify-end">
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
                >
                    Submit
                </button>
            </div>
        </form>
    );
}
