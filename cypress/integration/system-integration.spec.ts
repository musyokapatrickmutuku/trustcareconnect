describe('System Integration End-to-End Tests', () => {
  beforeEach(() => {
    // Reset database and set up comprehensive test data
    cy.task('db:seed');
    cy.visit('/');
  });

  describe('Cross-Platform Data Synchronization', () => {
    it('synchronizes data between doctor and patient portals', () => {
      // Doctor creates patient record
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="add-patient"]').click();

      // Create comprehensive patient record
      cy.get('[data-cy="patient-first-name"]').type('Sarah');
      cy.get('[data-cy="patient-last-name"]').type('Williams');
      cy.get('[data-cy="patient-email"]').type('sarah.williams@email.com');
      cy.get('[data-cy="patient-dob"]').type('1985-08-20');
      cy.get('[data-cy="patient-phone"]').type('555-234-5678');
      cy.get('[data-cy="medical-record-number"]').type('MRN98765');
      cy.get('[data-cy="insurance-provider"]').type('United Healthcare');
      cy.get('[data-cy="primary-diagnosis"]').type('Hypertension');

      cy.get('[data-cy="save-patient"]').click();
      cy.get('[data-cy="patient-created"]').should('contain', 'Patient created successfully');

      // Add medical information
      cy.get('[data-cy="add-medical-info"]').click();
      cy.get('[data-cy="add-medication"]').click();
      cy.get('[data-cy="medication-name"]').type('Amlodipine');
      cy.get('[data-cy="medication-dosage"]').type('5mg');
      cy.get('[data-cy="medication-frequency"]').select('Daily');

      cy.get('[data-cy="add-allergy"]').click();
      cy.get('[data-cy="allergy-substance"]').type('Shellfish');
      cy.get('[data-cy="allergy-severity"]').select('Moderate');

      cy.get('[data-cy="save-medical-info"]').click();

      // Schedule appointment
      cy.get('[data-cy="schedule-appointment"]').click();
      cy.get('[data-cy="appointment-date"]').click();
      cy.get('[data-cy="available-date"]').first().click();
      cy.get('[data-cy="appointment-time"]').select('10:00');
      cy.get('[data-cy="appointment-type"]').select('Follow-up');
      cy.get('[data-cy="schedule-confirm"]').click();

      // Logout doctor
      cy.get('[data-cy="logout"]').click();

      // Login as the created patient
      cy.get('[data-cy="patient-login-tab"]').click();
      cy.get('[data-cy="patient-email"]').type('sarah.williams@email.com');
      cy.get('[data-cy="patient-password"]').type('tempPassword123');
      cy.get('[data-cy="patient-mrn"]').type('MRN98765');
      cy.get('[data-cy="patient-login-submit"]').click();

      // Verify patient can see all doctor-created information
      cy.get('[data-cy="nav-medical-records"]').click();
      cy.get('[data-cy="current-medications"]').should('contain', 'Amlodipine');
      cy.get('[data-cy="allergies-section"]').should('contain', 'Shellfish');

      // Verify appointment appears in patient portal
      cy.get('[data-cy="nav-appointments"]').click();
      cy.get('[data-cy="upcoming-appointments"]').should('contain', 'Follow-up');
      cy.get('[data-cy="appointment-time"]').should('contain', '10:00');
    });

    it('handles real-time updates across multiple sessions', () => {
      // Start with doctor session
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
      cy.get('[data-cy="nav-queries"]').click();

      // Create query
      cy.get('[data-cy="create-query"]').click();
      cy.get('[data-cy="query-title"]').type('Cross-session Test Query');
      cy.get('[data-cy="query-type"]').select('Consultation');
      cy.get('[data-cy="query-priority"]').select('High');
      cy.get('[data-cy="submit-query"]').click();

      const queryId = cy.get('[data-cy="query-id"]').invoke('text');

      // Open second browser window/tab simulation
      cy.window().then((win) => {
        const newWindow = win.open('/doctor/queries', '_blank');
        cy.wrap(newWindow).as('secondWindow');
      });

      // Simulate WebSocket update from another user
      cy.window().then((win) => {
        win.postMessage({
          type: 'QUERY_UPDATED',
          payload: {
            queryId: queryId,
            status: 'In Progress',
            updatedBy: 'Dr. Johnson',
            timestamp: new Date().toISOString()
          }
        }, '*');
      });

      // Verify real-time update appears
      cy.get('[data-cy="query-status"]').should('contain', 'In Progress');
      cy.get('[data-cy="last-updated"]').should('contain', 'Dr. Johnson');
      cy.get('[data-cy="real-time-indicator"]').should('be.visible');
    });
  });

  describe('Multi-User Collaboration Workflows', () => {
    it('supports collaborative query management', () => {
      // Primary doctor creates query
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
      cy.get('[data-cy="nav-queries"]').click();
      cy.get('[data-cy="create-query"]').click();

      cy.get('[data-cy="query-title"]').type('Collaborative Cardiology Consultation');
      cy.get('[data-cy="query-type"]').select('Consultation');
      cy.get('[data-cy="assign-to-department"]').select('Cardiology');
      cy.get('[data-cy="query-description"]').type('Patient presents with chest pain, need cardiology input');
      cy.get('[data-cy="attach-patient"]').click();
      cy.get('[data-cy="patient-search"]').type('John Doe');
      cy.get('[data-cy="select-patient"]').first().click();

      cy.get('[data-cy="submit-query"]').click();
      
      const queryUrl = cy.url();
      cy.get('[data-cy="logout"]').click();

      // Cardiologist responds to query
      cy.loginAsDoctor('dr.johnson@hospital.com', 'cardioPassword123');
      cy.visit(queryUrl);

      // Add specialist response
      cy.get('[data-cy="add-response"]').click();
      cy.get('[data-cy="response-text"]').type('Reviewed case. Recommend echocardiogram and stress test.');
      cy.get('[data-cy="response-priority"]').select('High');
      cy.get('[data-cy="recommended-actions"]').type('Schedule echo within 1 week');
      cy.get('[data-cy="submit-response"]').click();

      // Update query status
      cy.get('[data-cy="update-status"]').click();
      cy.get('[data-cy="new-status"]').select('Specialist Review Complete');
      cy.get('[data-cy="status-notes"]').type('Cardiology recommendations provided');
      cy.get('[data-cy="confirm-status"]').click();

      cy.get('[data-cy="logout"]').click();

      // Original doctor sees updates
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
      cy.visit(queryUrl);

      cy.get('[data-cy="query-status"]').should('contain', 'Specialist Review Complete');
      cy.get('[data-cy="response-list"]').should('contain', 'Recommend echocardiogram');
      cy.get('[data-cy="specialist-badge"]').should('contain', 'Dr. Johnson - Cardiology');
    });

    it('manages complex appointment scheduling across departments', () => {
      // Patient requests appointment
      cy.loginAsPatient('john.doe@email.com', 'patientPassword123', 'MRN12345');
      cy.get('[data-cy="nav-appointments"]').click();
      cy.get('[data-cy="book-appointment"]').click();

      cy.get('[data-cy="select-department"]').select('Cardiology');
      cy.get('[data-cy="appointment-type"]').select('New Patient');
      cy.get('[data-cy="appointment-reason"]').type('Chest pain evaluation per primary care referral');
      cy.get('[data-cy="urgency-level"]').select('Urgent');
      cy.get('[data-cy="referral-doctor"]').type('Dr. Smith');

      cy.get('[data-cy="submit-request"]').click();
      cy.get('[data-cy="request-submitted"]').should('be.visible');

      const requestId = cy.get('[data-cy="request-id"]').invoke('text');
      cy.get('[data-cy="logout"]').click();

      // Department scheduler reviews request
      cy.loginAsStaff('scheduler@hospital.com', 'schedulerPass123');
      cy.get('[data-cy="nav-appointment-requests"]').click();
      cy.get('[data-cy="request-list"]').should('contain', 'Chest pain evaluation');

      cy.get(`[data-cy="request-${requestId}"]`).click();
      cy.get('[data-cy="request-details"]').should('be.visible');

      // Schedule appointment
      cy.get('[data-cy="schedule-appointment"]').click();
      cy.get('[data-cy="assign-provider"]').select('Dr. Johnson - Cardiology');
      cy.get('[data-cy="appointment-date"]').click();
      cy.get('[data-cy="available-slot"]').first().click();
      cy.get('[data-cy="appointment-duration"]').select('60 minutes');
      cy.get('[data-cy="room-assignment"]').select('Cardiology Suite 2');

      cy.get('[data-cy="confirm-schedule"]').click();
      cy.get('[data-cy="scheduling-success"]').should('be.visible');

      cy.get('[data-cy="logout"]').click();

      // Patient receives confirmation
      cy.loginAsPatient('john.doe@email.com', 'patientPassword123', 'MRN12345');
      cy.get('[data-cy="nav-appointments"]').click();

      cy.get('[data-cy="upcoming-appointments"]').should('contain', 'Dr. Johnson');
      cy.get('[data-cy="appointment-details"]').should('contain', 'Cardiology Suite 2');
      cy.get('[data-cy="appointment-confirmation"]').should('be.visible');
    });
  });

  describe('Data Security and Privacy Compliance', () => {
    it('enforces HIPAA-compliant access controls', () => {
      // Patient data access by authorized doctor
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="patient-search"]').type('John Doe');
      cy.get('[data-cy="search-submit"]').click();
      cy.get('[data-cy="patient-card"]').first().click();

      // Verify full access to patient data
      cy.get('[data-cy="patient-profile"]').should('be.visible');
      cy.get('[data-cy="medical-history"]').should('be.visible');
      cy.get('[data-cy="sensitive-data"]').should('be.visible');

      // Log access activity
      cy.get('[data-cy="access-log"]').should('contain', 'Dr. Smith accessed patient record');
      
      cy.get('[data-cy="logout"]').click();

      // Attempt unauthorized access
      cy.loginAsDoctor('dr.external@anotherhospital.com', 'externalPass123');
      cy.visit('/patient/john-doe-profile');

      // Verify access denied
      cy.get('[data-cy="access-denied"]').should('be.visible');
      cy.get('[data-cy="access-denied-message"]').should('contain', 'You do not have permission');
      cy.get('[data-cy="security-alert"]').should('be.visible');

      // Verify security log entry
      cy.get('[data-cy="security-incident"]').should('contain', 'Unauthorized access attempt');
    });

    it('implements proper data masking and encryption', () => {
      // Staff member with limited access
      cy.loginAsStaff('nurse@hospital.com', 'nursePassword123');
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="patient-search"]').type('John Doe');
      cy.get('[data-cy="search-submit"]').click();
      cy.get('[data-cy="patient-card"]').first().click();

      // Verify data masking for sensitive information
      cy.get('[data-cy="ssn-field"]').should('contain', '***-**-****');
      cy.get('[data-cy="insurance-id"]').should('contain', '****6789');
      cy.get('[data-cy="phone-number"]').should('contain', '***-***-4567');

      // Verify full access to clinical data
      cy.get('[data-cy="current-medications"]').should('be.visible');
      cy.get('[data-cy="allergies-section"]').should('be.visible');
      cy.get('[data-cy="vital-signs"]').should('be.visible');

      // Test export restrictions
      cy.get('[data-cy="export-data"]').click();
      cy.get('[data-cy="export-options"]').should('not.contain', 'Full Patient Record');
      cy.get('[data-cy="export-options"]').should('contain', 'Clinical Summary');
    });

    it('maintains comprehensive audit trails', () => {
      // Generate various audit events
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
      
      // Patient record access
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="patient-search"]').type('Jane Smith');
      cy.get('[data-cy="search-submit"]').click();
      cy.get('[data-cy="patient-card"]').first().click();

      // Medical record modification
      cy.get('[data-cy="edit-medical-info"]').click();
      cy.get('[data-cy="add-medication"]').click();
      cy.get('[data-cy="medication-name"]').type('Aspirin');
      cy.get('[data-cy="save-medical-info"]').click();

      // Data export
      cy.get('[data-cy="export-data"]').click();
      cy.get('[data-cy="export-format"]').select('PDF');
      cy.get('[data-cy="confirm-export"]').click();

      cy.get('[data-cy="logout"]').click();

      // Admin reviews audit logs
      cy.loginAsAdmin('admin@hospital.com', 'adminSecurePass123');
      cy.get('[data-cy="nav-audit-logs"]').click();

      // Verify comprehensive audit trail
      cy.get('[data-cy="audit-log-table"]').should('be.visible');
      cy.get('[data-cy="audit-entry"]').should('contain', 'Patient record accessed');
      cy.get('[data-cy="audit-entry"]').should('contain', 'Medical information updated');
      cy.get('[data-cy="audit-entry"]').should('contain', 'Data exported');

      // Check audit details
      cy.get('[data-cy="audit-entry"]').first().click();
      cy.get('[data-cy="audit-details"]').should('contain', 'Dr. Smith');
      cy.get('[data-cy="audit-timestamp"]').should('be.visible');
      cy.get('[data-cy="audit-ip-address"]').should('be.visible');
      cy.get('[data-cy="audit-user-agent"]').should('be.visible');
    });
  });

  describe('System Performance and Scalability', () => {
    it('handles high concurrent user load', () => {
      // Simulate multiple concurrent sessions
      const userSessions = [
        { email: 'dr.smith@hospital.com', password: 'securePassword123', role: 'doctor' },
        { email: 'dr.johnson@hospital.com', password: 'cardioPassword123', role: 'doctor' },
        { email: 'nurse1@hospital.com', password: 'nursePass123', role: 'nurse' },
        { email: 'scheduler@hospital.com', password: 'schedulerPass123', role: 'staff' }
      ];

      // Login multiple users and perform concurrent operations
      userSessions.forEach((user, index) => {
        cy.window().then((win) => {
          const newWindow = win.open('/', `session_${index}`);
          
          // Login in new session
          newWindow.document.querySelector('[data-cy="login-email"]').value = user.email;
          newWindow.document.querySelector('[data-cy="login-password"]').value = user.password;
          newWindow.document.querySelector('[data-cy="login-submit"]').click();
        });
      });

      // Verify system performance under load
      cy.get('[data-cy="performance-metrics"]').should('be.visible');
      cy.get('[data-cy="response-time"]').invoke('text').then((responseTime) => {
        expect(parseInt(responseTime)).to.be.lessThan(2000); // Response time under 2 seconds
      });

      cy.get('[data-cy="concurrent-users"]').should('contain', '4 active sessions');
      cy.get('[data-cy="system-status"]').should('contain', 'Healthy');
    });

    it('handles large dataset operations efficiently', () => {
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');

      // Query large patient dataset
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="view-all-patients"]').click();
      cy.get('[data-cy="results-per-page"]').select('100');

      // Verify pagination and loading performance
      cy.get('[data-cy="patient-list-loading"]').should('be.visible');
      cy.get('[data-cy="patient-list"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="patient-card"]').should('have.length', 100);

      // Test search performance on large dataset
      const searchStartTime = Date.now();
      cy.get('[data-cy="patient-search"]').type('Smith');
      cy.get('[data-cy="search-submit"]').click();
      
      cy.get('[data-cy="search-results"]').should('be.visible').then(() => {
        const searchEndTime = Date.now();
        expect(searchEndTime - searchStartTime).to.be.lessThan(1500);
      });

      // Test advanced filtering
      cy.get('[data-cy="advanced-filters"]').click();
      cy.get('[data-cy="filter-department"]').select('Cardiology');
      cy.get('[data-cy="filter-age-range"]').select('40-60');
      cy.get('[data-cy="filter-insurance"]').select('Blue Cross');
      cy.get('[data-cy="apply-filters"]').click();

      cy.get('[data-cy="filtered-results"]').should('be.visible');
      cy.get('[data-cy="filter-performance"]').should('contain', 'Results in');
    });
  });

  describe('Integration with External Systems', () => {
    it('integrates with external laboratory systems', () => {
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="patient-search"]').type('John Doe');
      cy.get('[data-cy="search-submit"]').click();
      cy.get('[data-cy="patient-card"]').first().click();

      // Order laboratory tests
      cy.get('[data-cy="order-labs"]').click();
      cy.get('[data-cy="lab-order-form"]').should('be.visible');

      cy.get('[data-cy="lab-test-type"]').select('Complete Blood Count');
      cy.get('[data-cy="lab-priority"]').select('Routine');
      cy.get('[data-cy="clinical-notes"]').type('Annual screening bloodwork');
      cy.get('[data-cy="lab-facility"]').select('Quest Diagnostics');

      cy.get('[data-cy="submit-lab-order"]').click();

      // Verify order submission to external system
      cy.get('[data-cy="lab-order-confirmation"]').should('be.visible');
      cy.get('[data-cy="external-order-id"]').should('be.visible');
      cy.get('[data-cy="lab-status"]').should('contain', 'Order Submitted');

      // Simulate external system callback with results
      cy.intercept('POST', '/api/lab-results/callback', {
        orderId: 'LAB123456',
        results: {
          hemoglobin: '14.2 g/dL',
          hematocrit: '42.1%',
          whiteBloodCells: '7,200/μL',
          platelets: '250,000/μL'
        },
        status: 'Complete'
      }).as('labResults');

      // Verify results integration
      cy.get('[data-cy="refresh-lab-results"]').click();
      cy.wait('@labResults');

      cy.get('[data-cy="lab-results"]').should('be.visible');
      cy.get('[data-cy="result-hemoglobin"]').should('contain', '14.2 g/dL');
      cy.get('[data-cy="result-status"]').should('contain', 'Complete');
    });

    it('synchronizes with pharmacy systems', () => {
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="patient-search"]').type('Jane Smith');
      cy.get('[data-cy="search-submit"]').click();
      cy.get('[data-cy="patient-card"]').first().click();

      // Prescribe medication
      cy.get('[data-cy="prescribe-medication"]').click();
      cy.get('[data-cy="prescription-form"]').should('be.visible');

      cy.get('[data-cy="medication-search"]').type('Lisinopril');
      cy.get('[data-cy="medication-select"]').first().click();
      cy.get('[data-cy="dosage"]').select('10mg');
      cy.get('[data-cy="frequency"]').select('Daily');
      cy.get('[data-cy="quantity"]').type('30');
      cy.get('[data-cy="refills"]').select('2');
      cy.get('[data-cy="patient-pharmacy"]').select('CVS Pharmacy - Main St');

      cy.get('[data-cy="submit-prescription"]').click();

      // Verify prescription sent to pharmacy
      cy.get('[data-cy="prescription-sent"]').should('be.visible');
      cy.get('[data-cy="pharmacy-confirmation"]').should('contain', 'Sent to CVS Pharmacy');
      cy.get('[data-cy="prescription-number"]').should('be.visible');

      // Check prescription status from pharmacy system
      cy.get('[data-cy="check-pharmacy-status"]').click();
      cy.get('[data-cy="pharmacy-status"]').should('contain', 'Ready for Pickup');
      cy.get('[data-cy="pickup-notification"]').should('be.visible');
    });
  });

  describe('Disaster Recovery and Business Continuity', () => {
    it('handles system failover gracefully', () => {
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');

      // Simulate primary system failure
      cy.intercept('GET', '/api/**', { forceNetworkError: true }).as('systemFailure');
      
      cy.get('[data-cy="nav-patients"]').click();
      cy.wait('@systemFailure');

      // Verify failover to backup system
      cy.get('[data-cy="failover-notice"]').should('be.visible');
      cy.get('[data-cy="backup-system-indicator"]').should('contain', 'Running on backup');

      // Verify core functionality still available
      cy.get('[data-cy="emergency-patient-lookup"]').should('be.visible');
      cy.get('[data-cy="critical-alerts"]').should('be.visible');
      cy.get('[data-cy="offline-mode"]').should('be.visible');

      // Test emergency patient access
      cy.get('[data-cy="emergency-patient-lookup"]').click();
      cy.get('[data-cy="emergency-search"]').type('John Doe');
      cy.get('[data-cy="emergency-search-submit"]').click();

      cy.get('[data-cy="cached-patient-data"]').should('be.visible');
      cy.get('[data-cy="limited-functionality-notice"]').should('be.visible');
    });

    it('recovers data after system restoration', () => {
      // Simulate data entry during outage
      cy.loginAsDoctor('dr.smith@hospital.com', 'securePassword123');
      cy.get('[data-cy="offline-mode"]').click();

      // Enter data in offline mode
      cy.get('[data-cy="offline-note-entry"]').click();
      cy.get('[data-cy="patient-id"]').type('MRN12345');
      cy.get('[data-cy="clinical-notes"]').type('Patient seen during system outage. Vital signs stable.');
      cy.get('[data-cy="save-offline"]').click();

      cy.get('[data-cy="offline-data-saved"]').should('contain', 'Data saved locally');

      // Simulate system restoration
      cy.intercept('GET', '/api/**', { fixture: 'api-responses.json' }).as('systemRestore');
      cy.get('[data-cy="sync-offline-data"]').click();
      cy.wait('@systemRestore');

      // Verify data synchronization
      cy.get('[data-cy="sync-success"]').should('be.visible');
      cy.get('[data-cy="sync-summary"]').should('contain', '1 note synchronized');
      cy.get('[data-cy="system-status"]').should('contain', 'Fully operational');

      // Verify data integrity
      cy.get('[data-cy="nav-patients"]').click();
      cy.get('[data-cy="patient-search"]').type('MRN12345');
      cy.get('[data-cy="search-submit"]').click();
      cy.get('[data-cy="patient-card"]').first().click();

      cy.get('[data-cy="recent-notes"]').should('contain', 'Patient seen during system outage');
      cy.get('[data-cy="note-timestamp"]').should('be.visible');
    });
  });
});