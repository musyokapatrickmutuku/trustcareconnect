// Offline Functionality Manager for TrustCareConnect Frontend
import { Config } from './config.js';
import { logger } from './logger.js';
import { mockResponseManager } from './mockResponses.js';

export class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineQueue = [];
        this.syncInProgress = false;
        this.maxOfflineQueries = Config.get('offline.maxQueries', 10);
        this.offlineNotificationShown = false;

        this.initializeOfflineFunctionality();
    }

    // Initialize offline functionality
    initializeOfflineFunctionality() {
        // Setup online/offline event listeners
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));

        // Load queued items from storage
        this.loadOfflineQueue();

        // Register service worker for offline capabilities
        this.registerServiceWorker();

        logger.info('Offline manager initialized', {
            isOnline: this.isOnline,
            queueSize: this.offlineQueue.length
        }, 'offline_manager');
    }

    // Handle online/offline status changes
    handleOnlineStatus(online) {
        const wasOffline = !this.isOnline;
        this.isOnline = online;

        logger.info('Network status changed', {
            online,
            wasOffline,
            queueSize: this.offlineQueue.length
        }, 'network_status');

        if (online && wasOffline) {
            this.showOnlineNotification();
            this.syncOfflineData();
        } else if (!online) {
            this.showOfflineNotification();
        }

        // Update UI to reflect connection status
        this.updateConnectionUI();
    }

    // Show offline notification
    showOfflineNotification() {
        if (this.offlineNotificationShown) return;

        this.showNotification({
            type: 'warning',
            title: 'You\'re offline',
            message: 'You can still use TrustCareConnect with limited functionality. Your queries will be saved and synced when you\'re back online.',
            persistent: true,
            actions: [
                {
                    text: 'Learn More',
                    action: () => this.showOfflineCapabilities()
                }
            ]
        });

        this.offlineNotificationShown = true;
    }

    // Show online notification
    showOnlineNotification() {
        this.hideNotification('offline');

        if (this.offlineQueue.length > 0) {
            this.showNotification({
                type: 'success',
                title: 'Back online!',
                message: `Syncing ${this.offlineQueue.length} saved queries...`,
                duration: 3000
            });
        } else {
            this.showNotification({
                type: 'success',
                title: 'Back online!',
                message: 'Full functionality restored.',
                duration: 2000
            });
        }

        this.offlineNotificationShown = false;
    }

    // Queue medical query for offline processing
    queueMedicalQuery(patientId, queryText, vitalSigns = {}) {
        if (this.offlineQueue.length >= this.maxOfflineQueries) {
            this.showNotification({
                type: 'error',
                title: 'Offline queue full',
                message: `Maximum ${this.maxOfflineQueries} offline queries allowed. Please connect to sync your data.`,
                duration: 5000
            });
            return false;
        }

        const queueItem = {
            id: this.generateQueryId(),
            patientId,
            queryText,
            vitalSigns,
            timestamp: new Date().toISOString(),
            status: 'queued',
            attempts: 0
        };

        this.offlineQueue.push(queueItem);
        this.saveOfflineQueue();

        logger.info('Query queued for offline processing', {
            queryId: queueItem.id,
            patientId,
            queueSize: this.offlineQueue.length
        }, 'offline_queue');

        // Show immediate offline response
        this.generateOfflineResponse(queueItem);

        this.updateOfflineUI();
        return true;
    }

    // Generate offline response using mock system
    generateOfflineResponse(queueItem) {
        const mockResponse = mockResponseManager.generateMockResponse(
            queueItem.patientId,
            queueItem.queryText,
            queueItem.vitalSigns
        );

        // Enhance response to indicate offline status
        mockResponse.content = `🔌 **Offline Response**\n\n${mockResponse.content}\n\n⚠️ **Note**: This response was generated offline. When you reconnect, this query will be processed by our AI system for a more comprehensive response.`;
        mockResponse.isOffline = true;
        mockResponse.queueId = queueItem.id;

        // Show response in UI
        if (window.app && window.app.ui) {
            window.app.ui.showResponse(mockResponse);
        }

        return mockResponse;
    }

    // Sync offline data when back online
    async syncOfflineData() {
        if (this.syncInProgress || this.offlineQueue.length === 0) return;

        this.syncInProgress = true;

        logger.info('Starting offline data sync', {
            queueSize: this.offlineQueue.length
        }, 'offline_sync');

        const failedQueries = [];

        for (const item of this.offlineQueue) {
            try {
                item.attempts++;
                item.status = 'syncing';

                // Try to process the query through the backend
                const result = await this.processQueuedQuery(item);

                if (result.success) {
                    item.status = 'synced';
                    logger.info('Offline query synced successfully', {
                        queryId: item.id,
                        attempts: item.attempts
                    }, 'offline_sync_success');
                } else {
                    throw new Error(result.error);
                }

            } catch (error) {
                logger.error('Failed to sync offline query', {
                    queryId: item.id,
                    attempts: item.attempts,
                    error: error.message
                }, 'offline_sync_error');

                item.status = 'failed';

                if (item.attempts < 3) {
                    failedQueries.push(item);
                }
            }
        }

        // Remove successfully synced queries
        this.offlineQueue = this.offlineQueue.filter(item => item.status !== 'synced');

        // Update failed queries back to queued status for retry
        failedQueries.forEach(item => {
            item.status = 'queued';
        });

        this.saveOfflineQueue();
        this.updateOfflineUI();

        this.syncInProgress = false;

        // Show sync completion notification
        if (failedQueries.length > 0) {
            this.showNotification({
                type: 'warning',
                title: 'Sync partially completed',
                message: `${failedQueries.length} queries failed to sync and will be retried later.`,
                duration: 4000
            });
        } else {
            this.showNotification({
                type: 'success',
                title: 'All queries synced!',
                message: 'Your offline queries have been successfully processed.',
                duration: 3000
            });
        }

        logger.info('Offline data sync completed', {
            successful: this.offlineQueue.length,
            failed: failedQueries.length
        }, 'offline_sync_complete');
    }

    // Process a queued query through the backend
    async processQueuedQuery(queueItem) {
        try {
            if (!window.app || !window.app.backend || !window.app.backend.isConnected) {
                throw new Error('Backend not available');
            }

            const result = await window.app.backend.processMedicalQuery(
                queueItem.patientId,
                queueItem.queryText,
                queueItem.vitalSigns
            );

            if (result.ok) {
                // Update UI with real response if still visible
                this.updateResponseIfCurrent(queueItem.id, result.ok);
                return { success: true, result: result.ok };
            } else {
                throw new Error(result.err);
            }

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Update response in UI if it's currently displayed
    updateResponseIfCurrent(queueId, newResponse) {
        // Check if the current response is from this queued item
        const responseContainer = document.getElementById('responseContainer');
        if (responseContainer && responseContainer.classList.contains('active')) {
            const currentQueueId = responseContainer.dataset.queueId;
            if (currentQueueId === queueId) {
                // Update with new response
                newResponse.wasOffline = true;
                if (window.app && window.app.ui) {
                    window.app.ui.showResponse(newResponse);
                }

                this.showNotification({
                    type: 'info',
                    title: 'Response updated',
                    message: 'Your query has been processed by our AI system.',
                    duration: 3000
                });
            }
        }
    }

    // Show offline capabilities information
    showOfflineCapabilities() {
        this.showNotification({
            type: 'info',
            title: 'Offline Capabilities',
            message: `
                📱 **What works offline:**
                • Submit medical queries (saved for sync)
                • View intelligent mock responses
                • Browse patient information
                • Access dashboard data

                ⚡ **What requires internet:**
                • Real AI responses from BaiChuan M2 32B
                • Backend data synchronization
                • Latest system updates

                🔄 **Auto-sync:** Your queries will automatically sync when you're back online.
            `,
            persistent: true,
            actions: [
                {
                    text: 'Got it',
                    action: () => this.hideNotification('capabilities')
                }
            ]
        });
    }

    // Update connection UI indicators
    updateConnectionUI() {
        const indicators = document.querySelectorAll('[data-connection-indicator]');

        indicators.forEach(indicator => {
            if (this.isOnline) {
                indicator.classList.remove('offline');
                indicator.classList.add('online');
                indicator.textContent = '🟢 Online';
            } else {
                indicator.classList.remove('online');
                indicator.classList.add('offline');
                indicator.textContent = '🔴 Offline';
            }
        });

        // Update offline queue indicator
        this.updateOfflineUI();
    }

    // Update offline queue UI
    updateOfflineUI() {
        const queueIndicator = document.getElementById('offlineQueueIndicator');
        if (queueIndicator) {
            if (this.offlineQueue.length > 0) {
                queueIndicator.style.display = 'block';
                queueIndicator.textContent = `📤 ${this.offlineQueue.length} queued for sync`;
            } else {
                queueIndicator.style.display = 'none';
            }
        }
    }

    // Generic notification system
    showNotification({ type, title, message, duration, persistent = false, actions = [] }) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <h4 class="notification-title">${title}</h4>
                <p class="notification-message">${message}</p>
                ${actions.length > 0 ? `
                    <div class="notification-actions">
                        ${actions.map((action, index) =>
                            `<button class="notification-action" data-action="${index}">${action.text}</button>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
            ${!persistent ? '<button class="notification-close">×</button>' : ''}
        `;

        // Add event listeners
        if (!persistent) {
            notification.querySelector('.notification-close').addEventListener('click', () => {
                this.hideNotification(notification);
            });
        }

        actions.forEach((action, index) => {
            const button = notification.querySelector(`[data-action="${index}"]`);
            if (button) {
                button.addEventListener('click', () => {
                    action.action();
                    this.hideNotification(notification);
                });
            }
        });

        // Add to DOM
        this.getNotificationContainer().appendChild(notification);

        // Auto-hide if duration specified
        if (duration && !persistent) {
            setTimeout(() => {
                this.hideNotification(notification);
            }, duration);
        }

        return notification;
    }

    // Hide notification
    hideNotification(notification) {
        if (typeof notification === 'string') {
            // Hide by type
            const notifications = document.querySelectorAll(`.notification-${notification}`);
            notifications.forEach(n => this.hideNotification(n));
            return;
        }

        if (notification && notification.parentNode) {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    // Get or create notification container
    getNotificationContainer() {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // Generate unique query ID
    generateQueryId() {
        return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    // Save offline queue to localStorage
    saveOfflineQueue() {
        try {
            localStorage.setItem('trustcare_offline_queue', JSON.stringify(this.offlineQueue));
        } catch (error) {
            logger.error('Failed to save offline queue', {
                error: error.message,
                queueSize: this.offlineQueue.length
            }, 'offline_storage_error');
        }
    }

    // Load offline queue from localStorage
    loadOfflineQueue() {
        try {
            const saved = localStorage.getItem('trustcare_offline_queue');
            if (saved) {
                this.offlineQueue = JSON.parse(saved);
                logger.info('Offline queue loaded', {
                    queueSize: this.offlineQueue.length
                }, 'offline_queue_loaded');
            }
        } catch (error) {
            logger.error('Failed to load offline queue', {
                error: error.message
            }, 'offline_storage_error');
            this.offlineQueue = [];
        }
    }

    // Register service worker for offline caching
    async registerServiceWorker() {
        if ('serviceWorker' in navigator && Config.get('offline.serviceWorker', true)) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                logger.info('Service worker registered', {
                    scope: registration.scope
                }, 'service_worker');
            } catch (error) {
                logger.warn('Service worker registration failed', {
                    error: error.message
                }, 'service_worker_error');
            }
        }
    }

    // Get offline statistics
    getOfflineStatistics() {
        return {
            isOnline: this.isOnline,
            queueSize: this.offlineQueue.length,
            queuedQueries: this.offlineQueue.map(item => ({
                id: item.id,
                patientId: item.patientId,
                timestamp: item.timestamp,
                status: item.status,
                attempts: item.attempts
            })),
            syncInProgress: this.syncInProgress
        };
    }

    // Clear offline data
    clearOfflineData() {
        this.offlineQueue = [];
        this.saveOfflineQueue();
        this.updateOfflineUI();

        logger.info('Offline data cleared', {}, 'offline_data_cleared');
    }
}

// Create singleton instance
export const offlineManager = new OfflineManager();