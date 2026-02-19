# AGENTS.md - snap-7715-permissions Project Guide

This document provides agents with essential information for working on the snap-7715-permissions monorepo.

## Project Overview

This is a monorepo implementing ERC-7715 permissions for MetaMask Snaps. It contains:

- **@metamask/permissions-kernel-snap** (`packages/kernel-snap`) - Kernel snap for managing permissions
- **@metamask/gator-permissions-snap** (`packages/gator-snap`) - DeleGator permissions snap
- **Shared utilities and types** (`packages/snap-lib`) - Common code across snaps
- **Development/test site** (`packages/site`) - Local testing environment

## Technology Stack

- **Node Version**: 20.x or 22.x (see `.nvmrc`)
- **Package Manager**: Yarn 4.10.1 with workspaces
- **Language**: TypeScript 5.8.3 (strict mode)
- **Testing**: Jest with @metamask/snaps-jest
- **Linting**: ESLint 9 with MetaMask configs
- **Formatting**: Prettier 3.6.2
- **Runtime**: MetaMask Snaps

## Build Commands

```bash
# Install dependencies
yarn install

# Full setup with snap submodules
yarn prepare:snap

# Build all packages
yarn build

# Build and pack for distribution
yarn build:pack
```

## Development Commands

```bash
# Start development servers
yarn start
# Access at http://localhost:8000/
# Snaps:
#   - permissions-kernel-snap: local:http://localhost:8081
#   - gator-permissions-snap: local:http://localhost:8082

# Run tests
yarn test

# Watch mode for tests
yarn test --watch

# Linting
yarn lint              # Run all linters
yarn lint:eslint       # ESLint only
yarn lint:fix          # Fix linting issues
yarn lint:misc         # Check markdown, JSON, etc.

# Update and validate changelogs
yarn changelog:update
yarn changelog:validate
```

## Code Style and Standards

### Formatting Requirements

- **Prettier** automatically formats code with:
  - Single quotes (')
  - 2-space indentation
  - Trailing commas throughout
  - Quote props as-needed

All code must be formatted before committing. Linting will catch violations.

### TypeScript Strictness

- `strict: true` enabled - full type checking
- `exactOptionalPropertyTypes: true` - no undefined on optional properties
- `noUncheckedIndexedAccess: true` - require null checks on indexed access
- Target: ES2020, Module: Node16

### ESLint Rules

Key rules enforced:
- No `console.log` in production code
- No unused variables
- No untyped `any` without `@ts-expect-error`
- Imports must be properly sorted
- JSDoc comments required for public APIs

## Testing Standards

- **Test files**: Use `*.test.ts` or `*.spec.ts` suffixes
- **Structure**: Co-located with source or in `test/` directories
- **Framework**: Jest with @metamask/snaps-jest
- **Pattern**: Arrange-Act-Assert
- **Coverage**: Test happy paths AND error cases
- **Mocking**: Mock external dependencies (no real HTTP calls)

Example:
```typescript
describe('parsePermission', () => {
  it('parses valid permission objects', () => {
    const input = { name: 'test', args: [] };
    const result = parsePermission(input);
    expect(result).toEqual({ name: 'test', args: [] });
  });

  it('throws an error with invalid input', () => {
    expect(() => parsePermission({ name: '', args: [] })).toThrow();
  });
});
```

## Error Handling

- Use MetaMask SDK error types: `InternalError`, `InvalidParamsError`, etc.
- Always provide meaningful error messages with context
- Never silently fail - log or throw on unexpected conditions
- Validate all inputs, especially at snap RPC boundaries

Example:
```typescript
if (!snapId) {
  throw new InternalError('Snap ID is required');
}
```

## Type Design

- Declare types explicitly for all public APIs
- Use discriminated unions for complex variants
- Avoid `any` - use `unknown` and narrow types
- Leverage `const` assertions for literal types

Example:
```typescript
// Good: Discriminated union
type Result =
  | { success: true; data: string }
  | { success: false; error: Error };

// Bad: Optional properties without discrimination
type Result = {
  success: boolean;
  data?: string;
  error?: Error;
};
```

## Snap Development Guidelines

### Entry Points

- Single entry point per snap (e.g., `src/index.ts`)
- Export `onRpcRequest` handler and optional `onInstall`, `onUpdate`, etc.
- Use snap manifest (`snap.manifest.ts`) for metadata

### RPC Handler Pattern

```typescript
export const onRpcRequest: OnRpcRequestHandler = async (request) => {
  const { method, params } = request;

  switch (method) {
    case 'method1':
      return handleMethod1(params);
    case 'method2':
      return handleMethod2(params);
    default:
      throw new InvalidParamsError(`Unknown method: ${method}`);
  }
};
```

### State Management

- Use `snap.request()` with `snap_manageState` for persistence
- State must be JSON-serializable
- Keep state minimal - only store what's necessary
- Always validate state when retrieving it

## Environment Variables

All packages throw build-time errors if required env vars are missing. Check `.env.example` in each package.

Common variables:
- `SNAP_ENV` - Environment (development/production)
- `KERNEL_SNAP_ID` - Snap ID of permissions kernel snap
- `STORE_PERMISSIONS_ENABLED` - Feature flag for storage ("true"/"false")

## Git Workflow

### Commit Messages

Follow the style from recent commits:
- Present tense ("add feature" not "added feature")
- Reference issues when relevant (#123)
- Keep first line under 72 characters

Example: `fix: update intro permission control message for clarity (#269)`

### Branches

- Feature branches: `feat/feature-name`
- Bug fix branches: `fix/issue-name`
- Always create a PR for review

### PR Guidelines

1. **Clear description** - Explain what and why (not just what)
2. **Link issues** - Reference related issues (#123)
3. **Test coverage** - Include tests for all new code
4. **Documentation** - Update docs if behavior changes
5. **CI passes** - All linting and tests must pass

## Dependency Management

- Add dependencies with `yarn add` in the appropriate workspace package
- Prefer existing dependencies in shared packages
- Avoid duplication across workspaces
- Check root `package.json` `resolutions` for pinned versions
- Scripts are disabled by default for security; use `lavamoat.allowScripts`

## Security Considerations

1. **No hardcoded secrets** - Use environment variables
2. **Validate all inputs** - Especially RPC parameters
3. **Minimize permissions** - Request only necessary snap permissions
4. **No arbitrary code execution** - Don't use `eval` or `Function`
5. **Sanitize logs** - Never log sensitive data

## Code Comments

- Write comments explaining **why**, not **what**
- Use JSDoc for public APIs
- Keep comments up-to-date with code

Good example:
```typescript
// Filter out archived accounts to show only active users
const activeAccounts = accounts.filter(a => !a.archived);
```

Bad example:
```typescript
const name = user.name; // Get the user's name
```

## Performance Guidelines

1. **Minimize state size** - Snap state persists to storage
2. **Batch RPC calls** - Group related requests to reduce overhead
3. **Lazy load dependencies** - Don't import unused modules
4. **Efficient serialization** - Keep JSON payloads small

## Troubleshooting

### Build Errors
- Verify environment variables are set correctly
- Check Node version matches `.nvmrc`
- Clear yarn cache: `yarn cache clean`
- Rebuild: `yarn build`

### Test Failures
- Ensure snaps are built before testing
- Check test environment variables are configured
- Run specific test: `yarn test --testNamePattern="test name"`

### Snap Loading Issues
- Verify localhost ports (8081, 8082) are available
- Check Flask version is 12.14.2+
- Clear Flask cache in settings
- Validate snap manifest is correct

## Key Files and Directories

- `AGENTS.md` - This file - project guidelines for agents
- `CONTRIBUTING.md` - Contribution guidelines
- `README.md` - Project overview
- `packages/*/src/index.ts` - Snap entry points
- `packages/*/snap.manifest.ts` - Snap metadata
- `tsconfig.json` - TypeScript configuration (strict mode)
- `.prettierrc.js` - Prettier formatting rules
- `.eslintrc.js` - ESLint configuration
- `yarn.lock` - Dependency lockfile

## References

- [ERC-7715 Specification](https://eip.tools/eip/7715)
- [ERC-7710 Specification](https://eip.tools/eip/7710)
- [MetaMask Snaps Docs](https://docs.metamask.io/snaps/)
- [MetaMask Snaps Repository](https://github.com/MetaMask/snaps)
- [Delegation Framework](https://github.com/MetaMask/delegation-framework)
