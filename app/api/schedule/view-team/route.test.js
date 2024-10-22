import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkViewTeamPermission } from "@/utils/rolePermissions";

// Mock the imports
jest.mock("@/utils/supabase/server", () => ({
    createClient: jest.fn(),
}));

jest.mock("@/utils/rolePermissions", () => ({
    checkViewTeamPermission: jest.fn((handler) => handler),
}));

describe("View Team Route Handler", () => {
    let mockSupabaseClient;
    let mockRequest;
    let GET;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock request
        mockRequest = {
            headers: new Headers({
                Authorization: "Bearer mock-token",
            }),
        };

        // Setup basic Supabase mock functions
        mockSupabaseClient = {
            from: jest.fn(() => ({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        single: jest.fn(),
                    })),
                    in: jest.fn(() => ({
                        order: jest.fn(),
                    })),
                })),
            })),
        };

        createClient.mockReturnValue(mockSupabaseClient);

        // Import GET handler
        const route = require("./route");
        GET = route.GET;
    });

    // Test 1: Director/Manager
    it("should return both team views for director/manager", async () => {
        const mockManager = {
            staff_id: 130002,
            staff_fname: "Derek",
            staff_lname: "Tan",
            dept: "Sales",
            position: "Director",
            role: 1,
            reporting_manager: 130001,
        };

        // Mock for managed team employees query
        const managedTeamQuery = jest.fn().mockResolvedValue({
            data: [
                {
                    staff_id: 130003,
                    staff_fname: "Rahim",
                    staff_lname: "Khalid",
                    dept: "Sales",
                    position: "Manager",
                },
            ],
            error: null,
        });

        // Mock for reporting manager query
        const reportingManagerQuery = jest.fn().mockResolvedValue({
            data: {
                staff_id: 130001,
                staff_fname: "Jack",
                staff_lname: "Sim",
                dept: "CEO",
                position: "MD",
            },
            error: null,
        });

        // Mock for teammates query
        const teammatesQuery = jest.fn().mockResolvedValue({
            data: [mockManager],
            error: null,
        });

        // Mock for arrangements query
        const arrangementsQuery = jest.fn().mockResolvedValue({
            data: [],
            error: null,
        });

        // Setup the mock chain
        mockSupabaseClient.from.mockImplementation((table) => ({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockImplementation((field, value) => {
                    if (
                        field === "reporting_manager" &&
                        value === mockManager.staff_id
                    ) {
                        return managedTeamQuery();
                    } else if (
                        field === "staff_id" &&
                        value === mockManager.reporting_manager
                    ) {
                        return {
                            single: jest
                                .fn()
                                .mockReturnValue(reportingManagerQuery()),
                        };
                    } else if (
                        field === "reporting_manager" &&
                        value === mockManager.reporting_manager
                    ) {
                        return teammatesQuery();
                    }
                    return {
                        single: jest
                            .fn()
                            .mockResolvedValue({ data: null, error: null }),
                    };
                }),
                in: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue(arrangementsQuery()),
                }),
            }),
        }));

        const response = await GET(
            mockRequest,
            { user_metadata: { staff_id: mockManager.staff_id } },
            mockManager,
            true
        );

        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.managedTeam).toBeDefined();
        expect(responseData.reportingManagerTeam).toBeDefined();
        expect(responseData.role).toBe(1);
    });

    // Test 2: Regular Employee (Role 2)
    it("should return only team member arrangements for regular employees", async () => {
        const mockEmployee = {
            staff_id: 130003,
            staff_fname: "Janice",
            staff_lname: "Chan",
            dept: "Sales",
            position: "Staff",
            role: 2,
            reporting_manager: 130002,
        };

        // Mock for reporting manager query
        const reportingManagerQuery = jest.fn().mockResolvedValue({
            data: {
                staff_id: 130002,
                staff_fname: "Eric",
                staff_lname: "Loh",
                dept: "Sales",
                position: "Director",
            },
            error: null,
        });

        // Mock for teammates query
        const teammatesQuery = jest.fn().mockResolvedValue({
            data: [mockEmployee],
            error: null,
        });

        // Mock for arrangements query
        const arrangementsQuery = jest.fn().mockResolvedValue({
            data: [],
            error: null,
        });

        // Setup the mock chain
        mockSupabaseClient.from.mockImplementation((table) => ({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockImplementation((field, value) => {
                    if (
                        field === "staff_id" &&
                        value === mockEmployee.reporting_manager
                    ) {
                        return {
                            single: jest
                                .fn()
                                .mockReturnValue(reportingManagerQuery()),
                        };
                    } else if (
                        field === "reporting_manager" &&
                        value === mockEmployee.reporting_manager
                    ) {
                        return teammatesQuery();
                    }
                    return {
                        single: jest
                            .fn()
                            .mockResolvedValue({ data: null, error: null }),
                    };
                }),
                in: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue(arrangementsQuery()),
                }),
            }),
        }));

        const response = await GET(
            mockRequest,
            { user_metadata: { staff_id: mockEmployee.staff_id } },
            mockEmployee,
            false
        );

        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.teamMemberArrangements).toBeDefined();
        expect(responseData.managedTeam).toBeUndefined();
        expect(responseData.reportingManagerTeam).toBeUndefined();
        expect(responseData.role).toBe(2);
    });
    // Add these test cases after the existing ones...

    // Test 3: MD Jack Sim (Self-reporting manager)
    it("should return only managed team view for MD", async () => {
        const mockMD = {
            staff_id: 130001,
            staff_fname: "Jack",
            staff_lname: "Sim",
            dept: "CEO",
            position: "MD",
            role: 1,
            reporting_manager: 130001, // Self-reporting
        };

        // Mock for managed team employees query
        const managedTeamQuery = jest.fn().mockResolvedValue({
            data: [
                {
                    staff_id: 130002,
                    staff_fname: "Derek",
                    staff_lname: "Tan",
                    dept: "Sales",
                    position: "Director",
                },
                {
                    staff_id: 150008,
                    staff_fname: "Eric",
                    staff_lname: "Loh",
                    dept: "Solutioning",
                    position: "Director",
                },
            ],
            error: null,
        });

        // Mock for arrangements query
        const arrangementsQuery = jest.fn().mockResolvedValue({
            data: [],
            error: null,
        });

        mockSupabaseClient.from.mockImplementation((table) => ({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockImplementation((field, value) => {
                    if (
                        field === "reporting_manager" &&
                        value === mockMD.staff_id
                    ) {
                        return managedTeamQuery();
                    }
                    return {
                        single: jest
                            .fn()
                            .mockResolvedValue({ data: null, error: null }),
                    };
                }),
                in: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue(arrangementsQuery()),
                }),
            }),
        }));

        const response = await GET(
            mockRequest,
            { user_metadata: { staff_id: mockMD.staff_id } },
            mockMD,
            true
        );

        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.managedTeam).toBeDefined();
        expect(responseData.reportingManagerTeam).toBeUndefined();
        expect(responseData.role).toBe(1);
        expect(responseData.managedTeam[0].staff_id).toBe(mockMD.staff_id);
        expect(responseData.managedTeam.length).toBe(3); // MD + 2 directors
    });

    // Test 4: Error handling - Managed team fetch error
    it("should handle error when fetching managed team", async () => {
        const mockManager = {
            staff_id: 130002,
            staff_fname: "Derek",
            staff_lname: "Tan",
            dept: "Sales",
            position: "Director",
            role: 1,
            reporting_manager: 130001,
        };

        mockSupabaseClient.from.mockImplementation((table) => ({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Error fetching managed team employees" },
                }),
            }),
        }));

        const response = await GET(
            mockRequest,
            { user_metadata: { staff_id: mockManager.staff_id } },
            mockManager,
            true
        );

        expect(response.status).toBe(500);
        const errorData = await response.json();
        expect(errorData.error).toBe("Failed to fetch managed team employees");
    });

    // Test 5: Empty teams handling
    it("should handle case when manager has no direct reports", async () => {
        const mockManager = {
            staff_id: 130002,
            staff_fname: "Derek",
            staff_lname: "Tan",
            dept: "Sales",
            position: "Director",
            role: 1,
            reporting_manager: 130001,
        };

        // Mock for empty managed team
        const managedTeamQuery = jest.fn().mockResolvedValue({
            data: [],
            error: null,
        });

        // Mock for reporting manager
        const reportingManagerQuery = jest.fn().mockResolvedValue({
            data: {
                staff_id: 130001,
                staff_fname: "Jack",
                staff_lname: "Sim",
                dept: "CEO",
                position: "MD",
            },
            error: null,
        });

        // Mock for empty teammates
        const teammatesQuery = jest.fn().mockResolvedValue({
            data: [],
            error: null,
        });

        mockSupabaseClient.from.mockImplementation((table) => ({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockImplementation((field, value) => {
                    if (
                        field === "reporting_manager" &&
                        value === mockManager.staff_id
                    ) {
                        return managedTeamQuery();
                    } else if (
                        field === "staff_id" &&
                        value === mockManager.reporting_manager
                    ) {
                        return {
                            single: jest
                                .fn()
                                .mockReturnValue(reportingManagerQuery()),
                        };
                    } else if (
                        field === "reporting_manager" &&
                        value === mockManager.reporting_manager
                    ) {
                        return teammatesQuery();
                    }
                    return {
                        single: jest
                            .fn()
                            .mockResolvedValue({ data: null, error: null }),
                    };
                }),
                in: jest.fn().mockReturnValue({
                    order: jest
                        .fn()
                        .mockResolvedValue({ data: [], error: null }),
                }),
            }),
        }));

        const response = await GET(
            mockRequest,
            { user_metadata: { staff_id: mockManager.staff_id } },
            mockManager,
            true
        );

        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.managedTeam).toHaveLength(1); // Only the manager
        expect(responseData.reportingManagerTeam).toHaveLength(2); // Manager and their reporting manager
    });

    // Test 6: Arrangements data structure
    it("should return correct arrangement data structure", async () => {
        const mockEmployee = {
            staff_id: 130003,
            staff_fname: "Janice",
            staff_lname: "Chan",
            dept: "Sales",
            position: "Staff",
            role: 2,
            reporting_manager: 130002,
        };

        const mockArrangement = {
            arrangement_id: 1,
            staff_id: 130003,
            date: "2024-01-01",
            start_date: "2024-01-01",
            end_date: "2024-01-01",
            recurrence_pattern: null,
            type: "WFH",
            status: "Approved",
            location: "Home",
            reason: "Remote work",
            manager_id: 130002,
            created_at: "2024-01-01T00:00:00",
            comments: "Approved by manager",
            employee: {
                staff_fname: "Janice",
                staff_lname: "Chan",
                dept: "Sales",
                position: "Staff",
            },
        };

        // Set up mocks with arrangement data
        mockSupabaseClient.from.mockImplementation((table) => ({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockImplementation((field, value) => {
                    if (field === "reporting_manager") {
                        return jest.fn().mockResolvedValue({
                            data: [mockEmployee],
                            error: null,
                        })();
                    }
                    return {
                        single: jest.fn().mockResolvedValue({
                            data: mockEmployee,
                            error: null,
                        }),
                    };
                }),
                in: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                        data: [mockArrangement],
                        error: null,
                    }),
                }),
            }),
        }));

        const response = await GET(
            mockRequest,
            { user_metadata: { staff_id: mockEmployee.staff_id } },
            mockEmployee,
            false
        );

        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(
            responseData.teamMemberArrangements[0].arrangements[0]
        ).toMatchObject({
            arrangement_id: expect.any(Number),
            staff_id: expect.any(Number),
            date: expect.any(String),
            start_date: expect.any(String),
            end_date: expect.any(String),
            type: expect.any(String),
            status: expect.any(String),
            location: expect.any(String),
            reason: expect.any(String),
            manager_id: expect.any(Number),
            created_at: expect.any(String),
            comments: expect.any(String),
        });
    });
});
