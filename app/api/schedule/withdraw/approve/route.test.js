import { POST } from "./route";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server", () => ({
    createClient: jest.fn(),
}));

describe("POST /api/withdraw/approve", () => {
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
        status: "pending_withdrawal",
        location: "home",
        reason: "Test1",
        created_at: "2024-01-01T00:00:00Z",
        comments: null,
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
            const req = new Request(
                "http://localhost:3000/api/withdraw/approve",
                {
                    method: "POST",
                    headers: new Headers({
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({
                        arrangement_id: sampleArrangement.arrangement_id,
                        action: "approve",
                    }),
                }
            );

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe("Missing or invalid token");
        });

        it("should reject invalid user sessions", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/approve",
                {
                    method: "POST",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({
                        arrangement_id: sampleArrangement.arrangement_id,
                        action: "approve",
                    }),
                }
            );

            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error("Invalid session"),
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe("Invalid session or token.");
        });

        it("should reject requests without staff_id in user metadata", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/approve",
                {
                    method: "POST",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({
                        arrangement_id: sampleArrangement.arrangement_id,
                        action: "approve",
                    }),
                }
            );

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
            expect(data.error).toBe("Staff ID not found in user metadata.");
        });
    });

    describe("Input Validation Tests", () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                    user: {
                        user_metadata: {
                            staff_id: sampleArrangement.manager_id,
                        },
                    },
                },
                error: null,
            });
        });

        it("should reject requests with missing required fields", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/approve",
                {
                    method: "POST",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({}),
                }
            );

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe("Required fields are missing.");
        });
    });

    describe("Approval/Rejection Tests", () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                    user: {
                        user_metadata: {
                            staff_id: sampleArrangement.manager_id,
                        },
                    },
                },
                error: null,
            });
        });

        it("should successfully approve withdrawal request", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/approve",
                {
                    method: "POST",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({
                        arrangement_id: sampleArrangement.arrangement_id,
                        action: "approve",
                        comments: "Approved by manager",
                    }),
                }
            );

            const selectChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: sampleArrangement,
                        error: null,
                    }),
                }),
            };

            const updateChain = {
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: null,
                            error: null,
                        }),
                    }),
                }),
            };

            mockSupabase.from
                .mockReturnValueOnce(selectChain)
                .mockReturnValueOnce(updateChain);

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe(
                "Withdrawal request approved successfully"
            );
        });

        it("should handle non-existent arrangements", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/approve",
                {
                    method: "POST",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({
                        arrangement_id: 999,
                        action: "approve",
                    }),
                }
            );

            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: null,
                        error: new Error("Not found"),
                    }),
                }),
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe("Arrangement not found");
        });

        it("should handle database update errors", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/approve",
                {
                    method: "POST",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({
                        arrangement_id: sampleArrangement.arrangement_id,
                        action: "approve",
                    }),
                }
            );

            const selectChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: sampleArrangement,
                        error: null,
                    }),
                }),
            };

            const updateChain = {
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: null,
                            error: {
                                message: "Failed to update arrangement status",
                            },
                        }),
                    }),
                }),
            };

            mockSupabase.from
                .mockReturnValueOnce(selectChain)
                .mockReturnValueOnce(updateChain);

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Failed to update arrangement status");
        });
    });

    describe("Error Handling Tests", () => {
        it("should handle unexpected errors", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/approve",
                {
                    method: "POST",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({
                        arrangement_id: sampleArrangement.arrangement_id,
                        action: "approve",
                    }),
                }
            );

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
