# Style Guide

This document outlines the coding style and conventions used in the snap-7715-permissions project.

## General

- Use UTF-8 encoding for all files
- Use 2 spaces for indentation

## TypeScript/JavaScript

### Naming Conventions

- Use camelCase for variables, functions, and method names
- Use camelCase for file names

### Documentation

- Use JSDoc comments for public APIs
- Include descriptions for parameters and return values
- Document thrown exceptions

Example:
```typescript
/**
 * Description of the function.
 *
 * @param options - The options object.
 * @param options.param1 - Description of param1.
 * @returns Description of the return value.
 * @throws When something goes wrong.
 */
```

### Error Handling

- Use descriptive error messages
- Prefer custom error classes for specific error types
- Handle errors appropriately

## Testing

- Use Jest for unit and integration tests
- Name test files with `.test.ts` suffix
- Group related tests with `describe` blocks
- Use clear and descriptive test names with `it` statements
- Use mocks for external dependencies

Example:
```typescript
describe('MyFunction', () => {
  it('should return the expected result when given valid input', () => {
    // Arrange
    const input = 'valid input';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

## Code Organization

- Organize code by feature or domain
- Keep files focused on a single responsibility
- Use barrel exports (index.ts files) sparingly, and with named exports, to simplify imports
- Separate interfaces/types into their own files when they become large

## Git Workflow

- Create feature branches from `main`
- Use descriptive commit messages
- All pull requests must be linked to an open issue
- Pull requests should target the `main` branch

## Project Structure

- `/packages`: Contains all the project packages
- `/scripts`: Contains build and utility scripts
- `/docs`: Project documentation
- `/external`: External dependencies

## Dependencies

- Use Yarn as the package manager
- Pin dependency versions where appropriate

## Best Practices

1. Follow the Single Responsibility Principle
2. Write pure functions when possible
3. Use async/await for asynchronous code
4. Use descriptive variable names
5. Keep functions small and focused
6. Use TypeScript's type system to prevent bugs
7. Document complex logic with comments
8. Write tests for all new functionality 