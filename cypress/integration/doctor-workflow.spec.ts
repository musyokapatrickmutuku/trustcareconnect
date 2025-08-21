describe('Doctor Complete Workflow', () => {
  beforeEach(() => {
    // Reset database and set up test data
    cy.task('db:seed');
    cy.visit('/');
  });

  describe('Doctor Authentication and Dashboard Access', () => {
    it('completes full doctor login and dashboard workflow', () => {
      // Login as doctor
      cy.get('[data-cy="login-email"]').type('dr.smith@hospital.com');
      cy.get('[data-cy="login-password"]').type('securePassword123');
      cy.get('[data-cy="login-submit"]').click();

      // Verify successful login and dashboard load
      cy.url().should('include', '/doctor/dashboard');
      cy.get('[data-cy="doctor-dashboard"]').should('be.visible');
      cy.get('[data-cy="welcome-message"]').should('contain', 'Dr. Smith');

      // Verify real-time connection status
      cy.get('[data-cy="connection-status"]').should('contain', 'Connected');
      cy.get('[data-cy="online-users-count"]').should('be.visible');

      // Check dashboard widgets load
      cy.get('[data-cy="patient-count-widget"]').should('be.visible');
      cy.get('[data-cy="pending-queries-widget"]').should('be.visible');
      cy.get('[data-cy="appointments-widget"]').should('be.visible');
      cy.get('[data-cy="system-alerts-widget"]').should('be.visible');
    });

    it('handles MFA authentication flow', () => {
      // Login with MFA-enabled account
      cy.get('[data-cy="login-email"]').type('dr.admin@hospital.com');
      cy.get('[data-cy="login-password"]').type('adminPassword123');
      cy.get('[data-cy="login-submit"]').click();

      // MFA challenge should appear
      cy.get('[data-cy="mfa-challenge"]').should('be.visible');
      cy.get('[data-cy="mfa-code-input"]').type('123456');
      cy.get('[data-cy="mfa-verify"]').click();

      // Should redirect to dashboard after successful MFA
      cy.url().should('include', '/doctor/dashboard');
      cy.get('[data-cy="doctor-dashboard"]').should('be.visible');
    });
  });

  describe('Patient Management Workflow', () => {
    beforeEach(() => {
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
    });

    it('completes full patient search and profile access', () => {
      // Navigate to patient management
      cy.get('[data-cy="nav-patients"]').click();
      cy.url().should('include', '/doctor/patients');

      // Search for patient
      cy.get('[data-cy="patient-search"]').type('John Doe');
      cy.get('[data-cy="search-submit"]').click();

      // Verify search results
      cy.get('[data-cy="patient-results"]').should('be.visible');
      cy.get('[data-cy="patient-card"]').should('have.length.at.least', 1);

      // Access patient profile
      cy.get('[data-cy="patient-card"]').first().click();
      cy.url().should('include', '/doctor/patients/');

      // Verify patient profile loads with medical data
      cy.get('[data-cy="patient-profile"]').should('be.visible');
      cy.get('[data-cy="patient-basic-info"]').should('be.visible');
      cy.get('[data-cy="medical-history"]').should('be.visible');
      cy.get('[data-cy="current-medications"]').should('be.visible');
      cy.get('[data-cy="allergies-section"]').should('be.visible');
    });

    it('creates and manages patient appointments', () => {
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="patient-search"]').type('Jane Smith');
      cy.get('[data-cy="search-submit"]').click();
      cy.get('[data-cy="patient-card"]').first().click();

      // Create new appointment
      cy.get('[data-cy="schedule-appointment"]').click();
      cy.get('[data-cy="appointment-modal"]').should('be.visible');

      cy.get('[data-cy="appointment-date"]').click();
      cy.get('[data-cy="date-picker"]').contains('25').click();
      cy.get('[data-cy="appointment-time"]').select('14:00');
      cy.get('[data-cy="appointment-type"]').select('Follow-up');
      cy.get('[data-cy="appointment-notes"]').type('Routine follow-up examination');

      cy.get('[data-cy="schedule-confirm"]').click();

      // Verify appointment created
      cy.get('[data-cy="success-message"]').should('contain', 'Appointment scheduled');
      cy.get('[data-cy="upcoming-appointments"]').should('contain', 'Follow-up');
    });

    it('handles patient medical record updates', () => {
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="patient-search"]').type('John Doe');
      cy.get('[data-cy="search-submit"]').click();
      cy.get('[data-cy="patient-card"]').first().click();

      // Update medical information
      cy.get('[data-cy="edit-medical-info"]').click();
      cy.get('[data-cy="medical-form"]').should('be.visible');

      // Add new medication
      cy.get('[data-cy="add-medication"]').click();
      cy.get('[data-cy="medication-name"]').type('Lisinopril');
      cy.get('[data-cy="medication-dosage"]').type('10mg');
      cy.get('[data-cy="medication-frequency"]').select('Daily');

      // Add new allergy
      cy.get('[data-cy="add-allergy"]').click();
      cy.get('[data-cy="allergy-substance"]').type('Penicillin');
      cy.get('[data-cy="allergy-severity"]').select('Severe');

      cy.get('[data-cy="save-medical-info"]').click();

      // Verify updates saved
      cy.get('[data-cy="success-message"]').should('contain', 'Medical information updated');
      cy.get('[data-cy="current-medications"]').should('contain', 'Lisinopril');
      cy.get('[data-cy="allergies-section"]').should('contain', 'Penicillin');
    });
  });

  describe('Query Management Workflow', () => {
    beforeEach(() => {
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
    });

    it('completes full query lifecycle management', () => {
      // Navigate to query management
      cy.get('[data-cy="nav-queries"]').click();
      cy.url().should('include', '/doctor/queries');

      // Create new query
      cy.get('[data-cy="create-query"]').click();
      cy.get('[data-cy="query-form"]').should('be.visible');

      cy.get('[data-cy="query-title"]').type('Patient Consultation Request');
      cy.get('[data-cy="query-type"]').select('Consultation');
      cy.get('[data-cy="query-priority"]').select('High');
      cy.get('[data-cy="query-department"]').select('Cardiology');
      cy.get('[data-cy="query-description"]').type('Requesting cardiology consultation for patient with chest pain');

      cy.get('[data-cy="submit-query"]').click();

      // Verify query created
      cy.get('[data-cy="success-message"]').should('contain', 'Query created successfully');
      cy.url().should('include', '/doctor/queries');

      // Verify query appears in list
      cy.get('[data-cy="query-list"]').should('contain', 'Patient Consultation Request');
      cy.get('[data-cy="query-status"]').should('contain', 'Pending');
    });

    it('manages query responses and follow-ups', () => {
      cy.get('[data-cy="nav-queries"]').click();

      // Access existing query
      cy.get('[data-cy="query-card"]').first().click();
      cy.get('[data-cy="query-details"]').should('be.visible');

      // Add response to query
      cy.get('[data-cy="add-response"]').click();
      cy.get('[data-cy="response-text"]').type('Initial assessment completed. Recommend echocardiogram.');
      cy.get('[data-cy="response-status"]').select('In Progress');
      cy.get('[data-cy="submit-response"]').click();

      // Verify response added
      cy.get('[data-cy="response-list"]').should('contain', 'Initial assessment completed');
      cy.get('[data-cy="query-status"]').should('contain', 'In Progress');

      // Add follow-up
      cy.get('[data-cy="add-followup"]').click();
      cy.get('[data-cy="followup-date"]').click();
      cy.get('[data-cy="date-picker"]').contains('30').click();
      cy.get('[data-cy="followup-notes"]').type('Schedule follow-up for test results review');
      cy.get('[data-cy="submit-followup"]').click();

      cy.get('[data-cy="followup-list"]').should('contain', 'Schedule follow-up');
    });

    it('handles bulk query operations', () => {
      cy.get('[data-cy="nav-queries"]').click();

      // Select multiple queries
      cy.get('[data-cy="query-checkbox"]').first().check();
      cy.get('[data-cy="query-checkbox"]').eq(1).check();
      cy.get('[data-cy="query-checkbox"]').eq(2).check();

      // Perform bulk action
      cy.get('[data-cy="bulk-actions"]').select('Update Status');
      cy.get('[data-cy="bulk-status"]').select('Under Review');
      cy.get('[data-cy="apply-bulk-action"]').click();

      // Verify bulk update
      cy.get('[data-cy="success-message"]').should('contain', '3 queries updated');
      cy.get('[data-cy="query-status"]').should('contain', 'Under Review');
    });
  });

  describe('Real-time Communication Workflow', () => {
    beforeEach(() => {
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
    });

    it('handles real-time notifications and messaging', () => {
      // Verify WebSocket connection
      cy.get('[data-cy="connection-status"]').should('contain', 'Connected');

      // Simulate incoming notification
      cy.window().then((win) => {
        win.postMessage({
          type: 'NEW_QUERY_NOTIFICATION',
          payload: {
            queryId: 'query-123',
            title: 'Urgent: Patient Emergency',
            priority: 'Critical'
          }
        }, '*');
      });

      // Verify notification appears
      cy.get('[data-cy="notification-toast"]').should('be.visible');
      cy.get('[data-cy="notification-toast"]').should('contain', 'Urgent: Patient Emergency');
      cy.get('[data-cy="notification-priority"]').should('contain', 'Critical');

      // Click notification to navigate
      cy.get('[data-cy="notification-toast"]').click();
      cy.url().should('include', '/doctor/queries/query-123');
    });

    it('manages real-time collaboration features', () => {
      cy.get('[data-cy="nav-queries"]').click();
      cy.get('[data-cy="query-card"]').first().click();

      // Verify other users viewing same query
      cy.get('[data-cy="active-viewers"]').should('be.visible');
      cy.get('[data-cy="viewer-avatar"]').should('have.length.at.least', 1);

      // Add comment and verify real-time update
      cy.get('[data-cy="add-comment"]').click();
      cy.get('[data-cy="comment-text"]').type('Adding my input on this case');
      cy.get('[data-cy="submit-comment"]').click();

      cy.get('[data-cy="comment-list"]').should('contain', 'Adding my input on this case');
      cy.get('[data-cy="comment-timestamp"]').should('be.visible');
    });
  });

  describe('Data Export and Reporting Workflow', () => {
    beforeEach(() => {
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
    });

    it('exports patient data with proper formatting', () => {
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="patient-search"]').type('John Doe');
      cy.get('[data-cy="search-submit"]').click();
      cy.get('[data-cy="patient-card"]').first().click();

      // Export patient summary
      cy.get('[data-cy="export-options"]').click();
      cy.get('[data-cy="export-summary"]').click();
      cy.get('[data-cy="export-format"]').select('PDF');
      cy.get('[data-cy="confirm-export"]').click();

      // Verify export initiated
      cy.get('[data-cy="export-status"]').should('contain', 'Generating export');
      
      // Wait for export completion
      cy.get('[data-cy="download-link"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy="download-link"]').should('contain', 'Download Patient Summary');
    });

    it('generates comprehensive reports', () => {
      cy.get('[data-cy="nav-reports"]').click();
      cy.url().should('include', '/doctor/reports');

      // Generate query analytics report
      cy.get('[data-cy="report-type"]').select('Query Analytics');
      cy.get('[data-cy="date-range-start"]').type('2024-01-01');
      cy.get('[data-cy="date-range-end"]').type('2024-12-31');
      cy.get('[data-cy="department-filter"]').select('Cardiology');
      cy.get('[data-cy="generate-report"]').click();

      // Verify report generation
      cy.get('[data-cy="report-progress"]').should('be.visible');
      cy.get('[data-cy="report-results"]', { timeout: 15000 }).should('be.visible');
      cy.get('[data-cy="report-chart"]').should('be.visible');
      cy.get('[data-cy="report-summary"]').should('contain', 'Total Queries');
    });
  });

  describe('Mobile Responsiveness and PWA Features', () => {
    beforeEach(() => {
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
    });

    it('works correctly on mobile devices', () => {
      cy.viewport('iphone-x');

      // Verify mobile navigation
      cy.get('[data-cy="mobile-menu-toggle"]').should('be.visible');
      cy.get('[data-cy="mobile-menu-toggle"]').click();
      cy.get('[data-cy="mobile-nav-menu"]').should('be.visible');

      // Navigate through mobile menu
      cy.get('[data-cy="mobile-nav-patients"]').click();
      cy.url().should('include', '/doctor/patients');

      // Verify responsive patient cards
      cy.get('[data-cy="patient-card"]').should('have.css', 'width').and('match', /100%|calc/);
      
      // Test touch interactions
      cy.get('[data-cy="patient-card"]').first().click();
      cy.get('[data-cy="patient-profile"]').should('be.visible');
    });

    it('handles offline functionality', () => {
      // Go offline
      cy.window().then((win) => {
        win.navigator.serviceWorker.ready.then((registration) => {
          // Simulate offline mode
          cy.wrap(registration).invoke('update');
        });
      });

      // Verify offline indicator
      cy.get('[data-cy="offline-indicator"]').should('be.visible');
      cy.get('[data-cy="offline-message"]').should('contain', 'Working offline');

      // Verify cached data still accessible
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="cached-data-notice"]').should('be.visible');
      cy.get('[data-cy="patient-list"]').should('be.visible');
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(() => {
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
    });

    it('handles network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '/api/patients*', { forceNetworkError: true }).as('networkError');

      cy.get('[data-cy="nav-patients"]').click();
      cy.wait('@networkError');

      // Verify error handling
      cy.get('[data-cy="error-message"]').should('be.visible');
      cy.get('[data-cy="error-message"]').should('contain', 'Network error');
      cy.get('[data-cy="retry-button"]').should('be.visible');

      // Test retry functionality
      cy.intercept('GET', '/api/patients*', { fixture: 'patients.json' }).as('patientsRetry');
      cy.get('[data-cy="retry-button"]').click();
      cy.wait('@patientsRetry');

      cy.get('[data-cy="patient-list"]').should('be.visible');
      cy.get('[data-cy="error-message"]').should('not.exist');
    });

    it('handles session expiration during workflow', () => {
      // Simulate session expiration
      cy.intercept('GET', '/api/patients*', { statusCode: 401, body: { error: 'Token expired' } }).as('sessionExpired');

      cy.get('[data-cy="nav-patients"]').click();
      cy.wait('@sessionExpired');

      // Verify redirect to login
      cy.get('[data-cy="session-expired-modal"]').should('be.visible');
      cy.get('[data-cy="session-expired-message"]').should('contain', 'Your session has expired');
      cy.get('[data-cy="relogin-button"]').click();

      cy.url().should('include', '/login');
      cy.get('[data-cy="login-form"]').should('be.visible');
    });
  });

  describe('Performance and Loading States', () => {
    beforeEach(() => {
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
    });

    it('shows proper loading states during data fetching', () => {
      // Intercept with delay to test loading states
      cy.intercept('GET', '/api/patients*', { delay: 2000, fixture: 'patients.json' }).as('slowPatients');

      cy.get('[data-cy="nav-patients"]').click();

      // Verify loading state
      cy.get('[data-cy="loading-spinner"]').should('be.visible');
      cy.get('[data-cy="loading-message"]').should('contain', 'Loading patients');

      cy.wait('@slowPatients');

      // Verify loading state disappears
      cy.get('[data-cy="loading-spinner"]').should('not.exist');
      cy.get('[data-cy="patient-list"]').should('be.visible');
    });

    it('meets performance benchmarks', () => {
      // Test page load performance
      cy.visit('/doctor/dashboard');
      
      cy.window().then((win) => {
        cy.wrap(win.performance.getEntriesByType('navigation')[0]).as('navTiming');
      });

      cy.get('@navTiming').should((timing: any) => {
        expect(timing.loadEventEnd - timing.loadEventStart).to.be.lessThan(3000);
      });

      // Test interactive elements response time
      const startTime = Date.now();
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="patient-list"]').should('be.visible').then(() => {
        const endTime = Date.now();
        expect(endTime - startTime).to.be.lessThan(2000);
      });
    });
  });
});