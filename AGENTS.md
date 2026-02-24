# AGENTS.md - snap-7715-permissions Project Guide

This document provides agents with essential information for working on the snap-7715-permissions monorepo.

## Project Overview

This is a monorepo implementing ERC-7715 permissions for MetaMask Snaps. It contains:

- **@metamask/permissions-kernel-snap** (`packages/permissions-kernel-snap`) - Kernel snap managing the permissions offer registry
- **@metamask/gator-permissions-snap** (`packages/gator-permissions-snap`) - DeleGator permissions snap that creates delegation accounts
- **@metamask/shared** (`packages/shared`) - Shared utilities, types, constants, and testing utilities across snaps
- **Development/test site** (`packages/site`) - Local testing environment for dApp development

### Architecture Summary

- **Kernel Snap**: Manages a `permissions offer registry` listing all permissions a user is willing to grant via ERC-7715 requests
- **Gator Snap**: Creates DeleGator accounts and enables sites to request ERC-7715 permissions with user review via custom UI dialogs

## Technology Stack

- **Node Version**: 20.x or 22.x (see `.nvmrc`: `^20 || >=22`)
- **Package Manager**: Yarn 4.10.1 with workspaces
- **Language**: TypeScript 5.8.3 (strict mode)
- **Testing**: Jest with @metamask/snaps-jest
- **Linting**: ESLint 9 (flat config - `eslint.config.mjs`)
- **Formatting**: Prettier 3.6.2
- **Runtime**: MetaMask Snaps (Flask >= 12.14.2)

## Package Structure

```
packages/
├── permissions-kernel-snap/  # Kernel snap (port 8081)
├── gator-permissions-snap/   # DeleGator snap (port 8082)
├── shared/                   # Shared utilities and types
└── site/                     # Development testing site (port 8000)
```

## Prerequisites

1. **MetaMask Flask**: >= 12.14.2
2. **Node.js**: 20.x or 22.x (use `nvm use` to switch)
3. **Yarn**: 4.10.1 (managed via `packageManager` field)
4. **Environment variables**: See `.env.example` in each package

## Quick Start

```bash
# Install dependencies and set up snap submodules
yarn prepare:snap

# Build all packages
yarn build

# Start development servers (site on port 8000, snaps on 8081/8082)
yarn start
```

## Build Commands

```bash
# Install dependencies
yarn install

# Full setup with snap submodules
yarn prepare:snap

# Build all packages (parallel, topological)
yarn build

# Build and pack for distribution
yarn build:pack

# Update and validate changelogs
yarn changelog:update
yarn changelog:validate
```

## Development Commands

```bash
# Start all development servers
yarn start
# Access at http://localhost:8000/
# - permissions-kernel-snap: local:http://localhost:8081
# - gator-permissions-snap: local:http://localhost:8082

# Run tests (parallel across workspaces)
yarn test

# Watch mode for tests
yarn test --watch

# Run tests in specific package
yarn workspace @metamask/gator-permissions-snap test

# Linting
yarn lint              # Run all linters
yarn lint:eslint       # ESLint only
yarn lint:fix          # Fix linting issues
yarn lint:misc         # Check markdown, JSON, etc.
```

## Environment Variables

All packages throw build-time errors if required env vars are missing. Check `.env.example` in each package.

### Common Variables

| Variable | Description | Package |
|----------|-------------|---------|
| `SNAP_ENV` | Environment (development/production) | All |
| `KERNEL_SNAP_ID` | Snap ID of permissions kernel snap | gator-snap |
| `STORE_PERMISSIONS_ENABLED` | Feature flag for storage ("true"/"false") | All snaps |

### Package-Specific Setup

Each package requires specific environment variables. See:
- `packages/permissions-kernel-snap/.env.example`
- `packages/gator-permissions-snap/.env.example`
- `packages/site/.env.example`

## Code Style and Standards

### Formatting Requirements

- **Prettier** automatically formats code with:
  - Single quotes (`'`)
  - 2-space indentation
  - Trailing commas throughout
  - Quote props as-needed

All code must be formatted before committing. Run `yarn lint:fix` to auto-fix.

### TypeScript Strictness

The project uses strict TypeScript configuration:

- `strict: true` - Full type checking
- `exactOptionalPropertyTypes: true` - No implicit undefined on optional properties
- `noUncheckedIndexedAccess: true` - Require null checks on indexed access
- Target: ES2020, Module: Node16

### ESLint Configuration

The project uses ESLint 9 with flat config (`eslint.config.mjs`). Key rules:

- No `console.log` in production code
- No unused variables
- No untyped `any` without `@ts-expect-error`
- Imports must be properly sorted
- JSDoc comments required for public APIs (classes and function declarations)
- Only allow throwing Snap SDK error objects

## Testing Standards

- **Test files**: Use `*.test.ts` suffix (not `*.spec.ts`)
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

> **Important**: `@metamask/snaps-jest` requires the snap to be built first. Always run `yarn build` before testing.

## Error Handling

- Use MetaMask SDK error types: `InternalError`, `InvalidParamsError`, etc.
- Always provide meaningful error messages with context
- Never silently fail - log or throw on unexpected conditions
- Validate all inputs, especially at snap RPC boundaries
- Reference: https://docs.metamask.io/snaps/how-to/communicate-errors/

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

## Code Comments

- Write comments explaining **why**, not **what**
- Use JSDoc for public APIs (functions and classes)
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

## Git Workflow

### Commit Messages

Follow the conventional commits style:
- Present tense ("add feature" not "added feature")
- Reference issues when relevant (#123)
- Keep first line under 72 characters

Types: `fix:`, `feat:`, `docs:`, `chore:`, `refactor:`, etc.

Example: `fix: update intro permission control message for clarity (#269)`

### Branches

- Feature branches: `feat/feature-name`
- Bug fix branches: `fix/issue-name`
- Target: `main` branch for PRs

### PR Guidelines

1. **Must have an open issue** - All PRs must be paired with an issue
2. **Clear description** - Explain what and why (not just what)
3. **Link issues** - Reference related issues (#123)
4. **Test coverage** - Include tests for all new code
5. **Follow style guide** - See `docs/styleGuide.md`
6. **CI passes** - All linting and tests must pass

## Dependency Management

- Add dependencies with `yarn add` in the appropriate workspace package
- Prefer existing dependencies in shared packages (`@metamask/shared`)
- Avoid duplication across workspaces
- Check root `package.json` `resolutions` for pinned versions
- Scripts are disabled by default for security; use `lavamoat.allowScripts`

## Security Considerations

1. **No hardcoded secrets** - Use environment variables
2. **Validate all inputs** - Especially RPC parameters
3. **Minimize permissions** - Request only necessary snap permissions
4. **No arbitrary code execution** - Don't use `eval` or `Function`
5. **Sanitize logs** - Never log sensitive data

## Performance Guidelines

1. **Minimize state size** - Snap state persists to storage
2. **Batch RPC calls** - Group related requests to reduce overhead
3. **Lazy load dependencies** - Don't import unused modules
4. **Efficient serialization** - Keep JSON payloads small

## Troubleshooting

### Build Errors

- Verify environment variables are set correctly
- Check Node version matches `.nvmrc` (`nvm use`)
- Clear yarn cache: `yarn cache clean`
- Rebuild: `yarn build`

### Test Failures

- Ensure snaps are built before testing: `yarn build`
- Check test environment variables are configured
- Run specific test: `yarn test --testNamePattern="test name"`
- Build specific package: `yarn workspace @metamask/gator-permissions-snap build`

### Snap Loading Issues

- Verify localhost ports (8000, 8081, 8082) are available
- Check Flask version is 12.14.2+
- Clear Flask cache in settings
- Validate snap manifest is correct

## Key Files and Directories

- `AGENTS.md` - Project guidelines for agents (this file)
- `CONTRIBUTING.md` - Contribution guidelines
- `README.md` - Project overview and quick start
- `docs/styleGuide.md` - Detailed coding style guide
- `packages/*/src/index.ts` - Snap entry points
- `packages/*/snap.manifest.ts` - Snap metadata
- `packages/*/.env.example` - Environment variable examples
- `tsconfig.json` - Root TypeScript configuration
- `.prettierrc.js` - Prettier formatting rules
- `eslint.config.mjs` - ESLint flat config
- `yarn.lock` - Dependency lockfile

## Additional Documentation

- `docs/addingNewPermissionTypes.md` - How to add new permission types
- `docs/manifest-management.md` - Snap manifest management
- `docs/release.md` - Release process
- `docs/snapPreinstall.md` - Pre-installation setup
- `packages/gator-permissions-snap/docs/architecture.md` - Gator snap architecture

## References

- [ERC-7715 Specification](https://eip.tools/eip/7715)
- [ERC-7710 Specification](https://eip.tools/eip/7710)
- [MetaMask Snaps Docs](https://docs.metamask.io/snaps/)
- [MetaMask Snaps Repository](https://github.com/MetaMask/snaps)
- [Delegation Framework](https://github.com/MetaMask/delegation-framework)
- [MetaMask Snaps Error Handling](https://docs.metamask.io/snaps/how-to/communicate-errors/)
