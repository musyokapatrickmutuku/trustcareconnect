import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { Login } from '../../components/Login';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { DoctorDashboard } from '../../components/DoctorDashboard';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN,
};
global.WebSocket = jest.fn(() => mockWebSocket) as any;

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Login Flow', () => {
    it('successfully authenticates doctor user', async () => {
      const mockAuthResponse = {
        token: 'mock-jwt-token',
        user: {
          id: 'doc-123',
          email: 'doctor@hospital.com',
          role: 'doctor',
          name: 'Dr. Smith',
          department: 'Cardiology',
          licenseNumber: 'MD12345'
        },
        permissions: ['view_patients', 'create_queries', 'manage_appointments']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAuthResponse)
      });

      renderWithProviders(<Login />);

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'doctor@hospital.com' } });
      fireEvent.change(passwordInput, { target: { value: 'securePassword123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'doctor@hospital.com',
            password: 'securePassword123'
          })
        });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'authToken',
        'mock-jwt-token'
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'userInfo',
        JSON.stringify(mockAuthResponse.user)
      );
    });

    it('handles login failure with invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        })
      });

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@email.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('handles network error during login', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'doctor@hospital.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Patient Login Flow', () => {
    it('successfully authenticates patient user', async () => {
      const mockPatientResponse = {
        token: 'patient-jwt-token',
        user: {
          id: 'patient-456',
          email: 'patient@email.com',
          role: 'patient',
          name: 'John Doe',
          dateOfBirth: '1985-03-15',
          medicalRecordNumber: 'MRN789'
        },
        permissions: ['view_own_data', 'book_appointments']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockPatientResponse)
      });

      renderWithProviders(<Login />);

      // Switch to patient login
      const patientTab = screen.getByText(/patient login/i);
      fireEvent.click(patientTab);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const mrnInput = screen.getByLabelText(/medical record number/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'patient@email.com' } });
      fireEvent.change(passwordInput, { target: { value: 'patientPass123' } });
      fireEvent.change(mrnInput, { target: { value: 'MRN789' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/patient-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'patient@email.com',
            password: 'patientPass123',
            medicalRecordNumber: 'MRN789'
          })
        });
      });
    });
  });

  describe('Token Validation and Refresh', () => {
    it('validates existing token on app startup', async () => {
      const mockValidToken = 'valid-jwt-token';
      const mockUserData = {
        id: 'doc-123',
        email: 'doctor@hospital.com',
        role: 'doctor',
        name: 'Dr. Smith'
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return mockValidToken;
        if (key === 'userInfo') return JSON.stringify(mockUserData);
        return null;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ valid: true, user: mockUserData })
      });

      renderWithProviders(<DoctorDashboard />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/validate', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockValidToken}`,
            'Content-Type': 'application/json'
          }
        });
      });
    });

    it('refreshes expired token automatically', async () => {
      const expiredToken = 'expired-jwt-token';
      const newToken = 'refreshed-jwt-token';

      mockLocalStorage.getItem.mockReturnValue(expiredToken);

      // First call fails with 401 (expired)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Token expired' })
        })
        // Second call succeeds with new token
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ 
            token: newToken,
            user: { id: 'doc-123', role: 'doctor' }
          })
        });

      renderWithProviders(<DoctorDashboard />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${expiredToken}`,
            'Content-Type': 'application/json'
          }
        });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', newToken);
    });
  });

  describe('Protected Route Access', () => {
    it('redirects unauthenticated users to login', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      renderWithProviders(
        <ProtectedRoute requiredRole="doctor">
          <DoctorDashboard />
        </ProtectedRoute>
      );

      expect(screen.getByText(/please log in/i)).toBeInTheDocument();
    });

    it('allows access to users with correct role', async () => {
      const mockUserData = {
        id: 'doc-123',
        role: 'doctor',
        permissions: ['view_patients']
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'valid-token';
        if (key === 'userInfo') return JSON.stringify(mockUserData);
        return null;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ valid: true })
      });

      renderWithProviders(
        <ProtectedRoute requiredRole="doctor">
          <DoctorDashboard />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText(/doctor dashboard/i)).toBeInTheDocument();
      });
    });

    it('denies access to users with incorrect role', async () => {
      const mockUserData = {
        id: 'patient-123',
        role: 'patient',
        permissions: ['view_own_data']
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'valid-token';
        if (key === 'userInfo') return JSON.stringify(mockUserData);
        return null;
      });

      renderWithProviders(
        <ProtectedRoute requiredRole="doctor">
          <DoctorDashboard />
        </ProtectedRoute>
      );

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });
  });

  describe('Logout Flow', () => {
    it('successfully logs out user and clears session', async () => {
      const mockToken = 'valid-jwt-token';
      mockLocalStorage.getItem.mockReturnValue(mockToken);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'Logged out successfully' })
      });

      renderWithProviders(<DoctorDashboard />);

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        });
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userInfo');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sessionData');
    });
  });

  describe('Multi-Factor Authentication', () => {
    it('handles MFA challenge for doctor login', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 202,
          json: () => Promise.resolve({
            mfaRequired: true,
            challengeId: 'mfa-challenge-123',
            method: 'totp'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            token: 'mfa-verified-token',
            user: { id: 'doc-123', role: 'doctor' }
          })
        });

      renderWithProviders(<Login />);

      // Initial login
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'doctor@hospital.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // MFA challenge appears
      await waitFor(() => {
        expect(screen.getByText(/enter verification code/i)).toBeInTheDocument();
      });

      // Enter MFA code
      const mfaInput = screen.getByLabelText(/verification code/i);
      const verifyButton = screen.getByRole('button', { name: /verify/i });

      fireEvent.change(mfaInput, { target: { value: '123456' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/mfa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeId: 'mfa-challenge-123',
            code: '123456'
          })
        });
      });
    });
  });

  describe('Session Management', () => {
    it('handles session timeout', async () => {
      jest.useFakeTimers();
      
      const mockToken = 'valid-jwt-token';
      mockLocalStorage.getItem.mockReturnValue(mockToken);

      renderWithProviders(<DoctorDashboard />);

      // Simulate session timeout (30 minutes)
      jest.advanceTimersByTime(30 * 60 * 1000);

      await waitFor(() => {
        expect(screen.getByText(/session expired/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('extends session on user activity', async () => {
      jest.useFakeTimers();

      const mockToken = 'valid-jwt-token';
      mockLocalStorage.getItem.mockReturnValue(mockToken);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ sessionExtended: true })
      });

      renderWithProviders(<DoctorDashboard />);

      // Simulate user activity
      fireEvent.click(screen.getByText(/patients/i));

      jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/extend-session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        });
      });

      jest.useRealTimers();
    });
  });
});