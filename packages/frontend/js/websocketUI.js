// WebSocket UI Manager for connection status and progress indicators
import { logger } from './logger.js';

export class WebSocketUIManager {
    constructor() {
        this.connectionElements = {
            wsStatusDot: document.getElementById('wsStatusDot'),
            wsStatusText: document.getElementById('wsStatusText'),
            icpStatusDot: document.getElementById('icpStatusDot'),
            icpStatusText: document.getElementById('icpStatusText'),
            bridgeStatusDot: document.getElementById('bridgeStatusDot'),
            bridgeStatusText: document.getElementById('bridgeStatusText'),
            connectionText: document.getElementById('connectionText'),
            connectionStatus: document.getElementById('connectionStatus')
        };

        this.progressElements = {
            queryProgress: document.getElementById('queryProgress'),
            progressBar: document.getElementById('progressBar'),
            steps: {
                submit: document.getElementById('step-submit'),
                bridge: document.getElementById('step-bridge'),
                ai: document.getElementById('step-ai'),
                review: document.getElementById('step-review')
            },
            stepStatuses: {
                submit: document.getElementById('step-submit-status'),
                bridge: document.getElementById('step-bridge-status'),
                ai: document.getElementById('step-ai-status'),
                review: document.getElementById('step-review-status')
            }
        };

        this.queueElements = {
            wsQueueStatus: document.getElementById('wsQueueStatus'),
            queuePosition: document.getElementById('queuePosition'),
            estimatedWait: document.getElementById('estimatedWait'),
            activeQueries: document.getElementById('activeQueries')
        };

        this.responseElements = {
            responseChannel: document.getElementById('responseChannel'),
            loadingText: document.getElementById('loadingText'),
            urgencyLevel: document.getElementById('urgencyLevel')
        };

        this.currentQueryId = null;
        this.progressSteps = ['submit', 'bridge', 'ai', 'review'];
        this.currentStep = 0;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // WebSocket query response events
        window.addEventListener('wsQueryResponse', (event) => {
            this.handleQueryResponse(event.detail);
        });

        // WebSocket query progress events
        window.addEventListener('wsQueryProgress', (event) => {
            this.handleQueryProgress(event.detail);
        });

        // WebSocket doctor review updates
        window.addEventListener('wsDoctorReviewUpdate', (event) => {
            this.handleDoctorReviewUpdate(event.detail);
        });

        // WebSocket queue status updates
        window.addEventListener('wsQueueStatus', (event) => {
            this.handleQueueStatus(event.detail);
        });

        // WebSocket system status updates
        window.addEventListener('wsSystemStatus', (event) => {
            this.handleSystemStatus(event.detail);
        });

        // WebSocket error events
        window.addEventListener('wsError', (event) => {
            this.handleWebSocketError(event.detail);
        });
    }

    // Update connection status indicators
    updateConnectionStatus(connectionType, status, message, details = {}) {
        const elements = this.connectionElements;

        switch (connectionType) {
            case 'websocket':
                this.updateStatusIndicator(elements.wsStatusDot, elements.wsStatusText, status, message);
                break;
            case 'icp':
                this.updateStatusIndicator(elements.icpStatusDot, elements.icpStatusText, status, message);
                break;
            case 'bridge':
                this.updateStatusIndicator(elements.bridgeStatusDot, elements.bridgeStatusText, status, message);
                break;
        }

        this.updateOverallConnectionStatus();
    }

    // Update individual status indicator
    updateStatusIndicator(dot, text, status, message) {
        if (!dot || !text) return;

        // Update dot class
        dot.className = 'connection-dot';
        text.textContent = message;

        switch (status) {
            case 'connected':
                dot.classList.add('connected');
                break;
            case 'connecting':
            case 'reconnecting':
                dot.classList.add('connecting');
                break;
            case 'disconnected':
            case 'failed':
            case 'error':
                dot.classList.add('disconnected');
                break;
            default:
                dot.classList.add('unknown');
        }
    }

    // Update overall connection status
    updateOverallConnectionStatus() {
        const elements = this.connectionElements;

        // Check individual connection states
        const wsConnected = elements.wsStatusDot?.classList.contains('connected');
        const icpConnected = elements.icpStatusDot?.classList.contains('connected');
        const bridgeConnected = elements.bridgeStatusDot?.classList.contains('connected');

        let overallStatus = 'connecting';
        let overallMessage = 'Connecting to services...';

        if (wsConnected && icpConnected && bridgeConnected) {
            overallStatus = 'connected';
            overallMessage = 'All services connected';
        } else if (wsConnected || icpConnected) {
            overallStatus = 'partial';
            overallMessage = 'Partial connectivity - some services available';
        } else if (elements.wsStatusDot?.classList.contains('disconnected') &&
                   elements.icpStatusDot?.classList.contains('disconnected')) {
            overallStatus = 'disconnected';
            overallMessage = 'All services disconnected';
        }

        // Update main connection status
        if (elements.connectionStatus) {
            elements.connectionStatus.className = `connection-status ${overallStatus}`;
        }

        if (elements.connectionText) {
            elements.connectionText.textContent = overallMessage;
        }
    }

    // Show query progress indicator
    showQueryProgress(queryId) {
        this.currentQueryId = queryId;
        this.currentStep = 0;

        if (this.progressElements.queryProgress) {
            this.progressElements.queryProgress.classList.remove('hidden');
        }

        // Reset all steps
        this.progressSteps.forEach((step, index) => {
            this.updateProgressStep(step, index === 0 ? 'active' : 'waiting',
                                  index === 0 ? 'In Progress' : 'Waiting');
        });

        this.updateProgressBar(0);
    }

    // Hide query progress indicator
    hideQueryProgress() {
        if (this.progressElements.queryProgress) {
            this.progressElements.queryProgress.classList.add('hidden');
        }
        this.currentQueryId = null;
        this.currentStep = 0;
    }

    // Update progress step
    updateProgressStep(stepName, status, message) {
        const step = this.progressElements.steps[stepName];
        const statusElement = this.progressElements.stepStatuses[stepName];

        if (!step || !statusElement) return;

        // Update step classes
        step.className = 'progress-step';
        step.classList.add(status);

        // Update status message
        statusElement.textContent = message;

        logger.debug('Progress step updated', { stepName, status, message });
    }

    // Update progress bar
    updateProgressBar(percentage) {
        if (this.progressElements.progressBar) {
            this.progressElements.progressBar.style.width = `${percentage}%`;
        }
    }

    // Handle query progress updates
    handleQueryProgress(detail) {
        const { queryId, step, status, message } = detail;

        if (queryId !== this.currentQueryId) {
            return; // Not our current query
        }

        logger.debug('Handling query progress', detail);

        // Update loading text
        if (this.responseElements.loadingText) {
            this.responseElements.loadingText.textContent = message || `Processing step: ${step}`;
        }

        // Map step names to our progress steps
        const stepMapping = {
            'submitted': 'submit',
            'bridge_received': 'bridge',
            'bridge_processing': 'bridge',
            'ai_processing': 'ai',
            'ai_completed': 'ai',
            'doctor_review': 'review',
            'doctor_approved': 'review',
            'completed': 'review'
        };

        const mappedStep = stepMapping[step];
        if (mappedStep) {
            const stepIndex = this.progressSteps.indexOf(mappedStep);

            // Update current step
            this.updateProgressStep(mappedStep, status, message);

            // Update progress bar
            const progressPercentage = ((stepIndex + 1) / this.progressSteps.length) * 100;
            this.updateProgressBar(progressPercentage);

            // Mark previous steps as completed
            for (let i = 0; i < stepIndex; i++) {
                this.updateProgressStep(this.progressSteps[i], 'completed', 'Completed');
            }

            this.currentStep = stepIndex;
        }
    }

    // Handle query response
    handleQueryResponse(detail) {
        const { queryId, data } = detail;

        logger.info('Handling query response', { queryId, safetyScore: data.safetyScore });

        // Update response channel indicator
        if (this.responseElements.responseChannel) {
            this.responseElements.responseChannel.textContent = 'WebSocket Bridge';
        }

        // Update urgency level
        if (this.responseElements.urgencyLevel && data.urgency) {
            this.responseElements.urgencyLevel.textContent = data.urgency;
            this.responseElements.urgencyLevel.className = `urgency-${data.urgency.toLowerCase()}`;
        }

        // Complete all progress steps
        this.progressSteps.forEach(step => {
            this.updateProgressStep(step, 'completed', 'Completed');
        });
        this.updateProgressBar(100);

        // Hide progress after a delay
        setTimeout(() => {
            this.hideQueryProgress();
        }, 3000);
    }

    // Handle doctor review updates
    handleDoctorReviewUpdate(detail) {
        const { queryId, status, doctorId, message } = detail;

        logger.info('Handling doctor review update', detail);

        if (queryId === this.currentQueryId) {
            // Update review step
            let stepStatus = 'active';
            let stepMessage = 'Under Review';

            switch (status) {
                case 'assigned':
                    stepMessage = `Assigned to Dr. ${doctorId}`;
                    break;
                case 'in_progress':
                    stepMessage = 'Doctor reviewing...';
                    break;
                case 'approved':
                    stepStatus = 'completed';
                    stepMessage = 'Doctor approved';
                    break;
                case 'rejected':
                    stepStatus = 'error';
                    stepMessage = 'Requires revision';
                    break;
            }

            this.updateProgressStep('review', stepStatus, stepMessage);
        }

        // Show notification for review updates
        this.showNotification(`Doctor Review: ${message}`, status === 'approved' ? 'success' : 'info');
    }

    // Handle queue status updates
    handleQueueStatus(detail) {
        const { position, estimatedWait, activeQueries, totalQueued } = detail;

        logger.debug('Handling queue status', detail);

        // Update queue elements
        if (this.queueElements.queuePosition) {
            this.queueElements.queuePosition.textContent = position || '--';
        }
        if (this.queueElements.estimatedWait) {
            this.queueElements.estimatedWait.textContent = estimatedWait || '--';
        }
        if (this.queueElements.activeQueries) {
            this.queueElements.activeQueries.textContent = activeQueries || '--';
        }

        // Show/hide queue status based on queue position
        if (this.queueElements.wsQueueStatus) {
            if (position > 1) {
                this.queueElements.wsQueueStatus.classList.remove('hidden');
            } else {
                this.queueElements.wsQueueStatus.classList.add('hidden');
            }
        }
    }

    // Handle system status updates
    handleSystemStatus(detail) {
        logger.debug('Handling system status', detail);

        // Update system-wide indicators
        const { bridgeHealth, icpHealth, aiHealth } = detail;

        if (bridgeHealth !== undefined) {
            this.updateConnectionStatus('bridge',
                bridgeHealth ? 'connected' : 'error',
                bridgeHealth ? 'Healthy' : 'Service Error');
        }

        if (icpHealth !== undefined) {
            this.updateConnectionStatus('icp',
                icpHealth ? 'connected' : 'error',
                icpHealth ? 'Connected' : 'ICP Error');
        }
    }

    // Handle WebSocket errors
    handleWebSocketError(detail) {
        logger.error('Handling WebSocket error', detail);

        const { code, message, queryId } = detail;

        // Update current query if it's affected
        if (queryId === this.currentQueryId) {
            this.updateProgressStep('bridge', 'error', `Error: ${message}`);
        }

        // Show error notification
        this.showNotification(`WebSocket Error: ${message}`, 'error');
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notificationContainer = document.getElementById('notificationContainer');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notificationContainer';
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add to container
        notificationContainer.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Close button handler
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });

        logger.debug('Notification shown', { message, type });
    }

    // Update loading text during query processing
    updateLoadingText(text) {
        if (this.responseElements.loadingText) {
            this.responseElements.loadingText.textContent = text;
        }
    }

    // Get current connection state summary
    getConnectionSummary() {
        const elements = this.connectionElements;
        return {
            websocket: {
                connected: elements.wsStatusDot?.classList.contains('connected'),
                status: elements.wsStatusText?.textContent
            },
            icp: {
                connected: elements.icpStatusDot?.classList.contains('connected'),
                status: elements.icpStatusText?.textContent
            },
            bridge: {
                connected: elements.bridgeStatusDot?.classList.contains('connected'),
                status: elements.bridgeStatusText?.textContent
            },
            overall: elements.connectionStatus?.className
        };
    }

    // Reset all status indicators
    reset() {
        // Reset connection indicators
        Object.entries(this.connectionElements).forEach(([key, element]) => {
            if (element && key.includes('StatusDot')) {
                element.className = 'connection-dot unknown';
            } else if (element && key.includes('StatusText')) {
                element.textContent = 'Initializing...';
            }
        });

        // Hide progress
        this.hideQueryProgress();

        // Hide queue status
        if (this.queueElements.wsQueueStatus) {
            this.queueElements.wsQueueStatus.classList.add('hidden');
        }

        logger.debug('WebSocket UI reset');
    }
}