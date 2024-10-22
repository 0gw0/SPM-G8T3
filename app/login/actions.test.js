
import { login } from './actions';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock next/navigation with error throwing redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn().mockImplementation((path) => {
    throw new Error(`Redirecting to ${path}`);
  }),
}));

// Mock supabase server
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Authentication Actions', () => {
  let mockSupabaseClient;
  let mockFormData;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock FormData
    mockFormData = {
      get: jest.fn(),
    };

    // Mock Supabase client
    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn(),
      },
    };

    // Set up createClient mock
    createClient.mockReturnValue(mockSupabaseClient);
  });

  describe('login', () => {
    // Test case 1: Successful login
    it('should successfully log in a user and redirect to home', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      
      mockFormData.get
        .mockReturnValueOnce(email)
        .mockReturnValueOnce(password);

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({ 
        error: null,
        data: { user: { id: '123' } }
      });

      // Act & Assert
      await expect(login(mockFormData)).rejects.toThrow('Redirecting to /');

      // Verify all mock calls
      expect(mockFormData.get).toHaveBeenCalledWith('email');
      expect(mockFormData.get).toHaveBeenCalledWith('password');
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
      expect(redirect).toHaveBeenCalledWith('/');
    });

    // Test case 2: Failed login with invalid credentials
    it('should redirect to error page on invalid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const wrongPassword = 'wrongpassword';
      
      mockFormData.get
        .mockReturnValueOnce(email)
        .mockReturnValueOnce(wrongPassword);

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        error: new Error('Invalid login credentials'),
        data: null
      });

      // Act & Assert
      await expect(login(mockFormData)).rejects.toThrow('Redirecting to /error');

      // Verify all mock calls
      expect(mockFormData.get).toHaveBeenCalledWith('email');
      expect(mockFormData.get).toHaveBeenCalledWith('password');
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password: wrongPassword,
      });
      expect(redirect).toHaveBeenCalledWith('/error');
      expect(revalidatePath).not.toHaveBeenCalled();
    });


  });
});