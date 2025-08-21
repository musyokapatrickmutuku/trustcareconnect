describe('Patient Complete Workflow', () => {
  beforeEach(() => {
    // Reset database and set up test data
    cy.task('db:seed');
    cy.visit('/');
  });

  describe('Patient Authentication and Portal Access', () => {
    it('completes full patient login and portal access', () => {
      // Switch to patient login
      cy.get('[data-cy="patient-login-tab"]').click();

      // Login as patient
      cy.get('[data-cy="patient-email"]').type('john.doe@email.com');
      cy.get('[data-cy="patient-password"]').type('patientPassword123');
      cy.get('[data-cy="patient-mrn"]').type('MRN12345');
      cy.get('[data-cy="patient-login-submit"]').click();

      // Verify successful login and portal load
      cy.url().should('include', '/patient/portal');
      cy.get('[data-cy="patient-portal"]').should('be.visible');
      cy.get('[data-cy="welcome-message"]').should('contain', 'John Doe');

      // Verify portal widgets load
      cy.get('[data-cy="upcoming-appointments-widget"]').should('be.visible');
      cy.get('[data-cy="recent-messages-widget"]').should('be.visible');
      cy.get('[data-cy="health-summary-widget"]').should('be.visible');
      cy.get('[data-cy="medication-reminders-widget"]').should('be.visible');
    });

    it('handles patient registration flow', () => {
      cy.get('[data-cy="patient-registration-link"]').click();
      cy.url().should('include', '/patient/register');

      // Fill registration form
      cy.get('[data-cy="reg-first-name"]').type('Jane');
      cy.get('[data-cy="reg-last-name"]').type('Smith');
      cy.get('[data-cy="reg-email"]').type('jane.smith@email.com');
      cy.get('[data-cy="reg-phone"]').type('555-123-4567');
      cy.get('[data-cy="reg-dob"]').type('1990-05-15');
      cy.get('[data-cy="reg-password"]').type('newPatientPass123');
      cy.get('[data-cy="reg-confirm-password"]').type('newPatientPass123');

      // Medical information
      cy.get('[data-cy="reg-insurance-provider"]').type('Blue Cross Blue Shield');
      cy.get('[data-cy="reg-insurance-id"]').type('BC123456789');
      cy.get('[data-cy="reg-emergency-contact"]').type('John Smith');
      cy.get('[data-cy="reg-emergency-phone"]').type('555-987-6543');

      // Accept terms and submit
      cy.get('[data-cy="accept-terms"]').check();
      cy.get('[data-cy="accept-privacy"]').check();
      cy.get('[data-cy="submit-registration"]').click();

      // Verify registration success
      cy.get('[data-cy="registration-success"]').should('be.visible');
      cy.get('[data-cy="verification-message"]').should('contain', 'Please check your email');
    });
  });

  describe('Medical Records and Health Information', () => {
    beforeEach(() => {
      cy.loginAsPatient('john.doe@email.com', 'patientPassword123', 'MRN12345');
    });

    it('views comprehensive medical records', () => {
      // Navigate to medical records
      cy.get('[data-cy="nav-medical-records"]').click();
      cy.url().should('include', '/patient/medical-records');

      // Verify medical record sections
      cy.get('[data-cy="basic-information"]').should('be.visible');
      cy.get('[data-cy="medical-history"]').should('be.visible');
      cy.get('[data-cy="current-medications"]').should('be.visible');
      cy.get('[data-cy="allergies-section"]').should('be.visible');
      cy.get('[data-cy="immunizations"]').should('be.visible');
      cy.get('[data-cy="lab-results"]').should('be.visible');

      // Test medical history details
      cy.get('[data-cy="medical-history"]').within(() => {
        cy.get('[data-cy="condition-item"]').should('have.length.at.least', 1);
        cy.get('[data-cy="condition-date"]').should('be.visible');
        cy.get('[data-cy="condition-status"]').should('be.visible');
      });

      // Test medication information
      cy.get('[data-cy="current-medications"]').within(() => {
        cy.get('[data-cy="medication-item"]').should('have.length.at.least', 1);
        cy.get('[data-cy="medication-name"]').should('be.visible');
        cy.get('[data-cy="medication-dosage"]').should('be.visible');
        cy.get('[data-cy="medication-frequency"]').should('be.visible');
      });
    });

    it('downloads and shares medical records', () => {
      cy.get('[data-cy="nav-medical-records"]').click();

      // Download medical summary
      cy.get('[data-cy="download-records"]').click();
      cy.get('[data-cy="download-options"]').should('be.visible');
      cy.get('[data-cy="download-format"]').select('PDF');
      cy.get('[data-cy="date-range-start"]').type('2024-01-01');
      cy.get('[data-cy="date-range-end"]').type('2024-12-31');
      cy.get('[data-cy="confirm-download"]').click();

      // Verify download preparation
      cy.get('[data-cy="download-progress"]').should('be.visible');
      cy.get('[data-cy="download-link"]', { timeout: 10000 }).should('be.visible');

      // Share records with healthcare provider
      cy.get('[data-cy="share-records"]').click();
      cy.get('[data-cy="share-modal"]').should('be.visible');
      cy.get('[data-cy="provider-email"]').type('dr.newdoctor@hospital.com');
      cy.get('[data-cy="share-purpose"]').type('Second opinion consultation');
      cy.get('[data-cy="access-duration"]').select('30 days');
      cy.get('[data-cy="confirm-share"]').click();

      cy.get('[data-cy="share-success"]').should('contain', 'Records shared successfully');
    });

    it('manages health tracking and vitals', () => {
      cy.get('[data-cy="nav-health-tracking"]').click();
      cy.url().should('include', '/patient/health-tracking');

      // Add new vital signs
      cy.get('[data-cy="add-vitals"]').click();
      cy.get('[data-cy="vitals-form"]').should('be.visible');

      cy.get('[data-cy="blood-pressure-systolic"]').type('120');
      cy.get('[data-cy="blood-pressure-diastolic"]').type('80');
      cy.get('[data-cy="heart-rate"]').type('72');
      cy.get('[data-cy="weight"]').type('165');
      cy.get('[data-cy="temperature"]').type('98.6');
      cy.get('[data-cy="measurement-date"]').type('2024-03-15');
      cy.get('[data-cy="measurement-time"]').type('09:00');

      cy.get('[data-cy="save-vitals"]').click();

      // Verify vitals saved and displayed
      cy.get('[data-cy="vitals-list"]').should('contain', '120/80');
      cy.get('[data-cy="vitals-chart"]').should('be.visible');

      // Add symptom tracking
      cy.get('[data-cy="add-symptoms"]').click();
      cy.get('[data-cy="symptom-type"]').select('Pain');
      cy.get('[data-cy="symptom-severity"]').select('Moderate');
      cy.get('[data-cy="symptom-location"]').type('Lower back');
      cy.get('[data-cy="symptom-duration"]').type('2 hours');
      cy.get('[data-cy="symptom-notes"]').type('Started after lifting heavy box');

      cy.get('[data-cy="save-symptoms"]').click();

      cy.get('[data-cy="symptoms-log"]').should('contain', 'Lower back');
    });
  });

  describe('Appointment Management', () => {
    beforeEach(() => {
      cy.loginAsPatient('john.doe@email.com', 'patientPassword123', 'MRN12345');
    });

    it('books new appointment with healthcare provider', () => {
      cy.get('[data-cy="nav-appointments"]').click();
      cy.url().should('include', '/patient/appointments');

      // Start appointment booking
      cy.get('[data-cy="book-appointment"]').click();
      cy.get('[data-cy="appointment-booking"]').should('be.visible');

      // Select provider and department
      cy.get('[data-cy="select-department"]').select('Cardiology');
      cy.get('[data-cy="select-provider"]').select('Dr. Sarah Johnson');

      // Select appointment type and reason
      cy.get('[data-cy="appointment-type"]').select('Consultation');
      cy.get('[data-cy="appointment-reason"]').type('Chest pain evaluation');
      cy.get('[data-cy="appointment-urgency"]').select('Routine');

      // Select date and time
      cy.get('[data-cy="appointment-date"]').click();
      cy.get('[data-cy="calendar-next-month"]').click();
      cy.get('[data-cy="available-date"]').first().click();
      cy.get('[data-cy="available-time"]').first().click();

      // Add additional information
      cy.get('[data-cy="current-symptoms"]').type('Occasional chest pain during exercise');
      cy.get('[data-cy="preferred-language"]').select('English');
      cy.get('[data-cy="transportation-needed"]').check();

      cy.get('[data-cy="confirm-booking"]').click();

      // Verify appointment booked
      cy.get('[data-cy="booking-success"]').should('be.visible');
      cy.get('[data-cy="confirmation-number"]').should('be.visible');
      cy.get('[data-cy="appointment-details"]').should('contain', 'Dr. Sarah Johnson');
    });

    it('reschedules existing appointment', () => {
      cy.get('[data-cy="nav-appointments"]').click();

      // Find existing appointment
      cy.get('[data-cy="upcoming-appointments"]').within(() => {
        cy.get('[data-cy="appointment-card"]').first().within(() => {
          cy.get('[data-cy="reschedule-appointment"]').click();
        });
      });

      // Reschedule form
      cy.get('[data-cy="reschedule-modal"]').should('be.visible');
      cy.get('[data-cy="reschedule-reason"]').select('Schedule conflict');
      cy.get('[data-cy="new-date"]').click();
      cy.get('[data-cy="available-date"]').eq(2).click();
      cy.get('[data-cy="new-time"]').select('14:00');

      cy.get('[data-cy="confirm-reschedule"]').click();

      // Verify reschedule success
      cy.get('[data-cy="reschedule-success"]').should('contain', 'Appointment rescheduled');
      cy.get('[data-cy="upcoming-appointments"]').should('contain', '14:00');
    });

    it('cancels appointment with proper notification', () => {
      cy.get('[data-cy="nav-appointments"]').click();

      // Cancel appointment
      cy.get('[data-cy="upcoming-appointments"]').within(() => {
        cy.get('[data-cy="appointment-card"]').first().within(() => {
          cy.get('[data-cy="cancel-appointment"]').click();
        });
      });

      // Cancellation confirmation
      cy.get('[data-cy="cancel-modal"]').should('be.visible');
      cy.get('[data-cy="cancellation-reason"]').select('Personal emergency');
      cy.get('[data-cy="cancellation-notes"]').type('Unable to attend due to family emergency');
      cy.get('[data-cy="confirm-cancellation"]').click();

      // Verify cancellation
      cy.get('[data-cy="cancellation-success"]').should('be.visible');
      cy.get('[data-cy="cancelled-appointments"]').should('contain', 'Cancelled');
    });
  });

  describe('Messaging and Communication', () => {
    beforeEach(() => {
      cy.loginAsPatient('john.doe@email.com', 'patientPassword123', 'MRN12345');
    });

    it('sends message to healthcare provider', () => {
      cy.get('[data-cy="nav-messages"]').click();
      cy.url().should('include', '/patient/messages');

      // Compose new message
      cy.get('[data-cy="compose-message"]').click();
      cy.get('[data-cy="message-form"]').should('be.visible');

      cy.get('[data-cy="message-recipient"]').select('Dr. Smith - Primary Care');
      cy.get('[data-cy="message-subject"]').type('Question about medication side effects');
      cy.get('[data-cy="message-priority"]').select('Normal');
      cy.get('[data-cy="message-content"]').type('I\'ve been experiencing mild nausea since starting the new medication. Is this normal?');

      // Attach file
      cy.get('[data-cy="attach-file"]').selectFile('cypress/fixtures/test-document.pdf');
      cy.get('[data-cy="attachment-preview"]').should('contain', 'test-document.pdf');

      cy.get('[data-cy="send-message"]').click();

      // Verify message sent
      cy.get('[data-cy="message-sent"]').should('contain', 'Message sent successfully');
      cy.get('[data-cy="sent-messages"]').should('contain', 'Question about medication side effects');
    });

    it('participates in secure messaging thread', () => {
      cy.get('[data-cy="nav-messages"]').click();

      // Open existing message thread
      cy.get('[data-cy="message-list"]').within(() => {
        cy.get('[data-cy="message-thread"]').first().click();
      });

      // View message thread
      cy.get('[data-cy="message-thread-view"]').should('be.visible');
      cy.get('[data-cy="message-history"]').should('be.visible');

      // Reply to message
      cy.get('[data-cy="reply-message"]').click();
      cy.get('[data-cy="reply-content"]').type('Thank you for the quick response. The symptoms have improved.');
      cy.get('[data-cy="send-reply"]').click();

      // Verify reply sent
      cy.get('[data-cy="message-history"]').should('contain', 'Thank you for the quick response');
      cy.get('[data-cy="message-timestamp"]').should('be.visible');
    });

    it('receives and responds to appointment reminders', () => {
      // Simulate appointment reminder notification
      cy.window().then((win) => {
        win.postMessage({
          type: 'APPOINTMENT_REMINDER',
          payload: {
            appointmentId: 'apt-123',
            date: '2024-03-20',
            time: '10:00 AM',
            provider: 'Dr. Johnson'
          }
        }, '*');
      });

      // Verify reminder notification
      cy.get('[data-cy="reminder-notification"]').should('be.visible');
      cy.get('[data-cy="reminder-content"]').should('contain', 'Dr. Johnson');
      cy.get('[data-cy="reminder-date"]').should('contain', '2024-03-20');

      // Confirm attendance
      cy.get('[data-cy="confirm-attendance"]').click();
      cy.get('[data-cy="attendance-confirmed"]').should('contain', 'Attendance confirmed');
    });
  });

  describe('Prescription and Medication Management', () => {
    beforeEach(() => {
      cy.loginAsPatient('john.doe@email.com', 'patientPassword123', 'MRN12345');
    });

    it('views and manages current prescriptions', () => {
      cy.get('[data-cy="nav-prescriptions"]').click();
      cy.url().should('include', '/patient/prescriptions');

      // View current prescriptions
      cy.get('[data-cy="current-prescriptions"]').should('be.visible');
      cy.get('[data-cy="prescription-card"]').should('have.length.at.least', 1);

      // Check prescription details
      cy.get('[data-cy="prescription-card"]').first().within(() => {
        cy.get('[data-cy="medication-name"]').should('be.visible');
        cy.get('[data-cy="dosage-info"]').should('be.visible');
        cy.get('[data-cy="refills-remaining"]').should('be.visible');
        cy.get('[data-cy="prescribing-doctor"]').should('be.visible');
      });

      // Request prescription refill
      cy.get('[data-cy="prescription-card"]').first().within(() => {
        cy.get('[data-cy="request-refill"]').click();
      });

      cy.get('[data-cy="refill-modal"]').should('be.visible');
      cy.get('[data-cy="pharmacy-selection"]').select('CVS Pharmacy - Main St');
      cy.get('[data-cy="delivery-option"]').select('Pickup');
      cy.get('[data-cy="refill-notes"]').type('Need refill for upcoming travel');
      cy.get('[data-cy="confirm-refill"]').click();

      // Verify refill request
      cy.get('[data-cy="refill-success"]').should('contain', 'Refill request submitted');
      cy.get('[data-cy="prescription-status"]').should('contain', 'Refill Requested');
    });

    it('manages medication reminders and adherence', () => {
      cy.get('[data-cy="nav-prescriptions"]').click();

      // Set up medication reminder
      cy.get('[data-cy="medication-reminders"]').click();
      cy.get('[data-cy="add-reminder"]').click();

      cy.get('[data-cy="reminder-medication"]').select('Lisinopril 10mg');
      cy.get('[data-cy="reminder-frequency"]').select('Daily');
      cy.get('[data-cy="reminder-times"]').type('08:00');
      cy.get('[data-cy="reminder-method"]').check('Push notification');
      cy.get('[data-cy="reminder-method"]').check('SMS');

      cy.get('[data-cy="save-reminder"]').click();

      // Verify reminder created
      cy.get('[data-cy="active-reminders"]').should('contain', 'Lisinopril 10mg');
      cy.get('[data-cy="reminder-schedule"]').should('contain', '08:00');

      // Log medication taken
      cy.get('[data-cy="log-medication"]').click();
      cy.get('[data-cy="taken-medication"]').select('Lisinopril 10mg');
      cy.get('[data-cy="taken-time"]').type('08:15');
      cy.get('[data-cy="taken-date"]').type('2024-03-15');
      cy.get('[data-cy="side-effects"]').type('None');

      cy.get('[data-cy="log-taken"]').click();

      // Verify adherence tracking
      cy.get('[data-cy="adherence-chart"]').should('be.visible');
      cy.get('[data-cy="adherence-percentage"]').should('be.visible');
    });
  });

  describe('Health Insurance and Billing', () => {
    beforeEach(() => {
      cy.loginAsPatient('john.doe@email.com', 'patientPassword123', 'MRN12345');
    });

    it('views billing statements and payment history', () => {
      cy.get('[data-cy="nav-billing"]').click();
      cy.url().should('include', '/patient/billing');

      // View billing overview
      cy.get('[data-cy="billing-overview"]').should('be.visible');
      cy.get('[data-cy="account-balance"]').should('be.visible');
      cy.get('[data-cy="insurance-coverage"]').should('be.visible');

      // View detailed statements
      cy.get('[data-cy="billing-statements"]').should('be.visible');
      cy.get('[data-cy="statement-item"]').should('have.length.at.least', 1);

      // Check statement details
      cy.get('[data-cy="statement-item"]').first().click();
      cy.get('[data-cy="statement-details"]').should('be.visible');
      cy.get('[data-cy="service-details"]').should('be.visible');
      cy.get('[data-cy="insurance-applied"]').should('be.visible');
      cy.get('[data-cy="patient-responsibility"]').should('be.visible');
    });

    it('makes online payment for outstanding balance', () => {
      cy.get('[data-cy="nav-billing"]').click();

      // Make payment
      cy.get('[data-cy="make-payment"]').click();
      cy.get('[data-cy="payment-form"]').should('be.visible');

      cy.get('[data-cy="payment-amount"]').type('150.00');
      cy.get('[data-cy="payment-method"]').select('Credit Card');
      cy.get('[data-cy="card-number"]').type('4111111111111111');
      cy.get('[data-cy="expiry-date"]').type('12/25');
      cy.get('[data-cy="cvv"]').type('123');
      cy.get('[data-cy="cardholder-name"]').type('John Doe');

      cy.get('[data-cy="billing-address-same"]').check();
      cy.get('[data-cy="save-payment-method"]').check();

      cy.get('[data-cy="submit-payment"]').click();

      // Verify payment processing
      cy.get('[data-cy="payment-processing"]').should('be.visible');
      cy.get('[data-cy="payment-confirmation"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy="confirmation-number"]').should('be.visible');
    });

    it('updates insurance information', () => {
      cy.get('[data-cy="nav-profile"]').click();
      cy.get('[data-cy="insurance-tab"]').click();

      // Update insurance details
      cy.get('[data-cy="edit-insurance"]').click();
      cy.get('[data-cy="insurance-form"]').should('be.visible');

      cy.get('[data-cy="insurance-provider"]').clear().type('Aetna Better Health');
      cy.get('[data-cy="policy-number"]').clear().type('AET123456789');
      cy.get('[data-cy="group-number"]').clear().type('GRP987654');
      cy.get('[data-cy="effective-date"]').type('2024-01-01');

      // Upload insurance card
      cy.get('[data-cy="upload-insurance-card"]').selectFile('cypress/fixtures/insurance-card.jpg');
      cy.get('[data-cy="card-preview"]').should('be.visible');

      cy.get('[data-cy="save-insurance"]').click();

      // Verify insurance updated
      cy.get('[data-cy="insurance-success"]').should('contain', 'Insurance information updated');
      cy.get('[data-cy="current-insurance"]').should('contain', 'Aetna Better Health');
    });
  });

  describe('Emergency and Urgent Care', () => {
    beforeEach(() => {
      cy.loginAsPatient('john.doe@email.com', 'patientPassword123', 'MRN12345');
    });

    it('accesses emergency contact information', () => {
      cy.get('[data-cy="emergency-contact"]').click();
      cy.get('[data-cy="emergency-info"]').should('be.visible');

      // Verify emergency contact details
      cy.get('[data-cy="emergency-phone"]').should('be.visible');
      cy.get('[data-cy="poison-control"]').should('be.visible');
      cy.get('[data-cy="nearest-hospital"]').should('be.visible');
      cy.get('[data-cy="urgent-care-locations"]').should('be.visible');

      // Test emergency call functionality
      cy.get('[data-cy="call-emergency"]').should('have.attr', 'href', 'tel:911');
      cy.get('[data-cy="call-primary-care"]').should('be.visible');
    });

    it('initiates urgent care request', () => {
      cy.get('[data-cy="urgent-care-request"]').click();
      cy.get('[data-cy="urgent-care-form"]').should('be.visible');

      // Fill urgent care details
      cy.get('[data-cy="urgent-symptoms"]').type('Severe headache and dizziness');
      cy.get('[data-cy="symptom-duration"]').select('2-4 hours');
      cy.get('[data-cy="pain-level"]').select('8');
      cy.get('[data-cy="current-medications"]').type('Lisinopril, Metformin');
      cy.get('[data-cy="allergies"]').type('Penicillin');

      cy.get('[data-cy="preferred-contact"]').select('Phone call');
      cy.get('[data-cy="emergency-contact-notify"]').check();

      cy.get('[data-cy="submit-urgent-request"]').click();

      // Verify urgent care request submitted
      cy.get('[data-cy="urgent-care-confirmation"]').should('be.visible');
      cy.get('[data-cy="response-time"]').should('contain', 'within 15 minutes');
      cy.get('[data-cy="reference-number"]').should('be.visible');
    });
  });

  describe('Mobile App Features', () => {
    beforeEach(() => {
      cy.loginAsPatient('john.doe@email.com', 'patientPassword123', 'MRN12345');
      cy.viewport('iphone-x');
    });

    it('works seamlessly on mobile devices', () => {
      // Verify mobile-optimized interface
      cy.get('[data-cy="mobile-nav"]').should('be.visible');
      cy.get('[data-cy="quick-actions"]').should('be.visible');

      // Test mobile navigation
      cy.get('[data-cy="mobile-menu"]').click();
      cy.get('[data-cy="mobile-nav-menu"]').should('be.visible');

      // Quick access to common features
      cy.get('[data-cy="quick-book-appointment"]').should('be.visible');
      cy.get('[data-cy="quick-view-records"]').should('be.visible');
      cy.get('[data-cy="quick-emergency"]').should('be.visible');

      // Test touch-friendly interactions
      cy.get('[data-cy="quick-book-appointment"]').click();
      cy.get('[data-cy="appointment-booking"]').should('be.visible');
    });

    it('supports offline functionality', () => {
      // View cached medical records offline
      cy.window().then((win) => {
        // Simulate offline mode
        cy.wrap(win).invoke('addEventListener', 'offline', () => {});
      });

      cy.get('[data-cy="nav-medical-records"]').click();
      cy.get('[data-cy="offline-indicator"]').should('be.visible');
      cy.get('[data-cy="cached-records"]').should('be.visible');

      // Verify limited functionality message
      cy.get('[data-cy="offline-features"]').should('contain', 'Limited features available offline');
    });
  });
});