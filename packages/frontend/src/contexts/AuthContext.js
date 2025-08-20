/**
 * Authentication Context
 * Manages user authentication state and roles across the application
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import internetIdentityAuth from '../auth/InternetIdentity';
import trustCareAPI from '../api/trustcare';

// Authentication states
const AUTH_STATES = {
  CHECKING: 'checking',
  UNAUTHENTICATED: 'unauthenticated',
  AUTHENTICATED: 'authenticated',
  ERROR: 'error'
};

// User roles
const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin'
};

// Initial state
const initialState = {
  authState: AUTH_STATES.CHECKING,
  user: null,
  userRole: null,
  userProfile: null,
  principal: null,
  isLoading: false,
  error: null
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_UNAUTHENTICATED: 'SET_UNAUTHENTICATED',
  SET_ERROR: 'SET_ERROR',
  SET_USER_PROFILE: 'SET_USER_PROFILE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER_PROFILE: 'UPDATE_USER_PROFILE'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null
      };

    case actionTypes.SET_AUTHENTICATED:
      return {
        ...state,
        authState: AUTH_STATES.AUTHENTICATED,
        user: action.payload.user,
        userRole: action.payload.userRole,
        userProfile: action.payload.userProfile,
        principal: action.payload.principal,
        isLoading: false,
        error: null
      };

    case actionTypes.SET_UNAUTHENTICATED:
      return {
        ...initialState,
        authState: AUTH_STATES.UNAUTHENTICATED,
        isLoading: false
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        authState: AUTH_STATES.ERROR,
        error: action.payload,
        isLoading: false
      };

    case actionTypes.SET_USER_PROFILE:
      return {
        ...state,
        userProfile: action.payload,
        isLoading: false
      };

    case actionTypes.UPDATE_USER_PROFILE:
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          ...action.payload
        }
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check current authentication status
   */
  const checkAuthStatus = useCallback(async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      await internetIdentityAuth.init();
      const isAuthenticated = await internetIdentityAuth.isAuthenticated();
      
      if (isAuthenticated) {
        const principal = internetIdentityAuth.getPrincipal();
        if (principal) {
          await loadUserProfile(principal);
        } else {
          dispatch({ type: actionTypes.SET_UNAUTHENTICATED });
        }
      } else {
        dispatch({ type: actionTypes.SET_UNAUTHENTICATED });
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      dispatch({ 
        type: actionTypes.SET_ERROR, 
        payload: `Authentication check failed: ${error.message}` 
      });
    }
  }, []);

  /**
   * Load user profile and determine role
   */
  const loadUserProfile = useCallback(async (principal) => {
    try {
      // First, try to get user as a patient
      const patientResult = await trustCareAPI.getPatient(principal);
      
      if (patientResult.success && patientResult.data) {
        dispatch({
          type: actionTypes.SET_AUTHENTICATED,
          payload: {
            user: patientResult.data,
            userRole: USER_ROLES.PATIENT,
            userProfile: patientResult.data,
            principal
          }
        });
        return;
      }

      // If not a patient, try to get user as a doctor
      const doctorResult = await trustCareAPI.getDoctor(principal);
      
      if (doctorResult.success && doctorResult.data) {
        dispatch({
          type: actionTypes.SET_AUTHENTICATED,
          payload: {
            user: doctorResult.data,
            userRole: USER_ROLES.DOCTOR,
            userProfile: doctorResult.data,
            principal
          }
        });
        return;
      }

      // If neither patient nor doctor, user might need to register
      dispatch({
        type: actionTypes.SET_AUTHENTICATED,
        payload: {
          user: { id: principal, name: 'Unregistered User' },
          userRole: null, // No role assigned yet
          userProfile: null,
          principal
        }
      });
      
    } catch (error) {
      console.error('Failed to load user profile:', error);
      dispatch({ 
        type: actionTypes.SET_ERROR, 
        payload: `Failed to load user profile: ${error.message}` 
      });
    }
  }, []);

  /**
   * Login with Internet Identity
   */
  const login = useCallback(async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      const success = await internetIdentityAuth.login();
      
      if (success) {
        const principal = internetIdentityAuth.getPrincipal();
        if (principal) {
          await loadUserProfile(principal);
        } else {
          throw new Error('Failed to get principal after login');
        }
      } else {
        throw new Error('Login was not successful');
      }
    } catch (error) {
      console.error('Login failed:', error);
      dispatch({ 
        type: actionTypes.SET_ERROR, 
        payload: `Login failed: ${error.message}` 
      });
    }
  }, [loadUserProfile]);

  /**
   * Logout current user
   */
  const logout = useCallback(async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      await internetIdentityAuth.logout();
      dispatch({ type: actionTypes.SET_UNAUTHENTICATED });
    } catch (error) {
      console.error('Logout failed:', error);
      dispatch({ 
        type: actionTypes.SET_ERROR, 
        payload: `Logout failed: ${error.message}` 
      });
    }
  }, []);

  /**
   * Register new user with role
   */
  const registerUser = useCallback(async (userData, role) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      let result;
      
      if (role === USER_ROLES.PATIENT) {
        result = await trustCareAPI.registerPatient({
          id: state.principal,
          ...userData
        });
      } else if (role === USER_ROLES.DOCTOR) {
        result = await trustCareAPI.registerDoctor({
          id: state.principal,
          ...userData
        });
      } else {
        throw new Error('Invalid user role');
      }
      
      if (result.success) {
        // Reload user profile after registration
        await loadUserProfile(state.principal);
        return { success: true };
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('User registration failed:', error);
      dispatch({ 
        type: actionTypes.SET_ERROR, 
        payload: `Registration failed: ${error.message}` 
      });
      return { success: false, error: error.message };
    }
  }, [state.principal, loadUserProfile]);

  /**
   * Update user profile
   */
  const updateUserProfile = useCallback(async (updates) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      let result;
      
      if (state.userRole === USER_ROLES.PATIENT) {
        result = await trustCareAPI.updatePatient(state.principal, updates);
      } else if (state.userRole === USER_ROLES.DOCTOR) {
        result = await trustCareAPI.updateDoctor(state.principal, updates);
      } else {
        throw new Error('Cannot update profile: invalid user role');
      }
      
      if (result.success) {
        dispatch({ 
          type: actionTypes.UPDATE_USER_PROFILE, 
          payload: updates 
        });
        return { success: true };
      } else {
        throw new Error(result.error || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      dispatch({ 
        type: actionTypes.SET_ERROR, 
        payload: `Profile update failed: ${error.message}` 
      });
      return { success: false, error: error.message };
    }
  }, [state.userRole, state.principal]);

  /**
   * Refresh authentication state
   */
  const refreshAuth = useCallback(async () => {
    const isValid = await internetIdentityAuth.refresh();
    if (!isValid) {
      dispatch({ type: actionTypes.SET_UNAUTHENTICATED });
      return false;
    }
    
    const principal = internetIdentityAuth.getPrincipal();
    if (principal && principal !== state.principal) {
      await loadUserProfile(principal);
    }
    
    return true;
  }, [state.principal, loadUserProfile]);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  }, []);

  // Helper functions
  const isAuthenticated = state.authState === AUTH_STATES.AUTHENTICATED;
  const isPatient = state.userRole === USER_ROLES.PATIENT;
  const isDoctor = state.userRole === USER_ROLES.DOCTOR;
  const isAdmin = state.userRole === USER_ROLES.ADMIN;
  const hasRole = state.userRole !== null;
  const needsRegistration = isAuthenticated && !hasRole;

  const contextValue = {
    // State
    ...state,
    
    // Status helpers
    isAuthenticated,
    isPatient,
    isDoctor,
    isAdmin,
    hasRole,
    needsRegistration,
    
    // Actions
    login,
    logout,
    registerUser,
    updateUserProfile,
    refreshAuth,
    clearError,
    checkAuthStatus,
    
    // Constants
    AUTH_STATES,
    USER_ROLES
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;