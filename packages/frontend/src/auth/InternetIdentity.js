/**
 * Internet Identity Authentication Service
 * Handles login/logout operations using @dfinity/auth-client
 */

import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';

class InternetIdentityAuth {
  constructor() {
    this.authClient = null;
    this.identity = null;
    this.agent = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the authentication client
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      this.authClient = await AuthClient.create({
        idleOptions: {
          disableIdle: false,
          disableDefaultIdleCallback: true,
          idleTimeout: 1000 * 60 * 30, // 30 minutes
          onIdle: () => {
            console.log('User session idle, logging out...');
            this.logout();
          }
        }
      });
      
      this.identity = this.authClient.getIdentity();
      this.isInitialized = true;
      
      // Set up the HTTP agent with the current identity
      await this.setupAgent();
      
      console.log('Internet Identity auth client initialized');
    } catch (error) {
      console.error('Failed to initialize Internet Identity auth:', error);
      throw error;
    }
  }

  /**
   * Set up HTTP agent with current identity
   */
  async setupAgent() {
    const host = process.env.REACT_APP_IC_HOST || 'https://ic0.app';
    
    this.agent = new HttpAgent({
      host,
      identity: this.identity
    });

    // Fetch root key for local development
    if (process.env.NODE_ENV === 'development' && host.includes('localhost')) {
      try {
        await this.agent.fetchRootKey();
        console.log('Root key fetched for local development');
      } catch (error) {
        console.warn('Failed to fetch root key:', error);
      }
    }
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated() {
    if (!this.isInitialized) {
      await this.init();
    }
    
    return await this.authClient.isAuthenticated();
  }

  /**
   * Get current user's principal ID
   */
  getPrincipal() {
    if (!this.identity) {
      return null;
    }
    
    const principal = this.identity.getPrincipal();
    return principal.isAnonymous() ? null : principal.toString();
  }

  /**
   * Login with Internet Identity
   * @param {string} identityProvider - Optional custom identity provider URL
   * @returns {Promise<boolean>} Success status
   */
  async login(identityProvider = null) {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      const isAuthenticated = await this.authClient.isAuthenticated();
      if (isAuthenticated) {
        console.log('User already authenticated');
        return true;
      }

      const loginOptions = {
        onSuccess: () => {
          console.log('Internet Identity login successful');
        },
        onError: (error) => {
          console.error('Internet Identity login failed:', error);
          throw error;
        },
        // Use custom identity provider if specified
        ...(identityProvider && { identityProvider })
      };

      // Use Internet Identity provider based on network
      if (process.env.REACT_APP_NETWORK === 'local') {
        // Local development with local Internet Identity
        const localII = process.env.REACT_APP_LOCAL_II_URL || 'http://localhost:4943/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai';
        loginOptions.identityProvider = localII;
      } else {
        // Production/IC mainnet
        const iiProvider = process.env.REACT_APP_II_URL || 'https://identity.ic0.app';
        loginOptions.identityProvider = iiProvider;
      }

      await new Promise((resolve, reject) => {
        this.authClient.login({
          ...loginOptions,
          onSuccess: async () => {
            // Update identity and agent after successful login
            this.identity = this.authClient.getIdentity();
            await this.setupAgent();
            resolve();
          },
          onError: reject
        });
      });

      return await this.authClient.isAuthenticated();
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Logout current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      await this.authClient.logout();
      
      // Reset identity and agent
      this.identity = this.authClient.getIdentity();
      await this.setupAgent();
      
      console.log('User logged out successfully');
      
      // Trigger a page reload to clear any cached state
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Get the current HTTP agent
   * @returns {HttpAgent} The configured HTTP agent
   */
  getAgent() {
    return this.agent;
  }

  /**
   * Get the current identity
   * @returns {Identity} The current identity
   */
  getIdentity() {
    return this.identity;
  }

  /**
   * Get user information
   * @returns {Object} User information
   */
  getUserInfo() {
    if (!this.identity || this.identity.getPrincipal().isAnonymous()) {
      return null;
    }

    const principal = this.identity.getPrincipal();
    return {
      principal: principal.toString(),
      isAuthenticated: true,
      isAnonymous: false
    };
  }

  /**
   * Check if the current session is valid
   * @returns {Promise<boolean>}
   */
  async validateSession() {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      const isAuth = await this.authClient.isAuthenticated();
      if (!isAuth) {
        return false;
      }

      // Additional validation could be added here
      // such as checking if the identity is still valid
      const userInfo = this.getUserInfo();
      return userInfo !== null;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Refresh the authentication state
   * Useful for checking if session is still valid
   */
  async refresh() {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      // Check if still authenticated
      const isAuth = await this.authClient.isAuthenticated();
      if (isAuth) {
        // Update identity in case it changed
        this.identity = this.authClient.getIdentity();
        await this.setupAgent();
        return true;
      } else {
        // Session expired, clean up
        this.identity = this.authClient.getIdentity();
        await this.setupAgent();
        return false;
      }
    } catch (error) {
      console.error('Failed to refresh authentication:', error);
      return false;
    }
  }
}

// Export singleton instance
const internetIdentityAuth = new InternetIdentityAuth();

export default internetIdentityAuth;

// Named exports for convenience
export {
  internetIdentityAuth as auth,
  InternetIdentityAuth
};