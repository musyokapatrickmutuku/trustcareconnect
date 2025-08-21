// Custom Cypress commands for healthcare application testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login as a doctor
       * @param email Doctor's email address
       * @param password Doctor's password
       */
      loginAsDoctor(email: string, password: string): Chainable<void>;

      /**
       * Custom command to login as a patient
       * @param email Patient's email address
       * @param password Patient's password
       * @param mrn Medical record number
       */
      loginAsPatient(email: string, password: string, mrn: string): Chainable<void>;

      /**
       * Custom command to login as staff member
       * @param email Staff email address
       * @param password Staff password
       */
      loginAsStaff(email: string, password: string): Chainable<void>;

      /**
       * Custom command to login as admin
       * @param email Admin email address
       * @param password Admin password
       */
      loginAsAdmin(email: string, password: string): Chainable<void>;

      /**
       * Custom command to seed database with test data
       */
      seedDatabase(): Chainable<void>;

      /**
       * Custom command to clear all application data
       */
      clearApplicationData(): Chainable<void>;

      /**
       * Custom command to simulate WebSocket connection
       */
      mockWebSocket(): Chainable<void>;

      /**
       * Custom command to verify HIPAA compliance indicators
       */
      verifyHipaaCompliance(): Chainable<void>;

      /**
       * Custom command to check accessibility compliance
       */
      checkA11y(): Chainable<void>;

      /**
       * Custom command to measure page performance
       */
      measurePerformance(): Chainable<void>;

      /**
       * Custom command to handle mobile viewport testing
       */
      setMobileViewport(): Chainable<void>;

      /**
       * Custom command to simulate offline mode
       */
      goOffline(): Chainable<void>;

      /**
       * Custom command to restore online mode
       */
      goOnline(): Chainable<void>;
    }
  }
}

// Login as doctor
Cypress.Commands.add('loginAsDoctor', (email: string, password: string) => {
  cy.visit('/');
  cy.get('[data-cy="login-email"]').type(email);
  cy.get('[data-cy="login-password"]').type(password);
  cy.get('[data-cy="login-submit"]').click();
  
  // Wait for successful login redirect
  cy.url().should('include', '/doctor');
  cy.get('[data-cy="doctor-dashboard"]').should('be.visible');
  
  // Verify authentication token is stored
  cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');
});

// Login as patient
Cypress.Commands.add('loginAsPatient', (email: string, password: string, mrn: string) => {
  cy.visit('/');
  cy.get('[data-cy="patient-login-tab"]').click();
  cy.get('[data-cy="patient-email"]').type(email);
  cy.get('[data-cy="patient-password"]').type(password);
  cy.get('[data-cy="patient-mrn"]').type(mrn);
  cy.get('[data-cy="patient-login-submit"]').click();
  
  // Wait for successful login redirect
  cy.url().should('include', '/patient');
  cy.get('[data-cy="patient-portal"]').should('be.visible');
  
  // Verify authentication token is stored
  cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');
});

// Login as staff member
Cypress.Commands.add('loginAsStaff', (email: string, password: string) => {
  cy.visit('/');
  cy.get('[data-cy="staff-login-tab"]').click();
  cy.get('[data-cy="staff-email"]').type(email);
  cy.get('[data-cy="staff-password"]').type(password);
  cy.get('[data-cy="staff-login-submit"]').click();
  
  // Wait for successful login redirect
  cy.url().should('include', '/staff');
  cy.get('[data-cy="staff-dashboard"]').should('be.visible');
  
  // Verify authentication token is stored
  cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');
});

// Login as admin
Cypress.Commands.add('loginAsAdmin', (email: string, password: string) => {
  cy.visit('/');
  cy.get('[data-cy="admin-login-tab"]').click();
  cy.get('[data-cy="admin-email"]').type(email);
  cy.get('[data-cy="admin-password"]').type(password);
  cy.get('[data-cy="admin-login-submit"]').click();
  
  // Wait for successful login redirect
  cy.url().should('include', '/admin');
  cy.get('[data-cy="admin-dashboard"]').should('be.visible');
  
  // Verify authentication token is stored
  cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');
});

// Seed database with test data
Cypress.Commands.add('seedDatabase', () => {
  cy.task('db:seed');
  
  // Verify seeding completed successfully
  cy.request('GET', '/api/health/db-status').then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.seeded).to.be.true;
  });
});

// Clear all application data
Cypress.Commands.add('clearApplicationData', () => {
  // Clear localStorage
  cy.clearLocalStorage();
  
  // Clear sessionStorage
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
  
  // Clear cookies
  cy.clearCookies();
  
  // Clear database
  cy.task('db:clear');
  
  // Clear IndexedDB
  cy.window().then((win) => {
    if (win.indexedDB) {
      win.indexedDB.databases().then((databases) => {
        databases.forEach((db) => {
          win.indexedDB.deleteDatabase(db.name);
        });
      });
    }
  });
});

// Mock WebSocket connection
Cypress.Commands.add('mockWebSocket', () => {
  cy.window().then((win) => {
    const mockWS = {
      send: cy.stub().as('wsSend'),
      close: cy.stub().as('wsClose'),
      addEventListener: cy.stub().as('wsAddEventListener'),
      removeEventListener: cy.stub().as('wsRemoveEventListener'),
      readyState: WebSocket.OPEN,
      url: 'ws://localhost:3000/ws',
      protocol: '',
      extensions: '',
      bufferedAmount: 0,
      binaryType: 'blob' as BinaryType,
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
      dispatchEvent: cy.stub()
    };
    
    win.WebSocket = cy.stub().returns(mockWS);
  });
});

// Verify HIPAA compliance indicators
Cypress.Commands.add('verifyHipaaCompliance', () => {
  // Check for encryption indicator
  cy.get('[data-cy="encryption-indicator"]').should('be.visible');
  
  // Check for audit trail indicator
  cy.get('[data-cy="audit-trail"]').should('be.visible');
  
  // Check for data classification labels
  cy.get('[data-cy="data-classification"]').should('be.visible');
  
  // Verify secure transmission indicator
  cy.get('[data-cy="secure-connection"]').should('contain', 'Secure');
  
  // Check for access control indicators
  cy.get('[data-cy="access-level"]').should('be.visible');
  
  // Verify timeout warning is present
  cy.get('[data-cy="session-timeout"]').should('be.visible');
});

// Check accessibility compliance
Cypress.Commands.add('checkA11y', () => {
  // Check for proper heading structure
  cy.get('h1').should('have.length', 1);
  
  // Verify all images have alt text
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt');
  });
  
  // Check for proper form labels
  cy.get('input[type="text"], input[type="email"], input[type="password"], textarea, select').each(($input) => {
    const id = $input.attr('id');
    if (id) {
      cy.get(`label[for="${id}"]`).should('exist');
    }
  });
  
  // Verify keyboard navigation works
  cy.get('button, a, input, select, textarea').first().focus();
  cy.focused().should('be.visible');
  
  // Check for skip links
  cy.get('body').type('{tab}');
  cy.get('[data-cy="skip-link"]').should('be.visible');
  
  // Verify ARIA labels and roles
  cy.get('[role]').should('have.length.greaterThan', 0);
  
  // Check color contrast (basic test)
  cy.get('button, a').each(($el) => {
    cy.wrap($el).should('have.css', 'color');
    cy.wrap($el).should('have.css', 'background-color');
  });
});

// Measure page performance
Cypress.Commands.add('measurePerformance', () => {
  cy.window().then((win) => {
    const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = win.performance.getEntriesByType('paint');
    
    // Log performance metrics
    cy.log('Page Load Time:', navigation.loadEventEnd - navigation.loadEventStart);
    cy.log('DOM Content Loaded:', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
    cy.log('First Paint:', paint.find(p => p.name === 'first-paint')?.startTime || 'N/A');
    cy.log('First Contentful Paint:', paint.find(p => p.name === 'first-contentful-paint')?.startTime || 'N/A');
    
    // Assert performance thresholds
    expect(navigation.loadEventEnd - navigation.loadEventStart).to.be.lessThan(3000);
    expect(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart).to.be.lessThan(2000);
  });
});

// Set mobile viewport
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport('iphone-x');
  
  // Verify mobile-specific elements
  cy.get('[data-cy="mobile-nav"]').should('be.visible');
  cy.get('[data-cy="desktop-nav"]').should('not.be.visible');
  
  // Check touch-friendly sizing
  cy.get('button, a').each(($el) => {
    cy.wrap($el).invoke('outerHeight').should('be.greaterThan', 44); // Minimum touch target size
  });
});

// Simulate offline mode
Cypress.Commands.add('goOffline', () => {
  cy.window().then((win) => {
    // Override navigator.onLine
    Object.defineProperty(win.navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    // Trigger offline event
    win.dispatchEvent(new Event('offline'));
    
    // Mock fetch to simulate network failure
    cy.intercept('**', { forceNetworkError: true }).as('offline');
  });
  
  // Verify offline indicator
  cy.get('[data-cy="offline-indicator"]').should('be.visible');
});

// Restore online mode
Cypress.Commands.add('goOnline', () => {
  cy.window().then((win) => {
    // Restore navigator.onLine
    Object.defineProperty(win.navigator, 'onLine', {
      writable: true,
      value: true
    });
    
    // Trigger online event
    win.dispatchEvent(new Event('online'));
  });
  
  // Remove offline intercepts
  cy.intercept('**').as('online');
  
  // Verify online indicator
  cy.get('[data-cy="online-indicator"]').should('be.visible');
});

// Helper function to wait for element with retry
Cypress.Commands.add('waitForElement', (selector: string, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible');
});

// Helper function to check element text with retry
Cypress.Commands.add('shouldContainText', (selector: string, text: string) => {
  cy.get(selector).should('be.visible').and('contain', text);
});

// Helper function to handle file uploads
Cypress.Commands.add('uploadFile', (selector: string, filePath: string, fileName?: string) => {
  cy.get(selector).selectFile(filePath);
  if (fileName) {
    cy.get('[data-cy="uploaded-file-name"]').should('contain', fileName);
  }
});

// Helper function to handle modal operations
Cypress.Commands.add('openModal', (triggerSelector: string, modalSelector: string) => {
  cy.get(triggerSelector).click();
  cy.get(modalSelector).should('be.visible');
});

Cypress.Commands.add('closeModal', (modalSelector: string, closeSelector?: string) => {
  if (closeSelector) {
    cy.get(closeSelector).click();
  } else {
    cy.get(modalSelector).type('{esc}');
  }
  cy.get(modalSelector).should('not.exist');
});

// Helper function to verify loading states
Cypress.Commands.add('verifyLoadingState', (loadingSelector: string, contentSelector: string) => {
  cy.get(loadingSelector).should('be.visible');
  cy.get(contentSelector).should('be.visible');
  cy.get(loadingSelector).should('not.exist');
});

// Helper function to handle form submissions
Cypress.Commands.add('submitForm', (formSelector: string, submitSelector: string, successSelector?: string) => {
  cy.get(submitSelector).click();
  if (successSelector) {
    cy.get(successSelector).should('be.visible');
  }
});

// Export commands for TypeScript support
export {};