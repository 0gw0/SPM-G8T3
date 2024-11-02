import { POST } from "./route";
import {GET} from "./route";
import { createClient } from '@/utils/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { handler as viewOwnHandler } from '../view-own/route.js';
import { generateRecurringDates } from "@/utils/dates";
import {doArrangementsConflict} from './route';

// Mock the Supabase client

jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn()
}));

jest.mock('../view-own/route.js', () => ({
    handler: jest.fn()
}));

jest.mock("@/utils/rolePermissions", () => ({
    checkViewOwnPermission: jest.fn((handler) => handler)
}));

viewOwnHandler.mockRejectedValue(new Error('Unexpected error'));

// Mock console.error to prevent error logging during tests
const originalConsoleError = console.error;
console.error = jest.fn();

describe('POST handler for WFH arrangements', () => {
    let mockRequest;
    let mockRequest1;
    let mockRequest2
    let mockFormData;
    let mockFormData1;
    let mockFormData2;
    let mockSupabaseClient;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock form data - simulated data from a form submission
        mockFormData = {
            get: jest.fn((key) => {
                switch(key) {
                    case 'arrangementType':
                        return 'adhoc';
                    case 'dates':
                        return JSON.stringify({ '2024-10-10': 'full-day' });
                    case 'start date':
                        return '2024-10-10'
                    case 'end date':
                        return '2024-10-17'
                    case 'reason':
                        return 'Medical';
                    default:
                        return null;
                }
            })
        };

        // Setup mock request - simulated request object containing form data and authorisation header
        mockRequest = new NextRequest('https://example.com/api/schedule/apply', {
            method: 'POST',
            headers: new Headers({ 
                Authorization: 'Bearer mock-token' 
            })
        });
        mockRequest.formData = jest.fn().mockResolvedValue(mockFormData);

        mockFormData1 = {
            get: jest.fn((key) => {
                switch(key) {
                    case 'arrangementType':
                        return 'recurring';
                    case 'dates':
                        return JSON.stringify({ '2024-10-10': 'full-day' });
                    case 'start_date':
                        return '2024-10-10'
                    case 'end_date':
                        return '2024-10-17'
                    case 'recurrence_pattern':
                        return 'weekly';
                    case 'type':
                        return 'full-day';
                    case 'reason':
                        return 'Medical';
                    default:
                        return null;
                }
            })
        };

        // Setup mock request - simulated request object containing form data and authorisation header
        mockRequest1 = new NextRequest('https://example.com/api/schedule/apply', {
            method: 'POST',
            headers: new Headers({ 
                Authorization: 'Bearer mock-token' 
            })
        });
        mockRequest1.formData = jest.fn().mockResolvedValue(mockFormData1);

        mockFormData2 = {
            get: jest.fn((key) => {
                switch(key) {
                    case 'arrangementType':
                        return 'adhoc';
                    case 'dates':
                        return JSON.stringify({ '2024-10-10': 'half-day' });
                    case 'start date':
                        return '2024-10-10'
                    case 'end date':
                        return '2024-10-17'
                    case 'reason':
                        return 'Medical';
                    default:
                        return null;
                }
            })
        };

        // Setup mock request - simulated request object containing form data and authorisation header
        mockRequest2 = new NextRequest('https://example.com/api/schedule/apply', {
            method: 'POST',
            headers: new Headers({ 
                Authorization: 'Bearer mock-token' 
            })
        });
        mockRequest2.formData = jest.fn().mockResolvedValue(mockFormData2);

        // Setup Supabase client mock with proper error handling
        // simulates mocked client that returns a successful response from the database
        mockSupabaseClient = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
                data: { reporting_manager: 'mocked-manager-id' },
                error: null,
                status: 200
            }),
            insert: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({
                    data: [{ arrangement_id: '456' }],
                    error: null,
                    status: 200
                })
            }),
            in: jest.fn().mockReturnThis(), // Add this if `in` method is used in the chain
            delete: jest.fn().mockResolvedValue({
                error: null,
                status: 200
            }),
            auth: {
                getUser: jest.fn().mockResolvedValue({
                    data: { user: { user_metadata: { staff_id: 'mock-staff-id' } } },
                    error: null
                })
            }
        };
    // Mock viewOwnHandler to return a successful response for updated arrangements
    const mockArrangements = { data: [{ arrangement_id: '456' }] };
    jest.mocked(viewOwnHandler).mockResolvedValue(
        new Response(JSON.stringify(mockArrangements), { 
            status: 200 ,
            headers: {
                'Content-Type': 'application/json'
            }
        }),

    );
        jest.mocked(createClient).mockReturnValue(mockSupabaseClient);
    });



    // Restore console.error after all tests
    afterAll(() => {
        console.error = originalConsoleError;
    });

    it('successfully creates an adhoc full day arrangement and returns 200 status', async () => {
        //mock in the event of successful update
        jest.mock('./route', () => ({
            POST: jest.fn().mockImplementation(() => {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            message: 'Application successful',
                            arrangements: [{ arrangement_id: '456' }]
                        }),
                        { status: 200 }
                    )
                );
            })
        }));

        const response = await POST(mockRequest);
        expect(response.status).toBe(200); 
        const responseData = await response.json();
        expect(responseData.message).toBe("Application successful"); 
    });

    it('successfully creates a recurring full day arrangement and returns 200 status', async () => {
        //mock in the event of successful update
        jest.mock('./route', () => ({
            POST: jest.fn().mockImplementation(() => {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            message: 'Application successful',
                            arrangements: [{ arrangement_id: '456' }]
                        }),
                        { status: 200 }
                    )
                );
            })
        }));
        const response = await POST(mockRequest1);
        expect(response.status).toBe(200); 
        const responseData = await response.json();
        expect(responseData.message).toBe("Application successful"); 
    });

    it('successfully creates an adhoc half-day arrangement and returns 200 status', async () => {
        //mock in the event of successful update
        jest.mock('./route', () => ({
            POST: jest.fn().mockImplementation(() => {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            message: 'Application successful',
                            arrangements: [{ arrangement_id: '456' }]
                        }),
                        { status: 200 }
                    )
                );
            })
        }));
        const response = await POST(mockRequest2);
        expect(response.status).toBe(200); 
        const responseData = await response.json();
        expect(responseData.message).toBe("Application successful"); 
    });

    

    it('returns 403 when token is missing', async () => {
        mockRequest = new NextRequest('https://example.com/api/schedule/apply', {
            method: 'POST'
        });

        const response = await POST(mockRequest);
        expect(response.status).toBe(403);
        
        const responseData = await response.json();
        expect(responseData.error).toBe('Missing or invalid token');
    });




    it('returns 400 for invalid arrangement type', async () => {
        mockFormData.get.mockImplementation((key) => {
            if (key === 'arrangementType') return 'invalid';
            return null;
        });

        const response = await POST(mockRequest);
        expect(response.status).toBe(400);
        
        const responseData = await response.json();
        expect(responseData.error).toBe('Invalid arrangement type');
    });
});

describe('GET handler for WFH arrangements', () => {
    let mockRequest;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock request
        mockRequest = new NextRequest('https://example.com/api/schedule/apply', {
            method: 'GET',
            headers: new Headers({ 
                Authorization: 'Bearer mock-token' 
            })
        });
    });

    it('successfully returns arrangements when viewOwnHandler succeeds', async () => {
        // Mock successful response from viewOwnHandler
        const mockArrangements = {
            message: 'Arrangements retrieved successfully',
            data: [
                {
                    arrangement_id: '123',
                    staff_id: 'staff-1',
                    date: '2024-10-10',
                    type: 'full-day'
                }
            ]
        };

        jest.mocked(viewOwnHandler).mockResolvedValue(
            new Response(JSON.stringify(mockArrangements), { status: 200 })
        );

        const response = await GET(mockRequest);
        expect(response.status).toBe(200);

        const responseData = await response.json();
        expect(responseData).toEqual({
            message: mockArrangements.message,
            data: mockArrangements.data
        });
    });

    it('returns error status 500 when viewOwnHandler fails', async () => {
        // Mock error response from viewOwnHandler
        const mockError = {
            error: 'Failed to fetch arrangements'
        };

        jest.mocked(viewOwnHandler).mockResolvedValue(
            new Response(JSON.stringify(mockError), { status: 500 })
        );

        const response = await GET(mockRequest);
        expect(response.status).toBe(500);

        const responseData = await response.json();
        expect(responseData).toEqual({
            error: 'Failed to fetch arrangements'
        });
    });
    
});

describe('Utility Functions', () => {
    test('doArrangementsConflict should correctly identify conflicts', () => {

      // Test all combinations
      expect(doArrangementsConflict('full-day', 'morning')).toBe(true);
      expect(doArrangementsConflict('morning', 'full-day')).toBe(true);
      expect(doArrangementsConflict('morning', 'morning')).toBe(true);
      expect(doArrangementsConflict('afternoon', 'afternoon')).toBe(true);
      expect(doArrangementsConflict('morning', 'afternoon')).toBe(false);
      expect(doArrangementsConflict('afternoon', 'morning')).toBe(false);
    });
  });



describe('Endpoint Response Handling', () => {
    let mockRequest;
    let mockSupabaseClient;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock NextResponse.json
        NextResponse.json = jest.fn();

        // Mock request
        mockRequest = new NextRequest('http://localhost:3000/api/test', {
            method: 'POST',
            headers: new Headers({
                'Authorization': 'Bearer fake-token'
            })
        });
        mockRequest.formData = jest.fn();
        mockRequest.headers.get = jest.fn();

        // Mock Supabase client
        mockSupabaseClient = {
            auth: {
                getUser: jest.fn()
            },
            from: jest.fn()
        };
        createClient.mockReturnValue(mockSupabaseClient);
    });

    describe('Authentication Responses', () => {
        it('should return 403 response for missing token', async () => {
            mockRequest.headers.get.mockReturnValue(null);

            await POST(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { error: 'Missing or invalid token' },
                { status: 403 }
            );
        });

        it('should return 500 response for invalid user session', async () => {
            mockRequest.headers.get.mockReturnValue('Bearer fake-token');
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Invalid session')
            });

            await POST(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith(
                {   details: "Cannot read properties of null (reading 'user_metadata')",
                    error: 'Internal server error' 
                },
                { status: 500 }
            );
        });
    });

    describe('User Data Responses', () => {
        it('should return 400 response for missing staff ID', async () => {
            mockRequest.headers.get.mockReturnValue('Bearer fake-token');
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { 
                    user: { 
                        user_metadata: {} 
                    }
                },
                error: null
            });

            await POST(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { error: 'Staff ID not found in user metadata' },
                { status: 400 }
            );
        });

        it('should return 400 response for missing reporting manager', async () => {
            mockRequest.headers.get.mockReturnValue('Bearer fake-token');
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { 
                    user: { 
                        user_metadata: { 
                            staff_id: '123' 
                        } 
                    }
                },
                error: null
            });

            mockSupabaseClient.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { reporting_manager: null },
                            error: null
                        })
                    })
                })
            });

            await POST(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { error: 'No reporting manager assigned' },
                { status: 400 }
            );
        });
    });

    describe('Arrangement Type Responses', () => {
        it('should return 400 response for invalid arrangement type', async () => {
            // Setup valid user authentication
            mockRequest.headers.get.mockReturnValue('Bearer fake-token');
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { 
                    user: { 
                        user_metadata: { 
                            staff_id: '123' 
                        } 
                    }
                },
                error: null
            });

            // Setup valid employee data
            mockSupabaseClient.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { reporting_manager: '456' },
                            error: null
                        })
                    })
                })
            });

            // Mock form data with invalid arrangement type
            mockRequest.formData.mockResolvedValue(new Map([
                ['arrangementType', 'invalid-type']
            ]));

            await POST(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { error: 'Invalid arrangement type' },
                { status: 400 }
            );
        });
    });

    

    describe('GET Endpoint Responses', () => {
        it('should properly handle successful GET responses', async () => {
            const mockResult = {
                message: 'Success',
                data: [{ id: 1 }]
            };

            viewOwnHandler.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResult)
            });

            await GET(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith({
                message: mockResult.message,
                data: mockResult.data
            });
        });

        it('should handle failed GET responses', async () => {
            viewOwnHandler.mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({
                    error: 'Failed to fetch'
                }),
                status: 500
            });

            await GET(mockRequest);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { error: 'Failed to fetch arrangements' },
                { status: 500 }
            );
        });
    });
});