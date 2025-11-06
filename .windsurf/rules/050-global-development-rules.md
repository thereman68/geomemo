# Global Development Rules

## Core Principles

- Always prefer simple, elegant solutions (KISS principle)
- Avoid duplication of code (DRY principle); check existing codebase first
- Only add functionality when explicitly needed (YAGNI principle)
- Prefer iteration and modularisation over code duplication

## Coding Standards

### 1. Component Structure

- Use the latest framework features
- Keep components focused on a single responsibility
- Organize template, script, and styles in a consistent order
- Use scoped styles
- Use Vue 3 Composables when re-using logic in another component
- This site will later be converted to use React.js and associated frameworks, bear this in mind when coding and use the same principles where possible. If using external libraries try to choose ones that are compatible with React.js where possible. Sue coding techniques that will ease conversion later.    

### 2. State Management

- Use a centralized state management solution
- Keep stores organized by domain/feature
- Access stores using their respective utility functions

### 3. Routing

- Define routes in a dedicated directory
- Handle navigation using the framework's router
- Each main view should correspond to a route

### 4. Data Structure

- Content and configuration should be defined in JSON files
- JSON must be as human-readable as possible:
  - Use proper indentation (2 spaces)
  - Include descriptive keys
  - Use consistent formatting
  - Organize data logically
- Maintain consistent data structure formats

### 5. Styling

- Follow a defined colour scheme using variables
- Maintain responsive design principles
- Use consistent class naming conventions
- Use utility classes for common styling patterns and responsive breakpoints e.g. Vuetify classes
- Implement media queries for any extra responsive breakpoints
- Use CSS Inheritance, Cascade, and Specificity principles to avoid needless class duplication
- Maintain low specificity in selectors and avoid chaining class selectors
- Use semantic class names that describe what the rule does or the type of content it affects
- Try to avoid tying CSS too closely to markup structure
- Try to avoid global and element selectors to prevent styling conflicts and reduce the risk of bloat in the CSS
- Try to avoid using id selectors
- Try to avoid overly specific selectors

### 6. User Interaction

- Ensure features are accessible from appropriate navigation
- Provide clear user feedback
- Maintain consistent progress tracking
- Support integration with learning management systems if applicable

### 7. Component Reuse

- Leverage existing components
- Follow established patterns when creating new components
- Maintain consistent naming conventions

### 8. External Integrations

- Use dedicated utility functions for external integrations
- Ensure proper loading/saving of user state
- Handle session events correctly
- In development environments, use Local Shared Object fallbacks for external data storage that might not be available (when not hosted in the final location)

## Naming Conventions

- **Components**: PascalCase (e.g., `MainMenu.vue`, `QuestionCard.vue`)
- **Files/Directories**: kebab-case (e.g., `user-profile.js`, `data-utilities.js`)
- **Variables/Functions**: camelCase (e.g., `userData`, `fetchUserData()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINT`, `MAX_ATTEMPTS`)
- **CSS Classes**: kebab-case (e.g., `primary-button`, `nav-item`)
- **Component Props**: camelCase (e.g., `itemCount`, `isActive`)
- **Store Modules**: camelCase (e.g., `userStore`, `settingsStore`)
- **Boolean Variables**: Use "is", "has", or "should" prefix (e.g., `isActive`, `hasPermission`)

## Feature Organisation

- Group related features in dedicated directories
- Organize content by logical sections
- Maintain a consistent feedback system
- Implement comprehensive progress tracking

## Development Workflow

1. Understand existing structure before making changes
2. Test changes across all scenarios and viewports
3. Ensure responsive design on mobile and desktop
4. Validate that integrations remain functional
5. Follow established patterns and conventions

## Code Quality Standards

### Documentation

- Add JSDoc comments for functions, classes, and complex code
- Include meaningful descriptions for public APIs
- Document parameters, return values, and exceptions
- Keep inline comments focused on explaining "why" not "what"
- Update documentation when code changes
- Maintain clear README with setup instructions
- Document current version of node being used
- Document API interactions and data flows
- Document permission requirements

### Error Handling

- Implement consistent error handling patterns
- Use try/catch blocks appropriately
- Provide meaningful error messages
- Log errors with sufficient context
- Gracefully degrade functionality when errors occur

### Performance

- Minimise DOM manipulations
- Optimise rendering and reflows
- Use efficient data structures and algorithms
- Implement lazy loading for heavy components
- Monitor and optimise bundle sizes
- Gracefully dispose of any listeners or event handlers when components are unmounted
- Use proper cleanup for subscriptions and intervals

### Accessibility

- Follow WCAG guidelines (minimum AA compliance)
- Use semantic HTML elements
- Include proper ARIA attributes
- Ensure keyboard navigation works properly e.g. tabbing order
- Ensure tabbing order is trapped in a modal
- Test with screen readers

### Git Practices

- Write clear, descriptive commit messages
- Use conventional commit format (type: subject)
- Keep commits focused on single changes
- Review code before merging

### Security

- Ensure text input <input type="text"> form elements have validation that enforces a maximum text input of 200 chars and text area <textarea> a maximum 1000 chars. Offer the user a countdown indicator e.g. counter x / 200
- JSON.stringify any free text entry data sent to the API
- Validate all user inputs
- Sanitise data before rendering
- Avoid storing sensitive information in client-side storage
- Implement proper authentication and authorisation checks

## RESTful API Standards

### Authentication & Security
- Use cookies + CSRF token pattern for API calls
- Store CSRF token in Pinia
- Attach CSRF token to API requests via headers
- Maintain reactive form state in Pinia
- Handle optimistic updates: Update Pinia first, then sync server
- Retry failed requests gracefully

### Performance Optimization
- Debounce/throttle API calls (only send after 500ms inactivity)
- Batch multiple interactions into one API call to reduce overhead
- Use optimistic UI pattern: Update Pinia first, then sync server

## Logout Responsibilities

When user logs out, must complete all of the following:
- Clear Local State from Pinia
- Remove CSRF token from Pinia
- Clear any unsynced or saved form responses
- Reset login/session flags (e.g., userLoggedIn = false)
