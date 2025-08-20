// Enhanced API Service Layer for Internet Computer Protocol (ICP)
// HttpAgent setup with comprehensive error handling and connection management

import { HttpAgent, Actor } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { idlFactory } from '../declarations/backend';

/**
 * Enhanced ICP API Service with comprehensive connection management
 * Provides a robust foundation for communicating with Motoko backend canisters
 */
class ICPApiService {
  constructor() {
    this.agent = null;
    this.authClient = null;
    this.isInitialized = false;
    this.connectionStatus = 'disconnected';
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // Environment configuration
    this.config = {
      host: process.env.REACT_APP_IC_HOST || 'http://localhost:4943',
      canisterId: process.env.REACT_APP_BACKEND_CANISTER_ID || process.env.REACT_APP_CANISTER_ID,
      network: process.env.REACT_APP_NETWORK || 'local',
      isDevelopment: process.env.NODE_ENV === 'development',
      debugMode: process.env.REACT_APP_DEBUG_MODE === 'true'
    };

    this.log('ICP API Service initialized with config:', this.config);
    
    // Auto-initialize on construction
    this.initialize();
  }

  /**
   * Enhanced logging with debug mode support
   */
  log(message, data = null) {
    if (this.config.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ICPApiService: ${message}`, data || '');
    }
  }

  /**
   * Initialize the HTTP Agent with proper configuration
   */
  async initialize() {
    try {
      this.log('Initializing ICP Agent...');
      this.connectionStatus = 'connecting';

      // Create HTTP agent with environment-specific configuration
      this.agent = new HttpAgent({
        host: this.config.host,
        // Additional options for production
        ...(!this.config.isDevelopment && {
          // Production-specific options
          verifyQuerySignatures: true,
        })
      });

      // Fetch root key for local development (required for local replica)
      if (this.config.isDevelopment) {
        this.log('Development mode: Fetching root key...');
        await this.agent.fetchRootKey();
      }

      // Initialize auth client for potential Internet Identity integration
      this.authClient = await AuthClient.create({
        idleOptions: {
          disableIdle: this.config.isDevelopment,
          disableDefaultIdleCallback: this.config.isDevelopment
        }
      });

      this.isInitialized = true;
      this.connectionStatus = 'connected';
      this.retryCount = 0;

      this.log('ICP Agent initialized successfully');
      
      return true;
    } catch (error) {
      this.connectionStatus = 'error';
      this.log('Failed to initialize ICP Agent:', error);
      
      // Retry logic for connection failures
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.log(`Retrying initialization... (${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.initialize(), 2000 * this.retryCount);
      }
      
      throw new Error(`ICP Agent initialization failed: ${error.message}`);
    }
  }

  /**
   * Create an actor for the backend canister with error handling
   */
  async createBackendActor() {
    try {
      await this.ensureConnection();

      if (!this.config.canisterId) {
        throw new Error('Backend canister ID not configured. Please set REACT_APP_BACKEND_CANISTER_ID in .env.local');
      }

      const actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: this.config.canisterId,
      });

      this.log(`Backend actor created for canister: ${this.config.canisterId}`);
      return actor;
    } catch (error) {
      this.log('Failed to create backend actor:', error);
      throw new Error(`Backend actor creation failed: ${error.message}`);
    }
  }

  /**
   * Ensure the connection is established before making calls
   */
  async ensureConnection() {
    if (!this.isInitialized || this.connectionStatus !== 'connected') {
      this.log('Connection not established, reinitializing...');
      await this.initialize();
    }

    if (!this.agent) {
      throw new Error('ICP Agent not available. Connection failed.');
    }

    return true;
  }

  /**
   * Generic method caller with comprehensive error handling
   */
  async callCanisterMethod(methodName, args = [], options = {}) {
    const { retries = 1, timeout = 30000 } = options;
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.log(`Calling canister method: ${methodName} (attempt ${attempt}/${retries})`);
        
        const actor = await this.createBackendActor();
        
        // Set up timeout for the call
        const callPromise = actor[methodName](...args);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        });

        const result = await Promise.race([callPromise, timeoutPromise]);
        
        this.log(`Method ${methodName} completed successfully`);
        return result;
      } catch (error) {
        lastError = error;
        this.log(`Method ${methodName} failed on attempt ${attempt}:`, error.message);
        
        if (attempt < retries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // All attempts failed
    throw new Error(`Method ${methodName} failed after ${retries} attempts: ${lastError.message}`);
  }

  /**
   * Connection health check
   */
  async healthCheck() {
    try {
      await this.ensureConnection();
      const result = await this.callCanisterMethod('healthCheck');
      this.log('Health check passed');
      return { success: true, status: result };
    } catch (error) {
      this.log('Health check failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get connection status information
   */
  getConnectionInfo() {
    return {
      status: this.connectionStatus,
      isInitialized: this.isInitialized,
      host: this.config.host,
      canisterId: this.config.canisterId,
      network: this.config.network,
      retryCount: this.retryCount
    };
  }

  /**
   * Authentication methods (for future Internet Identity integration)
   */
  async login() {
    if (!this.authClient) {
      throw new Error('Auth client not initialized');
    }

    return new Promise((resolve, reject) => {
      this.authClient.login({
        identityProvider: process.env.REACT_APP_II_URL || 'https://identity.ic0.app',
        onSuccess: () => {
          this.log('Login successful');
          resolve(true);
        },
        onError: (error) => {
          this.log('Login failed:', error);
          reject(error);
        }
      });
    });
  }

  async logout() {
    if (this.authClient) {
      await this.authClient.logout();
      this.log('Logout successful');
    }
  }

  async isAuthenticated() {
    return this.authClient ? await this.authClient.isAuthenticated() : false;
  }

  async getIdentity() {
    return this.authClient ? this.authClient.getIdentity() : null;
  }

  /**
   * Utility method for handling Result types from Motoko
   */
  handleMotokoResult(result, operation = 'operation') {
    if (typeof result === 'object' && result !== null) {
      if ('ok' in result) {
        this.log(`${operation} succeeded`);
        return { success: true, data: result.ok };
      } else if ('err' in result) {
        this.log(`${operation} failed:`, result.err);
        return { success: false, error: result.err };
      }
    }
    
    // For non-Result types, assume success
    return { success: true, data: result };
  }

  /**
   * Utility method for handling Option types from Motoko
   */
  handleMotokoOption(option, operation = 'operation') {
    if (Array.isArray(option)) {
      if (option.length > 0) {
        this.log(`${operation} returned data`);
        return { success: true, data: option[0] };
      } else {
        this.log(`${operation} returned no data`);
        return { success: true, data: null };
      }
    }
    
    // For non-Option types, return as-is
    return { success: true, data: option };
  }
}

// Export singleton instance
const icpApiService = new ICPApiService();
export default icpApiService;