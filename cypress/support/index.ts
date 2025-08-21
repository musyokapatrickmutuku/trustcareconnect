// Import commands
import './commands';

// Import third-party commands if needed
// import 'cypress-axe'; // For accessibility testing
// import 'cypress-file-upload'; // For file upload testing

// Global configuration and setup
beforeEach(() => {
  // Set up interceptors for API calls
  cy.intercept('GET', '/api/health', { statusCode: 200, body: { status: 'healthy' } }).as('healthCheck');
  
  // Set up common viewport
  cy.viewport(1280, 720);
  
  // Clear application state before each test
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore specific errors that don't affect the test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  
  // Return true to fail the test, false to ignore
  return true;
});

// Custom configurations
declare global {
  namespace Cypress {
    interface Chainable {
      waitForElement(selector: string, timeout?: number): Chainable<JQuery<HTMLElement>>;
      shouldContainText(selector: string, text: string): Chainable<JQuery<HTMLElement>>;
      uploadFile(selector: string, filePath: string, fileName?: string): Chainable<void>;
      openModal(triggerSelector: string, modalSelector: string): Chainable<void>;
      closeModal(modalSelector: string, closeSelector?: string): Chainable<void>;
      verifyLoadingState(loadingSelector: string, contentSelector: string): Chainable<void>;
      submitForm(formSelector: string, submitSelector: string, successSelector?: string): Chainable<void>;
    }
  }
}