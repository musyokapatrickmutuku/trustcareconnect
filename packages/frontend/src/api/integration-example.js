// TrustCareConnect API Integration Examples
// Demonstrates how to use the new API layer in React components

import trustCareAPI from './trustcare.js';

/**
 * Example integration patterns for React components
 * These examples show best practices for using the TrustCareConnect API
 */

// =======================
// PATIENT WORKFLOW EXAMPLES
// =======================

/**
 * Example: Patient Registration Component Integration
 */
export const patientRegistrationExample = {
  // Component state management
  state: {
    name: '',
    condition: '',
    email: '',
    loading: false,
    error: null
  },

  // Registration handler
  async handleRegistration(formData) {
    this.setState({ loading: true, error: null });
    
    try {
      const result = await trustCareAPI.registerPatient(
        formData.name,
        formData.condition,
        formData.email
      );
      
      if (result.success) {
        console.log('Patient registered successfully:', result.data);
        // Handle success - redirect or show success message
        return { success: true, patientId: result.data };
      } else {
        // Handle API error
        this.setState({ error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      // Handle network/connection error
      this.setState({ error: 'Connection error. Please try again.' });
      return { success: false, error: error.message };
    } finally {
      this.setState({ loading: false });
    }
  }
};

/**
 * Example: Patient Login Component Integration
 */
export const patientLoginExample = {
  async handleLogin(email) {
    try {
      const result = await trustCareAPI.findPatientByEmail(email);
      
      if (result.success && result.data) {
        // Patient found - set as current user
        localStorage.setItem('currentPatient', JSON.stringify(result.data));
        return { success: true, patient: result.data };
      } else if (result.success && !result.data) {
        // Patient not found
        return { success: false, error: 'Patient not found. Please register first.' };
      } else {
        // API error
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Connection error. Please try again.' };
    }
  }
};

/**
 * Example: Query Submission Component Integration
 */
export const querySubmissionExample = {
  async submitQuery(patientId, title, description) {
    try {
      // Show loading state
      this.setState({ submitting: true });
      
      const result = await trustCareAPI.submitQuery(patientId, title, description);
      
      if (result.success) {
        console.log('Query submitted successfully:', result.data);
        // Clear form and show success message
        this.setState({ 
          title: '', 
          description: '', 
          successMessage: 'Query submitted successfully! You will receive a response from a doctor soon.' 
        });
        return result.data; // Query ID
      } else {
        this.setState({ error: result.error });
        return null;
      }
    } catch (error) {
      this.setState({ error: 'Failed to submit query. Please try again.' });
      return null;
    } finally {
      this.setState({ submitting: false });
    }
  }
};

// =======================
// DOCTOR WORKFLOW EXAMPLES
// =======================

/**
 * Example: Doctor Dashboard Component Integration
 */
export const doctorDashboardExample = {
  async loadDashboardData(doctorId) {
    try {
      this.setState({ loading: true });
      
      // Use batch operation for efficient data loading
      const result = await trustCareAPI.getDoctorDashboardData(doctorId);
      
      if (result.success) {
        this.setState({
          doctor: result.data.doctor?.data,
          patients: result.data.patients?.data || [],
          queries: result.data.queries?.data || [],
          pendingQueries: result.data.pendingQueries?.data || [],
          stats: result.data.stats?.data
        });
        
        // Log any partial errors
        if (result.errors.length > 0) {
          console.warn('Some dashboard data failed to load:', result.errors);
        }
      } else {
        this.setState({ error: result.error });
      }
    } catch (error) {
      this.setState({ error: 'Failed to load dashboard data.' });
    } finally {
      this.setState({ loading: false });
    }
  }
};

/**
 * Example: Query Management Component Integration
 */
export const queryManagementExample = {
  async takeQuery(queryId, doctorId) {
    try {
      const result = await trustCareAPI.takeQuery(queryId, doctorId);
      
      if (result.success) {
        // Update local state to reflect query ownership
        this.updateQueryStatus(queryId, 'doctor_review');
        return true;
      } else {
        alert(`Failed to take query: ${result.error}`);
        return false;
      }
    } catch (error) {
      alert('Connection error. Please try again.');
      return false;
    }
  },

  async respondToQuery(queryId, doctorId, response) {
    try {
      const result = await trustCareAPI.respondToQuery(queryId, doctorId, response);
      
      if (result.success) {
        // Update local state to reflect completion
        this.updateQueryStatus(queryId, 'completed');
        this.setState({ responseText: '', showResponseForm: false });
        return true;
      } else {
        alert(`Failed to submit response: ${result.error}`);
        return false;
      }
    } catch (error) {
      alert('Connection error. Please try again.');
      return false;
    }
  }
};

// =======================
// UTILITY EXAMPLES
// =======================

/**
 * Example: Connection Testing and Error Handling
 */
export const connectionTestingExample = {
  async testBackendConnection() {
    try {
      const result = await trustCareAPI.testConnection();
      
      if (result.success) {
        console.log('Backend connection test passed:', result.data);
        return true;
      } else {
        console.error('Backend connection test failed:', result.error);
        // Show user-friendly error message
        this.setState({ 
          connectionError: 'Unable to connect to the backend service. Please check your internet connection.' 
        });
        return false;
      }
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  },

  async handleReconnection() {
    try {
      const result = await trustCareAPI.reconnect();
      
      if (result.success) {
        console.log('Reconnection successful');
        this.setState({ connectionError: null });
        // Retry the failed operation
      } else {
        console.error('Reconnection failed:', result.error);
      }
    } catch (error) {
      console.error('Reconnection error:', error);
    }
  }
};

// =======================
// REACT HOOK EXAMPLES
// =======================

/**
 * Example: Custom React Hook for API Integration
 */
export const useAPIHookExample = `
import { useState, useEffect } from 'react';
import trustCareAPI from '../api/trustcare';

// Custom hook for patient data
export function usePatient(patientId) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPatient() {
      try {
        setLoading(true);
        const result = await trustCareAPI.getPatient(patientId);
        
        if (result.success) {
          setPatient(result.data);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    }

    if (patientId) {
      loadPatient();
    }
  }, [patientId]);

  return { patient, loading, error };
}

// Custom hook for system health monitoring
export function useSystemHealth() {
  const [health, setHealth] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const checkHealth = async () => {
    const result = await trustCareAPI.healthCheck();
    setHealth(result);
    setLastCheck(new Date());
    return result;
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return { health, lastCheck, checkHealth };
}
`;

// =======================
// ERROR HANDLING PATTERNS
// =======================

/**
 * Comprehensive error handling patterns
 */
export const errorHandlingPatterns = {
  // Network error handling
  handleNetworkError: (error) => {
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    } else if (error.message.includes('network')) {
      return 'Network error. Please check your internet connection.';
    } else {
      return 'Connection error. Please try again later.';
    }
  },

  // API error handling
  handleAPIError: (result) => {
    if (!result.success) {
      // Map backend errors to user-friendly messages
      const errorMap = {
        'Patient not found': 'We couldn\'t find your patient record. Please check your information.',
        'Doctor not found': 'Doctor not found in the system.',
        'Patient must be assigned to a doctor first': 'You need to be assigned to a doctor before submitting queries.',
        'Query is not pending': 'This query has already been reviewed.',
        'This query is not assigned to you': 'You don\'t have permission to respond to this query.'
      };

      return errorMap[result.error] || result.error;
    }
    return null;
  },

  // Retry logic for failed operations
  withRetry: async (operation, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
};

export default {
  patientRegistrationExample,
  patientLoginExample,
  querySubmissionExample,
  doctorDashboardExample,
  queryManagementExample,
  connectionTestingExample,
  useAPIHookExample,
  errorHandlingPatterns
};