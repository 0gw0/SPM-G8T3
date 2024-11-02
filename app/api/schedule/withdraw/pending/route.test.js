import { GET } from "./route";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server", () => ({
    createClient: jest.fn(),
}));

jest.mock("@/utils/rolePermissions", () => ({
    checkApproveWithdrawalPermission: jest.fn((handler) => handler),
}));

describe("GET /api/withdraw/pending", () => {
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
        employee: {
            staff_fname: "John",
            staff_lname: "Doe",
            dept: "IT",
            email: "john.doe@test.com",
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
            const req = new Request(
                "http://localhost:3000/api/withdraw/pending",
                {
                    method: "GET",
                    headers: new Headers({}),
                }
            );

            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe("Missing or invalid token");
        });

        it("should reject invalid user sessions", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/pending",
                {
                    method: "GET",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                    }),
                }
            );

            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error("Invalid session"),
            });

            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe("Invalid session or token");
        });

        it("should reject requests without staff_id in user metadata", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/pending",
                {
                    method: "GET",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
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

            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe("Staff ID not found in user metadata");
        });
    });

    describe("Data Fetching Tests", () => {
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

        it("should successfully fetch pending withdrawal arrangements", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/pending",
                {
                    method: "GET",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                    }),
                }
            );

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: [sampleArrangement],
                    error: null,
                }),
            });

            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(Array.isArray(data.data)).toBe(true);
            expect(data.data[0]).toHaveProperty("employeeName", "John Doe");
            expect(data.data[0]).toHaveProperty("department", "IT");
        });

        it("should handle empty results", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/pending",
                {
                    method: "GET",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                    }),
                }
            );

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                }),
            });

            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data).toEqual([]);
        });

        it("should handle database fetch errors", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/pending",
                {
                    method: "GET",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                    }),
                }
            );

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error("Database error"),
                }),
            });

            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Failed to fetch arrangements");
        });
    });

    describe("Error Handling Tests", () => {
        it("should handle unexpected errors gracefully", async () => {
            const req = new Request(
                "http://localhost:3000/api/withdraw/pending",
                {
                    method: "GET",
                    headers: new Headers({
                        Authorization: "Bearer fake-token",
                    }),
                }
            );

            mockSupabase.auth.getUser.mockRejectedValue(
                new Error("Unexpected error")
            );

            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Internal server error");
            expect(data.details).toBeDefined();
        });
    });
});
