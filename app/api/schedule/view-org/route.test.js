import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkViewOrgPermission } from "@/utils/rolePermissions";
import { GET } from "./route"; // Adjust the import according to your file structure

jest.mock("@/utils/supabase/server", () => ({
    createClient: jest.fn(),
}));

jest.mock("@/utils/rolePermissions", () => ({
    checkViewOrgPermission: jest.fn((handler) => handler),
}));

describe("GET handler for view organization arrangements", () => {
    let mockSupabaseClient; // Mocked Supabase client
    let mockRequest; // Mock request object

    beforeEach(() => {
        jest.clearAllMocks(); // Clear previous mocks before each test

        // Mocked Supabase client
        mockSupabaseClient = {
            from: jest.fn(),
            auth: {
                getUser: jest.fn(),
            },
        };

        createClient.mockReturnValue(mockSupabaseClient); // Create mock client

        // Mock request object
        mockRequest = {
            headers: {
                get: jest.fn((key) =>
                    key === "Authorization" ? "Bearer mock-token" : null
                ),
            },
        };
    });

    // Test case: successful fetch of employees and arrangements
    it("should return 200 and arrangements data on successful fetch", async () => {
        // Mocking Supabase getUser call
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
            data: { user: { user_metadata: { staff_id: "mock-staff-id" } } },
            error: null,
        });

        // Mocking the employee data returned from Supabase
        mockSupabaseClient.from.mockImplementation((tableName) => {
            if (tableName === "employee") {
                return {
                    select: jest.fn().mockResolvedValueOnce({
                        data: [
                            {
                                staff_id: "1",
                                staff_fname: "John",
                                staff_lname: "Doe",
                                dept: "Finance",
                                position: "Manager",
                            },
                            {
                                staff_id: "2",
                                staff_fname: "Jane",
                                staff_lname: "Smith",
                                dept: "HR",
                                position: "Assistant",
                            },
                        ],
                        error: null,
                    }),
                };
            } else if (tableName === "arrangement") {
                return {
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValueOnce({
                            data: [
                                {
                                    arrangement_id: "123",
                                    staff_id: "1",
                                    date: "2024-10-10",
                                    start_date: "2024-10-10",
                                    end_date: "2024-10-10",
                                    recurrence_pattern: "weekly",
                                    type: "WFH",
                                    status: "approved",
                                    location: "Home",
                                    reason: "Medical",
                                    manager_id: "999",
                                    created_at: "2024-09-01",
                                    comments: "Doctor's note provided",
                                },
                            ],
                            error: null,
                        }),
                    }),
                };
            }
        });

        // Call the GET handler with the mocked request
        const response = await GET(mockRequest);

        // Expect the status code to be 200
        expect(response.status).toBe(200);

        // Check if the response matches the expected output
        expect(await response.json()).toEqual({
            message: "Organization arrangements retrieved successfully",
            data: [
                {
                    staff_id: "1",
                    staff_fname: "John",
                    staff_lname: "Doe",
                    dept: "Finance",
                    position: "Manager",
                    arrangements: [
                        {
                            arrangement_id: "123",
                            date: "2024-10-10",
                            start_date: "2024-10-10",
                            end_date: "2024-10-10",
                            recurrence_pattern: "weekly",
                            type: "WFH",
                            status: "approved",
                            location: "Home",
                            reason: "Medical",
                            manager_id: "999",
                            created_at: "2024-09-01",
                            comments: "Doctor's note provided",
                        },
                    ],
                },
                {
                    staff_id: "2",
                    staff_fname: "Jane",
                    staff_lname: "Smith",
                    dept: "HR",
                    position: "Assistant",
                    arrangements: [], // Empty array since Jane has no arrangements
                },
            ],
        });
    });

    // Test case: failure to fetch employees
    it("should return 500 when fetching employees fails", async () => {
        // Mock Supabase getUser call
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
            data: { user: { user_metadata: { staff_id: "mock-staff-id" } } },
            error: null,
        });

        // Mocking the behavior of fetching employees to simulate an error
        mockSupabaseClient.from.mockImplementation(() => ({
            select: jest.fn().mockResolvedValueOnce({
                data: null, // No data returned
                error: { message: "Failed to fetch employees" }, // Simulate an error
            }),
        }));

        // Call the GET handler with the mocked request
        const response = await GET(mockRequest);

        // Expect the status code to be 500
        expect(response.status).toBe(500);

        // Check if the response matches the expected error output
        expect(await response.json()).toEqual({
            error: "Failed to fetch employees",
        });
    });

    // Test case: failure to fetch arrangements
    it("should return 500 when fetching arrangements fails", async () => {
        // Mock Supabase getUser call
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
            data: { user: { user_metadata: { staff_id: "mock-staff-id" } } },
            error: null,
        });

        // Mocking employee data
        mockSupabaseClient.from.mockImplementation((tableName) => {
            if (tableName === "employee") {
                return {
                    select: jest.fn().mockResolvedValueOnce({
                        data: [
                            {
                                staff_id: "1",
                                staff_fname: "John",
                                staff_lname: "Doe",
                                dept: "Finance",
                                position: "Manager",
                            },
                        ],
                        error: null,
                    }),
                };
            } else if (tableName === "arrangement") {
                return {
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValueOnce({
                            data: null, // No data returned
                            error: { message: "Failed to fetch arrangements" }, // Simulate an error
                        }),
                    }),
                };
            }
        });

        // Call the GET handler with the mocked request
        const response = await GET(mockRequest);

        // Expect the status code to be 500
        expect(response.status).toBe(500);

        // Check if the response matches the expected error output
        expect(await response.json()).toEqual({
            error: "Failed to fetch arrangements",
        });
    });

    // Test case: no arrangements found for employees
    it("should return employees with empty arrangements when no arrangements are found", async () => {
        // Mock Supabase getUser call
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
            data: { user: { user_metadata: { staff_id: "mock-staff-id" } } },
            error: null,
        });

        // Mocking employee data with no arrangements
        mockSupabaseClient.from.mockImplementation((tableName) => {
            if (tableName === "employee") {
                return {
                    select: jest.fn().mockResolvedValueOnce({
                        data: [
                            {
                                staff_id: "1",
                                staff_fname: "John",
                                staff_lname: "Doe",
                                dept: "Finance",
                                position: "Manager",
                            },
                        ],
                        error: null,
                    }),
                };
            } else if (tableName === "arrangement") {
                return {
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValueOnce({
                            data: [], // No arrangements returned
                            error: null,
                        }),
                    }),
                };
            }
        });

        // Call the GET handler with the mocked request
        const response = await GET(mockRequest);

        // Expect the status code to be 200
        expect(response.status).toBe(200);

        // Check if the response matches the expected output
        expect(await response.json()).toEqual({
            message: "Organization arrangements retrieved successfully",
            data: [
                {
                    staff_id: "1",
                    staff_fname: "John",
                    staff_lname: "Doe",
                    dept: "Finance",
                    position: "Manager",
                    arrangements: [], // No arrangements found
                },
            ],
        });
    });

    // New Test case: Verify that the endpoint successfully retrieves a list of employees and their respective arrangements
    it("should return employees and their arrangements from the database", async () => {
        // Mocking Supabase getUser call
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
            data: { user: { user_metadata: { staff_id: "mock-staff-id" } } },
            error: null,
        });

        // Mocking the employee data returned from Supabase
        mockSupabaseClient.from.mockImplementation((tableName) => {
            if (tableName === "employee") {
                return {
                    select: jest.fn().mockResolvedValueOnce({
                        data: [
                            {
                                staff_id: "1",
                                staff_fname: "John",
                                staff_lname: "Doe",
                                dept: "Finance",
                                position: "Manager",
                            },
                            {
                                staff_id: "2",
                                staff_fname: "Jane",
                                staff_lname: "Smith",
                                dept: "HR",
                                position: "Assistant",
                            },
                        ],
                        error: null,
                    }),
                };
            } else if (tableName === "arrangement") {
                return {
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValueOnce({
                            data: [
                                {
                                    arrangement_id: "123",
                                    staff_id: "1",
                                    date: "2024-10-10",
                                    start_date: "2024-10-10",
                                    end_date: "2024-10-10",
                                    recurrence_pattern: "weekly",
                                    type: "WFH",
                                    status: "approved",
                                    location: "Home",
                                    reason: "Medical",
                                    manager_id: "999",
                                    created_at: "2024-09-01",
                                    comments: "Doctor's note provided",
                                },
                            ],
                            error: null,
                        }),
                    }),
                };
            }
        });

        // Call the GET handler with the mocked request
        const response = await GET(mockRequest);

        // Expect the status code to be 200
        expect(response.status).toBe(200);

        // Check if the response matches the expected output
        expect(await response.json()).toEqual({
            message: "Organization arrangements retrieved successfully",
            data: [
                {
                    staff_id: "1",
                    staff_fname: "John",
                    staff_lname: "Doe",
                    dept: "Finance",
                    position: "Manager",
                    arrangements: [
                        {
                            arrangement_id: "123",
                            date: "2024-10-10",
                            start_date: "2024-10-10",
                            end_date: "2024-10-10",
                            recurrence_pattern: "weekly",
                            type: "WFH",
                            status: "approved",
                            location: "Home",
                            reason: "Medical",
                            manager_id: "999",
                            created_at: "2024-09-01",
                            comments: "Doctor's note provided",
                        },
                    ],
                },
                {
                    staff_id: "2",
                    staff_fname: "Jane",
                    staff_lname: "Smith",
                    dept: "HR",
                    position: "Assistant",
                    arrangements: [], // Empty array since Jane has no arrangements
                },
            ],
        });
    });
});
