// Configuration management for TrustCareConnect Frontend
class ConfigManager {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.loadConfig();
    }

    detectEnvironment() {
        const hostname = window.location.hostname;

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('staging') || hostname.includes('test')) {
            return 'staging';
        } else {
            return 'production';
        }
    }

    loadConfig() {
        const baseConfig = {
            // Environment info
            environment: this.environment,

            // IC Agent configuration
            agent: {
                cdnUrl: 'https://unpkg.com/@dfinity/agent@0.20.2/lib/cjs/index.js'
            },

            // UI configuration
            ui: {
                connectionStatusTimeout: 3000,
                loadingSimulationDelay: 2000,
                retryDelay: 1000,
                maxRetries: 3
            },

            // Test patients configuration
            patients: {
                'P001': {
                    name: 'Sarah Michelle Johnson',
                    description: 'Type 2 Diabetes, 45y'
                },
                'P002': {
                    name: 'Michael David Rodriguez',
                    description: 'Type 1 Diabetes, 19y'
                }
            }
        };

        // Environment-specific configurations
        const environmentConfigs = {
            development: {
                backend: {
                    canisterId: 'uxrrr-q7777-77774-qaaaq-cai',
                    host: 'http://localhost:4943',
                    isLocal: true,
                    fetchRootKey: true
                },
                logging: {
                    level: 'debug',
                    enableConsole: true,
                    enableRemote: false
                }
            },
            staging: {
                backend: {
                    canisterId: process.env.STAGING_BACKEND_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai',
                    host: 'https://testnet.dfinity.network',
                    isLocal: false,
                    fetchRootKey: false
                },
                logging: {
                    level: 'warn',
                    enableConsole: true,
                    enableRemote: true
                }
            },
            production: {
                backend: {
                    canisterId: process.env.PRODUCTION_BACKEND_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai',
                    host: 'https://ic0.app',
                    isLocal: false,
                    fetchRootKey: false
                },
                logging: {
                    level: 'error',
                    enableConsole: false,
                    enableRemote: true
                }
            }
        };

        // Merge base config with environment-specific config
        return {
            ...baseConfig,
            ...environmentConfigs[this.environment]
        };
    }

    get(path) {
        return this.getNestedValue(this.config, path);
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => current[key], this.config);
        target[lastKey] = value;
    }

    // Get full configuration object
    getAll() {
        return { ...this.config };
    }

    // Check if we're in development
    isDevelopment() {
        return this.environment === 'development';
    }

    // Check if we're in production
    isProduction() {
        return this.environment === 'production';
    }

    // Get backend configuration
    getBackendConfig() {
        return this.config.backend;
    }

    // Get logging configuration
    getLoggingConfig() {
        return this.config.logging;
    }

    // Get UI configuration
    getUIConfig() {
        return this.config.ui;
    }

    // Override configuration for testing
    override(overrides) {
        this.config = { ...this.config, ...overrides };
    }
}

// Create singleton instance
export const Config = new ConfigManager();

// For backward compatibility, also export direct access
export default Config;