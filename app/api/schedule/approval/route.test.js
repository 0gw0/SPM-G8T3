import { createClient } from '@/utils/supabase/server';
import { checkApprovalPermission } from '@/utils/rolePermissions';

jest.mock('@/utils/rolePermissions', () => ({
    checkApprovalPermission: jest.fn((handler) => handler)
  }));

import { PUT } from "./route"; 
import { GET } from "./route"; 



// Mock dependencies
jest.mock('@/utils/supabase/server');
jest.mock('@/utils/rolePermissions');

describe('Approval Endpoint', () => {
  let mockSupabase;
  let mockRequest;
  let mockUser;
  let mockEmployee;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Set up common mock objects
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    };

    createClient.mockReturnValue(mockSupabase);
    
    mockRequest = {
      json: jest.fn(),
    };

    mockUser = { id: 'test-user' };
    mockEmployee = { 
      staff_id: '999', 
      role: 'manager',
      reporting_manager: '999' 
    };

    // Mock the checkApprovalPermission wrapper
    checkApprovalPermission.mockImplementation((handler) => handler);
  });

  describe('GET Handler', () => {
    it('returns status 200 and successfully retrieve organization arrangements', async () => {
      // Mock employees data
      const mockEmployees = [
        {
          staff_id: '1',
          staff_fname: 'John',
          staff_lname: 'Doe',
          dept: 'Finance',
          position: 'Manager',
        }
      ];

      // Mock arrangements data
      const mockArrangements = [
        {
          staff_id: '1',
          arrangement_id: '123',
          date: '2024-10-10',
          start_date: '2024-10-10 09:00',
          end_date: '2024-10-10 17:00',
          type: 'WFH',
          status: 'pending',
        }
      ];

      // Setup Supabase mock for employees
      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({
          data: mockEmployees,
          error: null
        })
      });

      // Setup Supabase mock for arrangements
      mockSupabase.select.mockReturnValueOnce({
        order: jest.fn().mockResolvedValue({
          data: mockArrangements,
          error: null
        })
      });

      const response = await GET(mockRequest, mockUser, mockEmployee);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].arrangements).toHaveLength(1);
    });

    it('returns status error 500 in case of internal Supabase error', async () => {
      createClient.mockReturnValue(null);

      const response = await GET(mockRequest, mockUser, mockEmployee);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal server error');
    });

    it('returns status error 500 for employee fetch error', async () => {
      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Fetch error')
        })
      });

      const response = await GET(mockRequest, mockUser, mockEmployee);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to fetch employees');
    });


  describe('PUT Handler', () => {
    it('returns status 200 when successfully approving an arrangement', async () => {
      // Mock request body
      mockRequest.json.mockResolvedValue({
        arrangement_id: '123',
        status: 'approved'
      });

      // Mock existing arrangement
      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            arrangement_id: '123',
            manager_id: '999',
            status: 'pending'
          },
          error: null
        })
      });

      // Mock update
      mockSupabase.update.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            arrangement_id: '123',
            status: 'approved'
          },
          error: null
        })
      });

      const response = await PUT(mockRequest, mockUser, mockEmployee);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.status).toBe('approved');
    });

    it('returns status 200 when successfully rejecting an arrangement with comments', async () => {
      // Mock request body
      mockRequest.json.mockResolvedValue({
        arrangement_id: '123',
        status: 'rejected',
        comments: 'Annual Colonoscopy Day date clash'
      });

      // Mock existing arrangement
      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            arrangement_id: '123',
            manager_id: '999',
            status: 'pending'
          },
          error: null
        })
      });

      // Mock update
      mockSupabase.update.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            arrangement_id: '123',
            status: 'rejected',
            comments: 'Not approved'
          },
          error: null
        })
      });

      const response = await PUT(mockRequest, mockUser, mockEmployee);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.status).toBe('rejected');
    });

    it('returns error status 400 and rejects requests without arrangement_id or status', async () => {
      mockRequest.json.mockResolvedValue({});

      const response = await PUT(mockRequest, mockUser, mockEmployee);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Missing arrangement_id or status');
    });

    it('returns error status 400 and prevents rejection request if no comments provided', async () => {
      mockRequest.json.mockResolvedValue({
        arrangement_id: '123',
        status: 'rejected'
      });

      const response = await PUT(mockRequest, mockUser, mockEmployee);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Comments are required when rejecting an arrangement.');
    });

    it('returns error status 404 when arrangement not found', async () => {
      mockRequest.json.mockResolvedValue({
        arrangement_id: '123',
        status: 'approved'
      });

      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Not found')
        })
      });

      const response = await PUT(mockRequest, mockUser, mockEmployee);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Arrangement not found');
    });

    it('returns error 403 and prevents approval or rejection of request by unauthorized manager', async () => {
      mockRequest.json.mockResolvedValue({
        arrangement_id: '123',
        status: 'approved'
      });

      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            arrangement_id: '123',
            manager_id: '000', // Different from employee staff_id
            status: 'pending'
          },
          error: null
        })
      });

      const response = await PUT(mockRequest, mockUser, mockEmployee);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe('Not authorized to update this arrangement');
    });

    it('returns error 400 and prevents updating of non-pending arrangements', async () => {
      mockRequest.json.mockResolvedValue({
        arrangement_id: '123',
        status: 'approved'
      });

      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            arrangement_id: '123',
            manager_id: '999',
            status: 'approved' // Already not pending
          },
          error: null
        })
      });

      const response = await PUT(mockRequest, mockUser, mockEmployee);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Only pending arrangements can be updated');
    });


    it('returns error status 500 in case of arrangement update failure', async () => {
      mockRequest.json.mockResolvedValue({
        arrangement_id: '123',
        status: 'approved'
      });

      // Mock existing arrangement
      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            arrangement_id: '123',
            manager_id: '999',
            status: 'pending'
          },
          error: null
        })
      });

      // Mock update failure
      mockSupabase.update.mockReturnValueOnce({
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Update failed')
        })
      });

      const response = await PUT(mockRequest, mockUser, mockEmployee);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to update arrangement');
    });
  });
});
});
