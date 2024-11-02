import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

jest.mock("@/utils/rolePermissions", () => ({
    checkViewOwnPermission: jest.fn((handler) => handler),
}));

import { GET } from "./route";

// Mock the dependencies
jest.mock("@/utils/supabase/server");
jest.mock("next/server");

describe("GET functionality", () => {
    let mockSupabaseClient;
    let mockRequest;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Mock Supabase client
        mockSupabaseClient = {
            auth: {
                getUser: jest.fn(),
            },
            from: jest.fn(),
        };

        createClient.mockReturnValue(mockSupabaseClient);

        // Mock NextResponse
        NextResponse.json = jest.fn();

        // Create a mock request with headers
        mockRequest = {
            headers: new Map(),
        };
        mockRequest.headers.get = jest.fn();
    });

    describe("Authentication", () => {
        it("should return 403 when no authorization token is provided", async () => {
            mockRequest.headers.get.mockReturnValue(null);

            await GET(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { error: "Missing or invalid token" },
                { status: 403 }
            );
        });

        it("should return 403 when session is invalid", async () => {
            mockRequest.headers.get.mockReturnValue("Bearer valid-token");
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error("Invalid session"),
            });

            await GET(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { error: "Invalid session or token" },
                { status: 403 }
            );
        });

        it("should handle missing staff_id in user metadata", async () => {
            mockRequest.headers.get.mockReturnValue("Bearer valid-token");
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: {
                    user: {
                        user_metadata: {},
                    },
                },
                error: null,
            });

            await GET(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { error: "Staff ID not found in user metadata" },
                { status: 400 }
            );
        });
    });

    describe("Database Operations", () => {
        it("should handle database query errors", async () => {
            mockRequest.headers.get.mockReturnValue("Bearer valid-token");
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: {
                    user: {
                        user_metadata: {
                            staff_id: "123",
                        },
                    },
                },
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                        data: null,
                        error: new Error("Database error"),
                    }),
                }),
            });

            mockSupabaseClient.from.mockReturnValue({
                select: mockSelect,
            });

            await GET(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { error: "Failed to fetch arrangements" },
                { status: 500 }
            );
        });

        it("should return appropriate message when no arrangements found", async () => {
            mockRequest.headers.get.mockReturnValue("Bearer valid-token");
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: {
                    user: {
                        user_metadata: {
                            staff_id: "123",
                        },
                    },
                },
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                        data: [],
                        error: null,
                    }),
                }),
            });

            mockSupabaseClient.from.mockReturnValue({
                select: mockSelect,
            });

            await GET(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith({
                message: "This user has no existing arrangements",
                data: [],
            });
        });
    });

    describe("Data Processing", () => {
        it("should successfully process and return arrangements with employee data", async () => {
            const mockArrangements = [
                {
                    arrangement_id: 1,
                    staff_id: "123",
                    date: "2024-01-01",
                    start_date: "2024-01-01",
                    end_date: "2024-01-02",
                    recurrence_pattern: "none",
                    type: "leave",
                    status: "pending",
                    location: "home",
                    reason: "vacation",
                    employee: {
                        staff_fname: "John",
                        staff_lname: "Doe",
                        dept: "IT",
                    },
                },
            ];

            mockRequest.headers.get.mockReturnValue("Bearer valid-token");
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: {
                    user: {
                        user_metadata: {
                            staff_id: "123",
                        },
                    },
                },
                error: null,
            });

            const mockSelect = jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                        data: mockArrangements,
                        error: null,
                    }),
                }),
            });

            mockSupabaseClient.from.mockReturnValue({
                select: mockSelect,
            });

            await GET(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith({
                message: "Own arrangements retrieved successfully",
                data: expect.arrayContaining([
                    expect.objectContaining({
                        arrangement_id: 1,
                        employeeName: "John Doe",
                        department: "IT",
                    }),
                ]),
            });
        });
    });
});