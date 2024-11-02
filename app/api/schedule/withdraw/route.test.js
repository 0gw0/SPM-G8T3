import { POST } from "./route";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server", () => ({
    createClient: jest.fn(),
}));

describe("POST /api/withdraw", () => {
    let mockSupabase;

    const sampleArrangement = {
        arrangement_id: 306,
        staff_id: 140001,
        manager_id: 140000,
        date: "2024-11-05",
        start_date: "2024-11-05",
        end_date: "2024-12-09",
        recurrence_pattern: "weekly",
        type: "full-day",
        status: "approved",
        location: "home",
        reason: "Test1",
        created_at: "2024-01-01T00:00:00Z",
        comments: null,
        manager: {
            staff_id: 140000,
            staff_fname: "Manager",
            staff_lname: "Test",
            email: "manager@allinone.com.sg",
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSupabase = {
            auth: {
                getUser: jest.fn(),
            },
            from: jest.fn(),
        };
        createClient.mockReturnValue(mockSupabase);
    });

    describe("Authentication Tests", () => {
        it("should reject requests without authorization token", async () => {
            const req = new Request("http://localhost:3000/api/withdraw", {
                method: "POST",
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify({
                    arrangement_id: sampleArrangement.arrangement_id,
                }),
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe("Missing or invalid token");
        });

        it("should reject invalid user sessions", async () => {
            const req = new Request("http://localhost:3000/api/withdraw", {
                method: "POST",
                headers: new Headers({
                    Authorization: "Bearer fake-token",
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify({
                    arrangement_id: sampleArrangement.arrangement_id,
                }),
            });

            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error("Invalid session"),
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe("Invalid session or token");
        });

        it("should reject requests without staff_id in user metadata", async () => {
            const req = new Request("http://localhost:3000/api/withdraw", {
                method: "POST",
                headers: new Headers({
                    Authorization: "Bearer fake-token",
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify({
                    arrangement_id: sampleArrangement.arrangement_id,
                }),
            });

            mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                    user: {
                        user_metadata: {},
                    },
                },
                error: null,
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe("Staff ID not found in user metadata");
        });
    });

    describe("Arrangement Validation Tests", () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                    user: {
                        user_metadata: { staff_id: sampleArrangement.staff_id },
                    },
                },
                error: null,
            });
        });

        it("should reject withdrawal for non-existent arrangement", async () => {
            const req = new Request("http://localhost:3000/api/withdraw", {
                method: "POST",
                headers: new Headers({
                    Authorization: "Bearer fake-token",
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify({
                    arrangement_id: 999,
                }),
            });

            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error("Not found"),
                }),
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe(
                "Arrangement not found or not eligible for withdrawal"
            );
        });
    });

    describe("Successful Withdrawal Tests", () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                    user: {
                        user_metadata: { staff_id: sampleArrangement.staff_id },
                    },
                },
                error: null,
            });
        });

        // In the successful test case
        it("should successfully process valid withdrawal request", async () => {
            const req = new Request("http://localhost:3000/api/withdraw", {
                method: "POST",
                headers: new Headers({
                    Authorization: "Bearer fake-token",
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify({
                    arrangement_id: sampleArrangement.arrangement_id,
                    reason: "Test withdrawal reason",
                }),
            });

            // Fix mock chain for the first query
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: sampleArrangement,
                    error: null,
                }),
            });

            // Fix mock chain for the update operation - this was the issue
            const updateMock = jest.fn().mockResolvedValue({ error: null });
            const eqMock = jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({ eq: updateMock }),
            });
            mockSupabase.from.mockReturnValueOnce({
                update: jest.fn().mockReturnValue({ eq: eqMock }),
            });

            // Mock the final fetch
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: [
                        { ...sampleArrangement, status: "pending_withdrawal" },
                    ],
                    error: null,
                }),
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe(
                "Withdrawal request submitted successfully. Awaiting manager approval."
            );
            expect(Array.isArray(data.data)).toBe(true);
        });

        // In the error test case
        it("should handle database update errors", async () => {
            const req = new Request("http://localhost:3000/api/withdraw", {
                method: "POST",
                headers: new Headers({
                    Authorization: "Bearer fake-token",
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify({
                    arrangement_id: sampleArrangement.arrangement_id,
                    reason: "Test withdrawal reason",
                }),
            });

            // Mock successful initial fetch
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: sampleArrangement,
                    error: null,
                }),
            });

            // Mock failed update - the crucial change is here
            // Make sure all eq() calls in the chain return mockReturnThis()
            mockSupabase.from.mockReturnValueOnce({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({
                    error: { message: "Update failed" }, // Changed this to match what Supabase returns
                }),
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Internal server error");
        });

        describe("Error Handling Tests", () => {
            it("should handle unexpected errors", async () => {
                const req = new Request("http://localhost:3000/api/withdraw", {
                    method: "POST",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({
                        arrangement_id: sampleArrangement.arrangement_id,
                    }),
                });

                mockSupabase.auth.getUser.mockRejectedValue(
                    new Error("Unexpected error")
                );

                const response = await POST(req);
                const data = await response.json();

                expect(response.status).toBe(500);
                expect(data.error).toBe("Internal server error");
                expect(data.details).toBeDefined();
            });
        });
    });
});
