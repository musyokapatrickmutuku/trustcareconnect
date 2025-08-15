# TrustCareConnect Architecture Overview

## System Architecture

TrustCareConnect is built using a modern, scalable architecture with clear separation of concerns and industry best practices.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │   AI Proxy      │    │  ICP Backend    │
│                 │    │                 │    │                 │
│ - Patient Portal│◄──►│ - OpenAI API    │◄──►│ - Motoko Smart  │
│ - Doctor Portal │    │ - Claude API    │    │   Contracts     │
│ - Query Management   │ - Mock Responses│    │ - Data Storage  │
│                 │    │ - Rate Limiting │    │ - Business Logic│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  External APIs  │
                    │                 │
                    │ - OpenAI GPT    │
                    │ - Claude API    │
                    └─────────────────┘
```

## Core Components

### 1. Frontend (React Application)

**Location**: `packages/frontend/`

**Technology Stack**:
- React 18+ with Hooks
- TypeScript for type safety
- Tailwind CSS for styling
- ICP Agent for blockchain communication

**Architecture**:
- **Components**: Modular, reusable UI components
- **Pages**: Route-based page components
- **Services**: API communication layer
- **Store**: State management (Context API)
- **Utils**: Helper functions and formatters

**Key Features**:
- Dual portal interface (Patient/Doctor)
- Real-time query management
- Responsive design
- Form validation and error handling

### 2. AI Proxy (Express.js Service)

**Location**: `packages/ai-proxy/`

**Technology Stack**:
- Node.js with Express.js
- RESTful API design
- Multiple AI provider integration
- Security middleware (CORS, Rate Limiting, Helmet)

**Architecture**:
- **Controllers**: Request handling and validation
- **Services**: AI provider integrations
- **Middleware**: Security and logging
- **Routes**: API endpoint definitions

**Key Features**:
- Multi-provider AI support (OpenAI, Claude, Mock)
- Automatic fallback to mock responses
- Rate limiting and security controls
- Medical-specific prompt engineering

### 3. ICP Backend (Motoko Smart Contracts)

**Location**: `packages/backend/`

**Technology Stack**:
- Motoko programming language
- Internet Computer Protocol (ICP)
- Stable memory for persistence
- HTTP outcalls for external APIs

**Architecture**:
- **Controllers**: Business logic coordination
- **Services**: Core functionality (Patient, Doctor, Query management)
- **Models**: Data type definitions
- **Utils**: Helper functions

**Key Features**:
- Decentralized data storage
- Immutable audit trail
- Role-based access control
- Automatic state persistence

## Data Flow

### 1. Patient Query Submission

```
Patient Frontend → ICP Backend → AI Proxy → External AI API
                              ↓
                         Store Query + AI Draft
                              ↓
                         Notify Doctor
```

### 2. Doctor Response Process

```
Doctor Frontend → ICP Backend → Retrieve Query + AI Draft
                              ↓
                         Doctor Reviews/Edits
                              ↓
                         Submit Final Response
                              ↓
                         Patient Notification
```

## Security Architecture

### Frontend Security
- Input validation and sanitization
- XSS protection
- Secure API communication
- Environment-based configuration

### AI Proxy Security
- CORS configuration
- Rate limiting per IP
- Request size limits
- Input sanitization
- API key management

### Backend Security
- Canister-level access control
- Input validation
- Secure HTTP outcalls
- Immutable audit logs

## Scalability Considerations

### Horizontal Scaling
- **Frontend**: CDN deployment, multiple regions
- **AI Proxy**: Load balancer, multiple instances
- **Backend**: ICP automatic scaling

### Performance Optimization
- **Frontend**: Code splitting, lazy loading, caching
- **AI Proxy**: Response caching, connection pooling
- **Backend**: Efficient data structures, query optimization

### Data Management
- **Stable Memory**: Persistent data across upgrades
- **Incremental Updates**: Only update changed data
- **Query Optimization**: Efficient filtering and sorting

## Technology Choices

### Why React?
- Large ecosystem and community
- Component reusability
- Strong TypeScript support
- Excellent developer experience

### Why Express.js for AI Proxy?
- Lightweight and fast
- Extensive middleware ecosystem
- Easy integration with AI APIs
- Good error handling capabilities

### Why Motoko/ICP?
- Decentralized and secure
- Automatic persistence
- Built-in HTTP outcalls
- Predictable costs

### Why Monorepo Structure?
- Shared code and types
- Consistent tooling
- Simplified dependency management
- Better collaboration

## Development Principles

### 1. Separation of Concerns
- Clear boundaries between layers
- Single responsibility principle
- Modular architecture

### 2. Type Safety
- TypeScript throughout
- Strong typing at boundaries
- Compile-time error checking

### 3. Error Handling
- Graceful degradation
- Meaningful error messages
- Proper logging and monitoring

### 4. Testing Strategy
- Unit tests for business logic
- Integration tests for APIs
- End-to-end tests for critical flows

### 5. Security First
- Input validation everywhere
- Principle of least privilege
- Regular security audits

## Future Considerations

### Planned Enhancements
- Real-time notifications
- Advanced analytics dashboard
- Mobile application
- Multi-language support

### Scaling Plans
- Microservices architecture
- Container deployment
- Advanced monitoring
- Performance optimization

## Related Documentation

- [Development Setup](../development/getting-started.md)
- [API Reference](../api/backend-api.md)
- [Deployment Guide](../deployment/production.md)
- [Security Guidelines](./security.md)