import { POST } from './route';
import {GET} from './route';
import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';
import { handler as viewOwnHandler } from '../view-own/route.js';


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

    it('returns error when viewOwnHandler fails', async () => {
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


    it('handles unexpected errors from viewOwnHandler', async () => {
        // Mock viewOwnHandler to return an error response
        const mockErrorResponse = new Response(
            JSON.stringify({ error: 'Unexpected error occurred' }), 
            { status: 500 }
        );
    
        viewOwnHandler.mockResolvedValueOnce(mockErrorResponse);
    
        const response = await GET(mockRequest);
        expect(response.status).toBe(500);
    
        const responseData = await response.json();
        expect(responseData).toEqual({
            error: 'Failed to fetch arrangements'
        });
    });
    
});