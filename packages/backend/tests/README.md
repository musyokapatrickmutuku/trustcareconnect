# Backend Tests

## Test Structure
```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for canister methods
└── fixtures/       # Test data and mocks
```

## Running Tests
```bash
# Run all backend tests
npm run test:backend

# Run specific test file
dfx canister call backend healthCheck
```

## Test Coverage Goals
- [ ] Patient management functions
- [ ] Doctor management functions  
- [ ] Query lifecycle
- [ ] Authorization checks
- [ ] Error handling