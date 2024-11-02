import React, { useState } from "react";

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="relative">
                    <button
                        onClick={onClose}
                        className="absolute right-0 top-0 text-gray-600 hover:text-gray-800"
                    >
                        ✕
                    </button>
                    {children}
                </div>
            </div>
        </div>
    );
};

function adjustTimeBasedOnType(data) {
    return data.map((employee) => {
        const adjustedArrangements = employee.arrangements.map(
            (arrangement) => {
                const startDate = new Date(arrangement.start_date);
                const endDate = new Date(arrangement.end_date);

                switch (arrangement.type.toLowerCase()) {
                    case "morning":
                        startDate.setHours(9, 0, 0);
                        endDate.setHours(13, 0, 0);
                        break;
                    case "afternoon":
                        startDate.setHours(14, 0, 0);
                        endDate.setHours(18, 0, 0);
                        break;
                    case "full-day":
                        startDate.setHours(9, 0, 0);
                        endDate.setHours(18, 0, 0);
                        break;
                    default:
                        // Keep original times if type doesn't match
                        break;
                }

                return {
                    ...arrangement,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                };
            }
        );

        return {
            ...employee,
            arrangements: adjustedArrangements,
        };
    });
}

function removeNonPendingArrangements(data) {
    return data.map((employee) => {
        const filteredArrangements = employee.arrangements.filter(
            (arrangement) => arrangement.status === "pending"
        );
        return {
            ...employee,
            arrangements: filteredArrangements,
        };
    });
}

const ApprovalTable = ({ arrangements: initialArrangements, isLoading }) => {
    const [arrangements, setArrangements] = useState(initialArrangements);
    const [selectedArrangement, setSelectedArrangement] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    if (!arrangements) {
        return <p>No data available</p>;
    }

    // First adjust the times based on type, then filter for pending arrangements
    const timeAdjustedData = adjustTimeBasedOnType(arrangements);
    const transformedData = removeNonPendingArrangements(timeAdjustedData);

    const employeesWithArrangements = transformedData.filter(
        (employee) => employee.arrangements && employee.arrangements.length > 0
    );

    if (employeesWithArrangements.length === 0) {
        return <div className="p-4">No arrangements to display</div>;
    }

    const handleApprove = async (arrangement) => {
        setIsProcessing(true);
        try {
            const response = await fetch("/api/schedule/approval", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    arrangement_id: arrangement.arrangement_id,
                    status: "approved",
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log(data.message);
                removeArrangement(arrangement.arrangement_id);
                alert(
                    `Arrangement for ${arrangement.employeeName} has been approved.`
                );
            } else {
                console.error("Error approving arrangement:", data.error);
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Network error:", error);
            alert("Network error occurred");
        } finally {
            setIsProcessing(false);
            setIsModalOpen(false);
            setRejectionReason("");
        }
    };

    const handleReject = async (arrangement) => {
        if (!rejectionReason.trim()) {
            alert("Please provide a reason for rejection");
            return;
        }
        setIsProcessing(true);
        try {
            const response = await fetch("/api/schedule/approval", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    arrangement_id: arrangement.arrangement_id,
                    status: "rejected",
                    comments: rejectionReason,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log(data.message);
                removeArrangement(arrangement.arrangement_id);
                alert(
                    `Arrangement for ${arrangement.employeeName} has been rejected.`
                );
            } else {
                console.error("Error rejecting arrangement:", data.error);
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Network error:", error);
            alert("Network error occurred");
        } finally {
            setIsProcessing(false);
            setIsModalOpen(false);
            setRejectionReason("");
        }
        // console.log("Rejected arrangement:", arrangement);
        // console.log("Rejection reason:", rejectionReason);
    };

    const removeArrangement = (arrangementId) => {
        setArrangements((prevArrangements) =>
            prevArrangements.map((employee) => ({
                ...employee,
                arrangements: employee.arrangements.filter(
                    (arr) => arr.arrangement_id !== arrangementId
                ),
            }))
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <>
            <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full bg-white border border-gray-300 mb-8">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left uppercase tracking-wider">
                                Position
                            </th>
                            <th className="px-6 py-3 text-left uppercase tracking-wider">
                                Arrangement Type
                            </th>
                            <th className="px-6 py-3 text-left uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {employeesWithArrangements.map((employee) =>
                            employee.arrangements.map((arrangement) => (
                                <tr
                                    key={`${employee.staff_id}-${arrangement.arrangement_id}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {employee.staff_fname}{" "}
                                            {employee.staff_lname}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {employee.position}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {arrangement.type}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {arrangement.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => {
                                                setSelectedArrangement({
                                                    ...arrangement,
                                                    employeeName: `${employee.staff_fname} ${employee.staff_lname}`,
                                                });
                                                setIsModalOpen(true);
                                                setRejectionReason("");
                                            }}
                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setRejectionReason("");
                }}
            >
                {selectedArrangement && (
                    <div className="pt-4">
                        <h2 className="text-xl font-semibold mb-4">
                            Arrangement Details -{" "}
                            {selectedArrangement.employeeName}
                        </h2>

                        <div className="space-y-3 mb-6">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="font-medium">Start Date:</div>
                                <div className="col-span-2">
                                    {formatDate(selectedArrangement.start_date)}
                                </div>

                                <div className="font-medium">End Date:</div>
                                <div className="col-span-2">
                                    {formatDate(selectedArrangement.end_date)}
                                </div>

                                <div className="font-medium">Pattern:</div>
                                <div className="col-span-2">
                                    {selectedArrangement.recurrence_pattern}
                                </div>

                                <div className="font-medium">Type:</div>
                                <div className="col-span-2">
                                    {selectedArrangement.type}
                                </div>

                                <div className="font-medium">Reason:</div>
                                <div className="col-span-2">
                                    {selectedArrangement.reason}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rejection Reason:
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) =>
                                    setRejectionReason(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                rows="3"
                                placeholder="Enter reason for rejection..."
                            />
                        </div>

                        <div className="flex justify-between gap-2 mt-6 pt-4 border-t">
                            <button
                                onClick={() =>
                                    handleReject(selectedArrangement)
                                }
                                disabled={isProcessing} // Disable when processing
                                className={`px-4 py-2 text-white rounded focus:outline-none ${
                                    isProcessing
                                        ? "bg-red-300 cursor-not-allowed"
                                        : "bg-red-500 hover:bg-red-600"
                                }`}
                            >
                                {isProcessing &&
                                selectedArrangement.status === "rejected"
                                    ? "Processing..."
                                    : "Reject"}
                            </button>
                            <button
                                onClick={() =>
                                    handleApprove(selectedArrangement)
                                }
                                disabled={isProcessing} // Disable when processing
                                className={`px-4 py-2 text-white rounded focus:outline-none ${
                                    isProcessing
                                        ? "bg-green-300 cursor-not-allowed"
                                        : "bg-green-500 hover:bg-green-600"
                                }`}
                            >
                                {isProcessing &&
                                selectedArrangement.status === "approved"
                                    ? "Processing..."
                                    : "Approve"}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default ApprovalTable;
