// UI Management for TrustCareConnect Frontend
import { Config } from './config.js';
import { mockResponseManager } from './mockResponses.js';

export class UIManager {
    constructor() {
        this.currentSection = 'home';
        this.isSubmitting = false;
    }

    // Show specific section
    showSection(sectionName) {
        // Hide all sections
        const sections = ['hero', 'querySection', 'dashboardSection'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                if (section === 'hero') {
                    element.style.display = sectionName === 'home' ? 'block' : 'none';
                } else {
                    element.classList.toggle('active', section === sectionName + 'Section');
                }
            }
        });

        this.currentSection = sectionName;

        // Load dashboard data if dashboard section is shown
        if (sectionName === 'dashboard') {
            window.app.loadDashboardData();
        }
    }

    // Update connection status
    updateConnectionStatus(status, message) {
        const statusElement = document.getElementById('connectionStatus');
        const textElement = document.getElementById('connectionText');

        if (!statusElement || !textElement) return;

        statusElement.className = `connection-status ${status}`;
        textElement.textContent = message;

        if (status === 'connected') {
            setTimeout(() => {
                statusElement.style.opacity = '0.7';
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 2000);
            }, Config.get('ui.connectionStatusTimeout'));
        }
    }

    // Set submit button loading state
    setSubmitButtonLoading(loading) {
        const submitText = document.getElementById('submitText');
        const submitLoading = document.getElementById('submitLoading');
        const submitButton = document.querySelector('#medicalQueryForm button[type="submit"]');

        if (!submitText || !submitLoading || !submitButton) return;

        this.isSubmitting = loading;

        if (loading) {
            submitText.classList.add('hidden');
            submitLoading.classList.remove('hidden');
            submitButton.disabled = true;
        } else {
            submitText.classList.remove('hidden');
            submitLoading.classList.add('hidden');
            submitButton.disabled = false;
        }
    }

    // Show response in UI
    showResponse(response) {
        const responseContainer = document.getElementById('responseContainer');
        const responseContent = document.getElementById('responseContent');
        const safetyScore = document.getElementById('safetyScore');
        const responseStatus = document.getElementById('responseStatus');

        if (!responseContainer || !responseContent || !safetyScore || !responseStatus) {
            console.error('Response UI elements not found');
            return;
        }

        responseContainer.classList.add('active');
        responseContent.textContent = response.content;
        safetyScore.textContent = response.safetyScore.toString();

        responseStatus.textContent = `${response.urgency} Priority`;
        responseStatus.className = 'status-badge ' +
            (response.urgency === 'HIGH' ? 'status-pending' :
             response.urgency === 'MEDIUM' ? 'status-ai-processing' : 'status-approved');

        // Scroll to response
        responseContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Hide response container
    hideResponseContainer() {
        const responseContainer = document.getElementById('responseContainer');
        if (responseContainer) {
            responseContainer.classList.remove('active');
        }
    }

    // Get form data
    getFormData() {
        const patientId = document.getElementById('patientId')?.value;
        const queryText = document.getElementById('queryText')?.value;

        const vitalSigns = {
            bloodGlucose: document.getElementById('bloodGlucose')?.value,
            bloodPressure: document.getElementById('bloodPressure')?.value,
            heartRate: document.getElementById('heartRate')?.value,
            temperature: document.getElementById('temperature')?.value
        };

        return { patientId, queryText, vitalSigns };
    }

    // Update dashboard stats
    updateDashboardStats(stats) {
        const elements = {
            totalPatients: document.getElementById('totalPatients'),
            totalQueries: document.getElementById('totalQueries'),
            totalDoctors: document.getElementById('totalDoctors'),
            backendStatus: document.getElementById('backendStatus')
        };

        if (elements.totalPatients) elements.totalPatients.textContent = stats.totalPatients?.toString() || '--';
        if (elements.totalQueries) elements.totalQueries.textContent = stats.totalQueries?.toString() || '--';
        if (elements.totalDoctors) elements.totalDoctors.textContent = stats.totalDoctors?.toString() || '--';
        if (elements.backendStatus) elements.backendStatus.textContent = '✅ Online';
    }

    // Update health check content
    updateHealthCheck(healthText) {
        const healthCheckContent = document.getElementById('healthCheckContent');
        if (healthCheckContent) {
            healthCheckContent.textContent = healthText;
        }
    }

    // Show mock mode data
    showMockMode() {
        this.updateConnectionStatus('disconnected', 'Mock mode - Backend offline');

        // Set mock data for dashboard using mock response manager
        const mockStats = mockResponseManager.getMockStats();
        this.updateDashboardStats(mockStats);

        const backendStatus = document.getElementById('backendStatus');
        if (backendStatus) backendStatus.textContent = 'Offline (Demo Mode)';

        this.updateHealthCheck(`Demo Mode Active - Intelligent mock responses available

• ${mockStats.totalPatients} test patients configured
• ${mockStats.availableResponses} response scenarios available
• Personalized responses based on patient context
• Vital signs integration for safety scoring

To connect to real AI backend:
1. Run "dfx start --background"
2. Run "dfx deploy"
3. Refresh this page`);
    }

    // Validate form
    validateForm(formData) {
        if (!formData.patientId || !formData.queryText.trim()) {
            alert('Please select a patient and enter a query.');
            return false;
        }

        return true;
    }

    // Show debug logs (for development)
    showDebugLogs() {
        if (!Config.isDevelopment()) return;

        const { logger } = window;
        if (!logger) return;

        const stats = logger.getLogStatistics();
        console.group('📊 Debug Log Statistics');
        console.log('Total logs:', stats.total);
        console.log('By level:', stats.byLevel);
        console.log('By category:', stats.byCategory);
        console.log('Sessions:', stats.sessionsCount);
        console.groupEnd();

        console.group('📥 Download Debug Logs');
        console.log('Download JSON:', () => logger.downloadLogs('json'));
        console.log('Download CSV:', () => logger.downloadLogs('csv'));
        console.log('Export logs:', () => logger.exportLogs());
        console.log('Clear logs:', () => logger.clearLogs());
        console.groupEnd();
    }
}