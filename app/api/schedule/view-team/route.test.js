import { handler } from "./route";
import { createClient } from "@/utils/supabase/server";

// Mock the Supabase client
jest.mock("@/utils/supabase/server", () => ({
    createClient: jest.fn(),
}));

const mockSupabase = {
    from: jest.fn(() => mockSupabase),
    select: jest.fn(() => mockSupabase),
    eq: jest.fn(() => mockSupabase),
    in: jest.fn(() => mockSupabase),
    order: jest.fn(() => mockSupabase),
    single: jest.fn(() => mockSupabase),
};

createClient.mockReturnValue(mockSupabase);

describe("Backend Tests for View Team Route", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Should fetch managed team and reporting manager team for Role 1 or 3", async () => {
        // Mock data for managed team employees
        const managerEmployees = [
            {
                staff_id: 2,
                staff_fname: "John",
                staff_lname: "Doe",
                dept: "Sales",
                position: "Manager",
            },
        ];

        // Mock arrangements
        const arrangements = [
            {
                arrangement_id: 1,
                staff_id: 2,
                date: "2024-10-15",
                status: "approved",
            },
        ];

        // Mock Supabase responses
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
                eq: jest.fn().mockReturnValueOnce({
                    data: managerEmployees,
                    error: null,
                }),
            }),
        });

        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
                in: jest
                    .fn()
                    .mockReturnValueOnce({ data: arrangements, error: null }),
                order: jest
                    .fn()
                    .mockReturnValue({ data: arrangements, error: null }),
            }),
        });

        const req = {}; // Mocked request object
        const user = {}; // Mocked user
        const employee = { staff_id: 1, role: 1, reporting_manager: null }; // Logged-in employee

        const response = await handler(req, user, employee);
        const jsonResponse = await response.json();

        expect(jsonResponse.managedTeam).toHaveLength(2); // Managed team + logged-in employee
        expect(jsonResponse.reportingManagerTeam).toHaveLength(1); // Reporting manager's team
        expect(response.status).toBe(200);
    });

    test("Should fetch team arrangements for Role 2", async () => {
        // Mock data for teammates
        const teammates = [
            {
                staff_id: 2,
                staff_fname: "John",
                staff_lname: "Doe",
                dept: "HR",
                position: "Executive",
            },
        ];

        // Mock arrangements
        const arrangements = [
            {
                arrangement_id: 1,
                staff_id: 2,
                date: "2024-10-15",
                status: "approved",
            },
        ];

        // Mock Supabase responses
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
                eq: jest
                    .fn()
                    .mockReturnValueOnce({ data: teammates, error: null }),
            }),
        });

        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
                in: jest
                    .fn()
                    .mockReturnValueOnce({ data: arrangements, error: null }),
                order: jest
                    .fn()
                    .mockReturnValue({ data: arrangements, error: null }),
            }),
        });

        const req = {}; // Mocked request object
        const user = {}; // Mocked user
        const employee = { staff_id: 1, role: 2, reporting_manager: 10 }; // Logged-in employee

        const response = await handler(req, user, employee);
        const jsonResponse = await response.json();

        expect(jsonResponse.teamMemberArrangements).toHaveLength(2); // Teammates + logged-in employee
        expect(response.status).toBe(200);
    });

    test("Should handle errors gracefully", async () => {
        // Mock error from Supabase
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
                eq: jest.fn().mockReturnValueOnce({
                    data: null,
                    error: "Database error",
                }),
            }),
        });

        const req = {}; // Mocked request object
        const user = {}; // Mocked user
        const employee = { staff_id: 1, role: 2, reporting_manager: 10 }; // Logged-in employee

        const response = await handler(req, user, employee);
        const jsonResponse = await response.json();

        expect(jsonResponse.error).toBe("Failed to fetch teammates");
        expect(response.status).toBe(500);
    });
});
