/**
 * TrustCare Connect - Data Caching Utility
 * Provides intelligent caching for frequently accessed medical data with HIPAA considerations
 */

import { Patient, Doctor, MedicalQuery } from '../types';

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items
  encrypt?: boolean; // Whether to encrypt sensitive data
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  encrypted?: boolean;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  cacheSize: number;
  maxSize: number;
}

// Default cache configurations for different data types
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Medical data - shorter TTL for safety
  patients: { ttl: 5 * 60 * 1000, maxSize: 50, encrypt: true },  // 5 minutes
  queries: { ttl: 3 * 60 * 1000, maxSize: 100, encrypt: true },   // 3 minutes
  doctors: { ttl: 10 * 60 * 1000, maxSize: 20, encrypt: true },   // 10 minutes
  
  // System data - longer TTL
  templates: { ttl: 30 * 60 * 1000, maxSize: 50 },               // 30 minutes
  systemStats: { ttl: 2 * 60 * 1000, maxSize: 10 },              // 2 minutes
  notifications: { ttl: 5 * 60 * 1000, maxSize: 50 },            // 5 minutes
  
  // User preferences - longest TTL
  userPreferences: { ttl: 60 * 60 * 1000, maxSize: 10 },         // 1 hour
  settings: { ttl: 60 * 60 * 1000, maxSize: 10 }                 // 1 hour
};

class DataCache {
  private storage: Storage | null;
  private memoryCache: Map<string, CacheItem<any>> = new Map();
  private stats: CacheStats = {
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    cacheSize: 0,
    maxSize: 0
  };

  constructor(useMemoryOnly: boolean = false) {
    // Use memory cache in private/incognito mode or when localStorage is not available
    try {
      this.storage = useMemoryOnly ? null : localStorage;
      if (this.storage) {
        // Test localStorage availability
        this.storage.setItem('__cache_test__', 'test');
        this.storage.removeItem('__cache_test__');
      }
    } catch (error) {
      console.warn('LocalStorage not available, using memory cache only');
      this.storage = null;
    }
    
    // Initialize cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Get data from cache
   */
  get<T>(key: string, cacheType: string = 'default'): T | null {
    this.stats.totalRequests++;
    
    try {
      // Check memory cache first
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem && this.isValidItem(memoryItem)) {
        memoryItem.accessCount++;
        memoryItem.lastAccessed = Date.now();
        this.stats.totalHits++;
        this.updateHitRate();
        return this.decryptData<T>(memoryItem.data, memoryItem.encrypted);
      }

      // Check persistent storage
      if (this.storage) {
        const storageItem = this.storage.getItem(key);
        if (storageItem) {
          const parsedItem: CacheItem<T> = JSON.parse(storageItem);
          
          if (this.isValidItem(parsedItem)) {
            // Move to memory cache for faster access
            parsedItem.accessCount++;
            parsedItem.lastAccessed = Date.now();
            this.memoryCache.set(key, parsedItem);
            
            this.stats.totalHits++;
            this.updateHitRate();
            return this.decryptData<T>(parsedItem.data, parsedItem.encrypted);
          } else {
            // Remove expired item
            this.storage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }

    this.stats.totalMisses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, cacheType: string = 'default'): boolean {
    try {
      const config = CACHE_CONFIGS[cacheType] || CACHE_CONFIGS.default || { ttl: 5 * 60 * 1000, maxSize: 100 };
      const encrypted = config.encrypt && this.isSensitiveData(data);
      
      const cacheItem: CacheItem<T> = {
        data: encrypted ? this.encryptData(data) : data,
        timestamp: Date.now(),
        ttl: config.ttl,
        encrypted,
        accessCount: 1,
        lastAccessed: Date.now()
      };

      // Store in memory cache
      this.memoryCache.set(key, cacheItem);
      
      // Enforce memory cache size limit
      this.enforceMemoryCacheLimit(config.maxSize);

      // Store in persistent storage if available and appropriate
      if (this.storage && this.shouldPersist(cacheType)) {
        try {
          this.storage.setItem(key, JSON.stringify(cacheItem));
        } catch (storageError) {
          // Handle storage quota exceeded
          console.warn('Storage quota exceeded, clearing old cache entries');
          this.clearOldEntries();
          try {
            this.storage.setItem(key, JSON.stringify(cacheItem));
          } catch (retryError) {
            console.error('Failed to store in cache even after cleanup:', retryError);
          }
        }
      }

      this.updateCacheStats();
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Remove item from cache
   */
  remove(key: string): boolean {
    try {
      this.memoryCache.delete(key);
      if (this.storage) {
        this.storage.removeItem(key);
      }
      this.updateCacheStats();
      return true;
    } catch (error) {
      console.error('Cache remove error:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries of a specific type
   */
  clearByType(cacheType: string): void {
    try {
      const prefix = `${cacheType}_`;
      
      // Clear from memory cache
      Array.from(this.memoryCache.keys()).forEach(key => {
        if (key.startsWith(prefix)) {
          this.memoryCache.delete(key);
        }
      });

      // Clear from persistent storage
      if (this.storage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => this.storage!.removeItem(key));
      }

      this.updateCacheStats();
    } catch (error) {
      console.error('Cache clearByType error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    try {
      this.memoryCache.clear();
      
      if (this.storage) {
        // Only clear TrustCare cache entries, not other app data
        const cacheKeys: string[] = [];
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (key && this.isCacheKey(key)) {
            cacheKeys.push(key);
          }
        }
        cacheKeys.forEach(key => this.storage!.removeItem(key));
      }

      this.stats = {
        hitRate: 0,
        missRate: 0,
        totalRequests: 0,
        totalHits: 0,
        totalMisses: 0,
        cacheSize: 0,
        maxSize: 0
      };
    } catch (error) {
      console.error('Cache clearAll error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateCacheStats();
    return { ...this.stats };
  }

  /**
   * Invalidate expired entries
   */
  cleanup(): void {
    const now = Date.now();
    
    // Cleanup memory cache
    Array.from(this.memoryCache.entries()).forEach(([key, item]) => {
      if (!this.isValidItem(item)) {
        this.memoryCache.delete(key);
      }
    });

    // Cleanup persistent storage
    if (this.storage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && this.isCacheKey(key)) {
          try {
            const itemData = this.storage!.getItem(key);
            if (!itemData) continue;
            const item = JSON.parse(itemData);
            if (!this.isValidItem(item)) {
              keysToRemove.push(key);
            }
          } catch (error) {
            // Remove corrupted entries
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => this.storage!.removeItem(key));
    }

    this.updateCacheStats();
  }

  /**
   * Helper methods
   */
  private isValidItem(item: CacheItem<any>): boolean {
    const now = Date.now();
    return (now - item.timestamp) < item.ttl;
  }

  private isSensitiveData(data: any): boolean {
    // Check if data contains sensitive medical information
    if (typeof data !== 'object' || !data) return false;
    
    const sensitiveFields = [
      'patientId', 'doctorId', 'condition', 'diagnosis', 'symptoms',
      'medication', 'treatment', 'response', 'medicalHistory'
    ];
    
    return sensitiveFields.some(field => 
      field in data || JSON.stringify(data).toLowerCase().includes(field.toLowerCase())
    );
  }

  private encryptData(data: any): any {
    // Simple encryption for demo - in production, use proper encryption
    try {
      const jsonString = JSON.stringify(data);
      return btoa(jsonString); // Base64 encoding as simple encryption
    } catch (error) {
      console.warn('Encryption failed, storing unencrypted:', error);
      return data;
    }
  }

  private decryptData<T>(data: any, encrypted?: boolean): T {
    if (!encrypted) return data;
    
    try {
      const jsonString = atob(data);
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Decryption failed, returning raw data:', error);
      return data;
    }
  }

  private shouldPersist(cacheType: string): boolean {
    // Don't persist highly sensitive medical data in localStorage
    const nonPersistentTypes = ['queries', 'patients', 'doctors'];
    return !nonPersistentTypes.includes(cacheType);
  }

  private enforceMemoryCacheLimit(maxSize: number): void {
    if (this.memoryCache.size <= maxSize) return;

    // Remove least recently used items
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const toRemove = entries.slice(0, entries.length - maxSize);
    toRemove.forEach(([key]) => this.memoryCache.delete(key));
  }

  private clearOldEntries(): void {
    if (!this.storage) return;
    
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && this.isCacheKey(key)) {
        try {
          const itemData = this.storage!.getItem(key);
          if (!itemData) continue;
          const item = JSON.parse(itemData);
          // Remove items older than 1 hour
          if (now - item.timestamp > 60 * 60 * 1000) {
            keysToRemove.push(key);
          }
        } catch (error) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => this.storage!.removeItem(key));
  }

  private isCacheKey(key: string): boolean {
    // Check if key belongs to our cache system
    const cacheTypes = Object.keys(CACHE_CONFIGS);
    return cacheTypes.some(type => key.startsWith(`${type}_`));
  }

  private updateHitRate(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = (this.stats.totalHits / this.stats.totalRequests) * 100;
      this.stats.missRate = (this.stats.totalMisses / this.stats.totalRequests) * 100;
    }
  }

  private updateCacheStats(): void {
    this.stats.cacheSize = this.memoryCache.size;
    // Update max size based on current configurations
    this.stats.maxSize = Math.max(...Object.values(CACHE_CONFIGS).map(config => config.maxSize));
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
}

// Create singleton instance
const dataCache = new DataCache();

/**
 * High-level cache operations for specific data types
 */
export const cacheOperations = {
  // Patient operations
  patients: {
    get: (patientId: string): Patient | null => 
      dataCache.get<Patient>(`patients_${patientId}`, 'patients'),
    
    set: (patientId: string, patient: Patient): boolean => 
      dataCache.set(`patients_${patientId}`, patient, 'patients'),
    
    remove: (patientId: string): boolean => 
      dataCache.remove(`patients_${patientId}`),
    
    clear: (): void => 
      dataCache.clearByType('patients')
  },

  // Query operations
  queries: {
    get: (queryId: string): MedicalQuery | null => 
      dataCache.get<MedicalQuery>(`queries_${queryId}`, 'queries'),
    
    set: (queryId: string, query: MedicalQuery): boolean => 
      dataCache.set(`queries_${queryId}`, query, 'queries'),
    
    getList: (patientId: string): MedicalQuery[] | null => 
      dataCache.get<MedicalQuery[]>(`queries_list_${patientId}`, 'queries'),
    
    setList: (patientId: string, queries: MedicalQuery[]): boolean => 
      dataCache.set(`queries_list_${patientId}`, queries, 'queries'),
    
    remove: (queryId: string): boolean => 
      dataCache.remove(`queries_${queryId}`),
    
    clear: (): void => 
      dataCache.clearByType('queries')
  },

  // Doctor operations
  doctors: {
    get: (doctorId: string): Doctor | null => 
      dataCache.get<Doctor>(`doctors_${doctorId}`, 'doctors'),
    
    set: (doctorId: string, doctor: Doctor): boolean => 
      dataCache.set(`doctors_${doctorId}`, doctor, 'doctors'),
    
    remove: (doctorId: string): boolean => 
      dataCache.remove(`doctors_${doctorId}`),
    
    clear: (): void => 
      dataCache.clearByType('doctors')
  },

  // System operations
  system: {
    getStats: (): any => 
      dataCache.get('system_stats', 'systemStats'),
    
    setStats: (stats: any): boolean => 
      dataCache.set('system_stats', stats, 'systemStats'),
    
    getNotifications: (userId: string): any[] | null => 
      dataCache.get<any[]>(`notifications_${userId}`, 'notifications'),
    
    setNotifications: (userId: string, notifications: any[]): boolean => 
      dataCache.set(`notifications_${userId}`, notifications, 'notifications')
  }
};

/**
 * React hook for using cache in components
 */
export const useCache = () => {
  return {
    cache: cacheOperations,
    getStats: () => dataCache.getStats(),
    clearAll: () => dataCache.clearAll(),
    cleanup: () => dataCache.cleanup()
  };
};

export default dataCache;