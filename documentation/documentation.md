# Technical Architecture Documentation - Roamly

## General Overview

Roamly is a web application developed with a modern architecture based on Next.js, Supabase, and integrating the OpenAI API. The application uses SOLID development principles and follows an MVC architecture adapted for React applications.

## Technology Choices

### Frontend
- **Next.js 15**: React framework with server-side rendering (SSR) and static site generation (SSG)
- **React 19**: UI library with hooks for state management
- **TypeScript**: Static typing to improve maintainability and reduce errors
- **Tailwind CSS 4**: Utility-first CSS framework for responsive design

### Backend
- **Next.js API Routes**: API endpoints integrated into Next.js
- **Supabase**: Backend-as-a-Service solution including:
  - PostgreSQL database
  - Authentication and user management
  - File storage
- **OpenAI API**: Integration of language models (GPT-4o-mini) for content analysis and generation

### Testing and CI/CD
- **Jest**: Framework for unit testing
- **GitHub Actions**: Continuous integration automation
- **Vercel**: Deployment platform for Next.js


## Data Flow and Interactions

1. **User Flow**:
   - User enters a query on Roamly
   - React component captures the input and calls the OpenAI service
   - OpenAI service sends the request to the Next.js API Route
   - API Route communicates with the external OpenAI API
   - Response is returned to the client and displayed in the interface

2. **Authentication Flow**:
   - Authentication is handled by Supabase Auth
   - JWT tokens are stored in secure cookies
   - API Routes verify authentication for protected operations

## Unit Tests

The project uses Jest for unit testing, with particular focus on:

- **Service Tests**: Verification of correct API calls
- **Component Tests**: Validation of rendering and interactions
- **Hook Tests**: Validation of state management logic


## Continuous Integration / Continuous Deployment

### GitHub Actions

The CI workflow is configured to automatically run tests on pushes to main branches:

```yaml
name: Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
        cache: 'npm'
    - run: npm ci
    - run: npm test
```

### Vercel Deployment

Deployment is automated via Vercel, with:
- Preview deployments for each pull request
- Automatic deployment to the production environment when merging to `main`
- Automatic rollback in case of failure

## SOLID Principles Applied

The project follows SOLID principles to maintain a clean and maintainable architecture:

1. **Single Responsibility**: Each class and component has a single responsibility
2. **Open/Closed**: Entities are open for extension but closed for modification
3. **Liskov Substitution**: Derived classes can substitute their base classes
4. **Interface Segregation**: Specific interfaces are preferred over general interfaces
5. **Dependency Inversion**: Dependency on abstractions rather than concrete implementations

Example with the OpenAI service:
- The `OpenAIService` class is solely responsible for communication with the OpenAI API
- The use of the Singleton pattern allows for efficient instance management
- The interface is clear and focused on specific operations

## Security

- **Environment Variables**: API keys are stored in environment variables
- **CORS**: Appropriate configuration to limit cross-origin requests
- **Authentication**: Use of Supabase Auth for secure authentication
- **Input Validation**: Server-side validation of incoming data

## Evolution Perspectives

1. **Integration Tests**: Add integration tests with Cypress
2. **Containerization**: Add Docker support for local development
3. **Monitoring**: Integrate a monitoring system like Sentry
4. **Internationalization**: Add multi-language support with next-i18next

## Conclusion

The architecture adopted for Roamly is modular, scalable, and follows modern development best practices. The use of Next.js with Supabase and OpenAI provides a solid foundation for the development of a performant and maintainable application.