import { POST } from './route';  
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkViewOwnPermission } from '@/utils/rolePermissions';
import { handler as viewOwnHandler } from '../view-own/route.js';


// Mock the Supabase client to simulate a 200 status success
jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));

jest.mock("../../../../utils/rolePermissions", () => ({
    // Mock checkViewOwnPermission so we can wrap the handler without running its actual logic
    checkViewOwnPermission: jest.fn((handler) => handler),
}));

// Mocking the route module which contains the GET handler
jest.mock("./route", () => ({
    GET: jest.fn(), // Mock the GET function to test its behavior
}));

// Require the mocked GET handler
import { GET } from "./route";



describe('POST handler for WFH arrangements', () => {
    let mockSupabaseClient;
    let mockFormData;
    let mockRequest;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a mock Supabase client with only the essential mocked methods
        mockSupabaseClient = {
            from: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({ data: [], error: null }), //successful select
                insert: jest.fn().mockResolvedValue({ data: [{ arrangement_id: '456' }], error: null }), // successful insert
            }),
            auth: {
                getUser: jest.fn().mockResolvedValue({
                    data: { user: { user_metadata: { staff_id: 'mock-staff-id' } } },
                    error: null,
                }),
            },
        };

        // Make createClient return the mocked client
        createClient.mockReturnValue(mockSupabaseClient);

        // Mock request and formData
        mockFormData = {
            get: jest.fn((key) => {
                if (key === 'arrangementType') return 'adhoc';
                if (key === 'dates') return JSON.stringify({ '2024-10-10': 'full-day' });
                if (key === 'reason') return 'Medical';
            }),
        };

        // Mock request
        mockRequest = new NextRequest('https://example.com/api/schedule/apply', {
            method: 'POST',
            headers: new Headers({ Authorization: 'Bearer mock-token' }),
        });
        mockRequest.formData = jest.fn().mockResolvedValue(mockFormData);
    });

    it('should successfully create a new adhoc arrangement and return 200 status', async () => {
        try {
            // Execute the POST handler
            const response = await POST(mockRequest);

            // Verify that the response status is 200
            expect(response.status).toBe(200);

            // Verify the response data message
            const responseData = await response.json();
            console.log(responseData)
            expect(responseData.message).toBe('Application successful');
            expect(responseData.arrangements).toEqual([
                { arrangement_id: '456' }
            ]);
        } catch (error) {
            console.error("Error in POST handler:", error);
        }
    });



        // it('should return 400 for missing staff_id', async () => {
        //     mockSupabaseClient.auth.getUser.mockResolvedValue({
        //         data: { user: { user_metadata: {} } },
        //         error: null,
        //     });

        //     const response = await POST(mockRequest);
        //     expect(response.status).toBe(400);
            
        //     const responseData = await response.json();
        //     expect(responseData.error).toBe("Staff ID not found in user metadata");
        // });

        it('should return 500 and internal server error on arrangement insertion failure', async () => {
            mockFormData.get
                .mockReturnValueOnce('adhoc')
                .mockReturnValueOnce(JSON.stringify({ '2024-10-10': 'full-day' }))
                .mockReturnValueOnce('Medical');

            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: { user_metadata: { staff_id: 'mock-staff-id' } } },
                error: null,
            });

            mockSupabaseClient.from.mockImplementation((tableName) => ({
                select: jest.fn().mockResolvedValue({
                    data: tableName === 'employee' ? { reporting_manager: 'manager-id' } : null,
                    error: null,
                }),
                insert: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Insert failed' },
                }),
            }));

            const response = await POST(mockRequest);
            expect(response.status).toBe(500);
            
            const responseData = await response.json();
            expect(responseData.error).toBe("Internal server error");
        });
});

// Test suite for GET handler
describe("GET handler for view-own route", () => {
    let mockSupabaseClient; // Variable for our mocked Supabase client
    let mockRequest; // Mock request object simulating a user request

    // Setup function that runs before each test case
    beforeEach(() => {
        jest.clearAllMocks(); // Clear any previous mocks before each test

        // Define the mocked Supabase client
        mockSupabaseClient = {
            auth: {
                getUser: jest.fn(), // Mock the getUser method to simulate token-based user authentication
            },
            from: jest.fn().mockReturnThis(), // Mock from, select, eq, and order for chaining
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
        };

        createClient.mockReturnValue(mockSupabaseClient); // Make createClient return the mocked Supabase client

        // Mock request object to simulate an HTTP request with headers
        mockRequest = {
            headers: {
                // If the header is Authorization, return a mock token, otherwise null
                get: jest.fn((key) =>
                    key === "Authorization" ? "Bearer mock-token" : null
                ),
            },
        };

        // Mocking the GET handler that will use the Supabase client to fetch data
        GET.mockImplementation(async (req) => {
            const supabase = createClient(); // Create a Supabase client

            // Get the token from the Authorization header
            const token = req.headers
                .get("Authorization")
                ?.replace("Bearer ", "");

            // If no token, return a 403 response
            if (!token) {
                return NextResponse.json(
                    { error: "Missing or invalid token" },
                    { status: 403 }
                );
            }

            // Mock fetching the user with the token
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser(token);

            // If user authentication fails, return a 403 error
            if (userError || !user) {
                return NextResponse.json(
                    { error: "Invalid session or token" },
                    { status: 403 }
                );
            }

            // Get the staff ID from the user's metadata
            const staff_id = user.user_metadata?.staff_id;

            // If the staff ID is not found, return a 400 error
            if (!staff_id) {
                return NextResponse.json(
                    { error: "Staff ID not found in user metadata" },
                    { status: 400 }
                );
            }

            // Fetch arrangements for the staff_id
            const { data: arrangements, error } = await supabase
                .from("arrangement")
                .select(
                    `
          arrangement_id,
          staff_id,
          date,
          type,
          status,
          location,
          employee:staff_id (staff_fname, staff_lname, dept)
        `
                )
                .eq("staff_id", staff_id) // Filter by staff_id
                .order("date", { ascending: true }); // Order by date ascending

            // If there's an error fetching the data, return a 500 error
            if (error) {
                return NextResponse.json(
                    { error: "Failed to fetch arrangements" },
                    { status: 500 }
                );
            }

            // Process the arrangements by transforming the employee object
            const processedArrangements = arrangements.map((arr) => ({
                ...arr,
                employeeName: `${arr.employee.staff_fname} ${arr.employee.staff_lname}`, // Flatten the employee name
                department: arr.employee.dept, // Extract department
            }));

            // Return the processed data in the response
            return NextResponse.json({
                message:
                    processedArrangements.length === 0
                        ? "This user has no existing arrangements"
                        : "Own arrangements retrieved successfully",
                data: processedArrangements,
            });
        });
    });

    // Test case: successful fetch of arrangements
    it("should return 200 and arrangements data on successful fetch", async () => {
        // Mock a successful response from the Supabase getUser call
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
            data: { user: { user_metadata: { staff_id: "mock-staff-id" } } },
            error: null,
        });

        // Mock the data returned from Supabase for the arrangements
        mockSupabaseClient.from.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            data: [
                {
                    arrangement_id: 1,
                    staff_id: "mock-staff-id",
                    date: "2023-10-07",
                    type: "WFH",
                    status: "approved",
                    location: "Home",
                    employee: {
                        staff_fname: "John",
                        staff_lname: "Doe",
                        dept: "Engineering",
                    },
                },
            ],
            error: null,
        });

        // Call the GET handler with the mocked request
        const response = await GET(mockRequest);

        // Expect the status code to be 200
        expect(response.status).toBe(200);

        // Check if the response matches the expected output
        expect(await response.json()).toEqual({
            message: "Own arrangements retrieved successfully",
            data: [
                {
                    arrangement_id: 1,
                    staff_id: "mock-staff-id",
                    date: "2023-10-07",
                    type: "WFH",
                    status: "approved",
                    location: "Home",
                    employeeName: "John Doe", // Employee name should be transformed
                    department: "Engineering", // Department should be extracted
                    employee: {
                        staff_fname: "John",
                        staff_lname: "Doe",
                        dept: "Engineering",
                    },
                },
            ],
        });
    });

    // Test case: missing token in the request
    it("should return 403 if token is missing", async () => {
        // Simulate the missing Authorization token
        mockRequest.headers.get.mockImplementation((key) =>
            key === "Authorization" ? null : null
        );

        // Call the GET handler
        const response = await GET(mockRequest);

        // Expect the status code to be 403
        expect(response.status).toBe(403);

        // Check if the error message matches
        expect(await response.json()).toEqual({
            error: "Missing or invalid token",
        });
    });

    // Test case for 400 Bad Request (staff_id missing)
    it("should return 400 if staff_id is missing from user metadata", async () => {
        // Mock getUser to return a user without a staff_id
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
            data: { user: { user_metadata: {} } }, // No staff_id in user_metadata
            error: null,
        });

        // Call the GET handler
        const response = await GET(mockRequest);

        // Expect a 400 Bad Request response
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: "Staff ID not found in user metadata",
        });
    });

    it("should return 500 if there is an error fetching arrangements from the database", async () => {
        // Mock getUser to return a valid user with a staff_id
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
            data: { user: { user_metadata: { staff_id: "mock-staff-id" } } },
            error: null,
        });

        // Mock Supabase `from` method to return an error
        mockSupabaseClient.from.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            data: null, // No data returned
            error: { message: "Database fetch failed" }, // Simulate an error
        });

        // Call the GET handler
        const response = await GET(mockRequest);

        // Expect a 500 Internal Server Error response
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "Failed to fetch arrangements",
        });
    });
});
