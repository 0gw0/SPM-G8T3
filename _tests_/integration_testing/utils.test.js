import { NextResponse } from "next/server";
import {
    checkRolePermission,
    checkViewOrgPermission,
    checkViewOwnPermission,
    checkViewTeamPermission,
    checkApprovalPermission,
    checkAllReportingManagers,
} from "@/utils/rolePermissions";

const mockRequest = (user = null, path = "/") => ({
    url: `http://example.com${path}`, // Add base URL to make it a valid URL
    method: "GET",
    headers: {
        Authorization: `Bearer ${user ? "mock-token" : ""}`,
    },
});

// Mock Supabase Setup
jest.mock("@/utils/supabase/server", () => ({
    createClient: jest.fn(),
}));

describe("Role Permission Tests", () => {
    let mockSupabase;

    beforeEach(() => {
        jest.clearAllMocks();

        // Restructure the mock to properly handle the chained calls
        mockSupabase = {
            auth: {
                getUser: jest.fn(),
            },
            from: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn(),
                    }),
                }),
            }),
        };

        const { createClient } = require("@/utils/supabase/server");
        createClient.mockReturnValue(mockSupabase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // checkRolePermission Tests
    describe("checkRolePermission", () => {
        it("should return 401 when user is not authenticated", async () => {
            // Set up auth response with null user
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
            });

            const request = mockRequest();
            const handler = jest.fn();
            const middleware = checkRolePermission(handler);
            const response = await middleware(request);

            expect(response.status).toBe(401);
            expect(handler).not.toHaveBeenCalled();
        });

        it("should return 404 when employee is not found", async () => {
            const user = { user_metadata: { staff_id: 123 } };

            // Set up auth response with valid user
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user },
                error: null,
            });

            // Set up employee query response with no data
            const mockSingle = jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Not found" },
            });

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: mockSingle,
                    }),
                }),
            });

            const request = mockRequest(user);
            const handler = jest.fn();
            const middleware = checkRolePermission(handler);
            const response = await middleware(request);

            expect(response.status).toBe(404);
            expect(handler).not.toHaveBeenCalled();
        });

        it("should call handler when authorized", async () => {
            const user = { user_metadata: { staff_id: 123, role: 1 } };
            const employee = { staff_id: 123, name: "Test User" };

            // Set up auth response with valid user
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user },
                error: null,
            });

            // Set up employee query response with valid data
            const mockSingle = jest.fn().mockResolvedValue({
                data: employee,
                error: null,
            });

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: mockSingle,
                    }),
                }),
            });

            const request = mockRequest(user);
            const handler = jest.fn().mockReturnValue(new NextResponse());
            const middleware = checkRolePermission(handler);
            await middleware(request);

            expect(handler).toHaveBeenCalledWith(request, user, {
                ...employee,
                role: 1,
            });
        });
    });

    // checkViewOrgPermission Tests
    describe("checkViewOrgPermission", () => {
        it("should allow access for director role", async () => {
            const user = { user_metadata: { staff_id: 123, role: 1 } };
            const employee = { staff_id: 123, role: 1 };
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user } });
            const mockSingle = jest.fn().mockResolvedValue({
                data: employee,
                error: null,
            });

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: mockSingle,
                    }),
                }),
            });

            const request = mockRequest(user);
            const handler = jest.fn().mockReturnValue(new NextResponse());
            const middleware = checkViewOrgPermission(handler);
            await middleware(request);

            expect(handler).toHaveBeenCalled();
        });

        it("should deny access for non-director roles", async () => {
            const user = { user_metadata: { staff_id: 123, role: 2 } };
            const employee = { staff_id: 123, role: 2 };
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user } });
            const mockSingle = jest.fn().mockResolvedValue({
                data: employee,
                error: null,
            });

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: mockSingle,
                    }),
                }),
            });

            const request = mockRequest(user);
            const handler = jest.fn();
            const middleware = checkViewOrgPermission(handler);
            const response = await middleware(request);

            expect(response.status).toBe(403);
            expect(handler).not.toHaveBeenCalled();
        });
    });

    // checkViewOwnPermission Tests
    describe("checkViewOwnPermission", () => {
        it("should allow viewing own profile", async () => {
            const user = { user_metadata: { staff_id: 123, role: 2 } };
            const employee = { staff_id: 123, role: 2 };
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user } });
            const mockSingle = jest.fn().mockResolvedValue({
                data: employee,
                error: null,
            });

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: mockSingle,
                    }),
                }),
            });

            const request = mockRequest(user, "/?employee_id=123");
            const handler = jest.fn().mockReturnValue(new NextResponse());
            const middleware = checkViewOwnPermission(handler);
            await middleware(request);

            expect(handler).toHaveBeenCalled();
        });

        it("should allow managers to view team members", async () => {
            const user = { user_metadata: { staff_id: 123, role: 3 } };
            const employee = {
                staff_id: 123,
                role: 3,
                reporting_manager: 123,
            };
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user } });
            const mockSingle = jest.fn().mockResolvedValue({
                data: employee,
                error: null,
            });

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: mockSingle,
                    }),
                }),
            });

            const request = mockRequest(user, "/?employee_id=456");
            const handler = jest.fn().mockReturnValue(new NextResponse());
            const middleware = checkViewOwnPermission(handler);
            await middleware(request);

            expect(handler).toHaveBeenCalled();
        });

        it("should deny access to other profiles for regular staff", async () => {
            const user = { user_metadata: { staff_id: 123, role: 2 } };
            const employee = { staff_id: 123, role: 2 };
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user } });
            const mockSingle = jest.fn().mockResolvedValue({
                data: employee,
                error: null,
            });

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: mockSingle,
                    }),
                }),
            });

            const request = mockRequest(user, "/?employee_id=456");
            const handler = jest.fn();
            const middleware = checkViewOwnPermission(handler);
            const response = await middleware(request);

            expect(response.status).toBe(403);
            expect(handler).not.toHaveBeenCalled();
        });
    });

    // checkViewTeamPermission Tests
    describe("checkViewTeamPermission", () => {
        it("should set isManager true for directors", async () => {
            const user = { user_metadata: { staff_id: 123, role: 1 } };
            const employee = { staff_id: 123, role: 1 };
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user } });
            mockSupabase.from().select().eq().single.mockResolvedValue({
                data: employee,
                error: null,
            });

            const request = mockRequest(user);
            const handler = jest.fn().mockReturnValue(new NextResponse());
            const middleware = checkViewTeamPermission(handler);
            await middleware(request);

            expect(handler).toHaveBeenCalledWith(request, user, employee, true);
        });

        it("should set isManager false for staff", async () => {
            const user = { user_metadata: { staff_id: 123, role: 2 } };
            const employee = { staff_id: 123, role: 2 };
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user } });
            mockSupabase.from().select().eq().single.mockResolvedValue({
                data: employee,
                error: null,
            });

            const request = mockRequest(user);
            const handler = jest.fn().mockReturnValue(new NextResponse());
            const middleware = checkViewTeamPermission(handler);
            await middleware(request);

            expect(handler).toHaveBeenCalledWith(
                request,
                user,
                employee,
                false
            );
        });
    });

    describe('checkAllReportingManagers', () => {
    
        it('should return unauthorized if user is not authenticated', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
            });

            const request = mockRequest();
            const handler = jest.fn();
            const middleware = checkRolePermission(handler);
            const response = await middleware(request);

            expect(response.status).toBe(401);
            expect(handler).not.toHaveBeenCalled();
        });
    
        it('should return error if employee is not found', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                    user: {
                        user_metadata: { staff_id: 123 },
                    },
                },
            });
    
            // Mock employee query response with no data
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValueOnce({
                    eq: jest.fn().mockReturnValueOnce({
                        single: jest.fn().mockResolvedValueOnce({
                            data: null,
                            error: { message: "Employee not found" },
                        }),
                    }),
                }),
            });
            
            const request = mockRequest();
            const handler = jest.fn();
            const middleware = checkRolePermission(handler);
            const response = await middleware(request);

            expect(response.status).toBe(404);
            expect(handler).not.toHaveBeenCalled();

        });
    });
    
});
